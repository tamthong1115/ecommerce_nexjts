import { prisma } from '@/lib/db';
import { Decimal } from '@prisma/client/runtime/library';
import { ServiceError } from '@/lib/service-error';
import {
  freezeShopBalanceForPayout,
  updateShopBalance,
  upsertPendingBalance,
} from '@/features/payment_transaction/services/shop_balance.service';
import {
  createOrderPaidLedger,
  createPayoutLedgers,
  createSettlementLedgers,
  payoutFailedLedgers,
} from '@/features/payment_transaction/services/ledger.service';
import {
  enqueueSettlement,
  getPendingSettlement,
  getUniqueSettlement,
} from '@/features/payment_transaction/services/settlement.service';
import {
  createPayoutRequest,
  getPayoutRequest,
} from '@/features/payment_transaction/services/payout.service';
import { $Enums, Prisma } from '@/lib/generated/prisma';
import InputJsonValue = Prisma.InputJsonValue;
import PayoutStatus = $Enums.PayoutStatus;
import { getPaymentId } from '@/features/payment/services/order_payment.service';
import LedgerType = $Enums.LedgerType;
import { DbClient } from '@/types/api';

const toDecimal = (val: Decimal | number) => new Decimal(val);

// export const updateLocalPaymentHook = async (
//   db: DbClient,
//   eventType: string,
//   payload: any
// ) => {)

export const customerPaidOrderSuccessUsecase = async (
  db: DbClient,
  shopId: string,
  amountInput: Decimal | number,
  orderId: string,
  paymentId?: string,
  idempotencyKey?: string
) => {
  const amount = toDecimal(amountInput);
  const existingLedger = await db.ledgerEntry.findFirst({
    where: {
      orderId: orderId,
      type: LedgerType.ORDER_PAID,
    },
  });

  if (existingLedger) {
    return;
  }

  const updatedBalance = await upsertPendingBalance(db, shopId, amount);

  const balanceAfter = updatedBalance.pending;
  const balanceBefore = balanceAfter.minus(amount);

  await createOrderPaidLedger(db, {
    shopId,
    amount,
    orderId,
    idempotencyKey,
    paymentId,
    balanceBefore,
    balanceAfter,
  });

  //Now + 3 days to settle
  const settleDate = new Date();
  settleDate.setDate(settleDate.getDate() + 3);

  await enqueueSettlement(db, {
    shopId,
    orderId,
    amount,
    dueAt: settleDate,
  });

  return updatedBalance;
};

export const paySettleQueueUsecase = async () => {
  const now = new Date();
  const pendingSettlements = await getPendingSettlement(now);

  for (const settlement of pendingSettlements) {
    try {
      // Transaction nhỏ cho từng đơn
      await prisma.$transaction(async (tx) => {
        const checkItem = await getUniqueSettlement(tx, settlement.id);
        if (!checkItem || checkItem.status !== 'PENDING') return;

        const shopBalance = await updateShopBalance(
          tx,
          settlement.shopId,
          settlement.amount
        );

        const pendingAfter = shopBalance.pending;
        const pendingBefore = pendingAfter.plus(settlement.amount);
        const balanceAfter = shopBalance.available;
        const balanceBefore = balanceAfter.minus(settlement.amount);

        const paymentResult = await getPaymentId(tx, settlement.orderId);

        await createSettlementLedgers(tx, {
          walletId: settlement.shopId,
          amount: settlement.amount,
          pendingBefore: pendingBefore,
          pendingAfter: pendingAfter,

          availableBefore: balanceBefore,
          availableAfter: balanceAfter,

          orderId: settlement.orderId,
          paymentId: paymentResult?.paymentId ?? null,
        });

        await tx.settlementQueue.update({
          where: { id: settlement.id },
          data: {
            status: 'PROCESSED',
          },
        });
      });
    } catch (error) {
      console.error(`Lỗi xử lý settlement ID ${settlement.id}:`, error);
    }
  }
};

export const shopSendWithdrawMoneyUsecase = async (
  shopId: string,
  amountInput: Decimal | number,
  bankInfo: InputJsonValue,
  txnRef: string
) => {
  const amount = toDecimal(amountInput);
  return prisma.$transaction(async (tx) => {
    const shopValid = await tx.shopBalance.findUnique({
      where: { shopId: shopId },
    });
    if (!shopValid) {
      throw new ServiceError('Shop does not exist', 404);
    }

    if (shopValid.available.lessThan(amount)) {
      throw new ServiceError('Insufficient funds', 400);
    }

    const updatedBalance = await freezeShopBalanceForPayout(tx, {
      shopId: shopId,
      version: shopValid.version,
      amount: amount,
    });

    const balanceAfter = updatedBalance.available;
    const balanceBefore = balanceAfter.plus(amount);

    const payout = await createPayoutRequest(tx, {
      shopId: shopId,
      amount: amount,
      bankInfo: bankInfo,
      txRef: txnRef,
    });

    await createPayoutLedgers(tx, {
      shopId: shopId,
      amount: amount,

      balanceAfter: balanceAfter,
      balanceBefore: balanceBefore,

      payoutId: payout.id,
    });
    return updatedBalance;
  });
};

export const requestWithDrawMoneySuccess = async (
  shopId: string,
  amountInput: Decimal | number
) => {
  const amount = toDecimal(amountInput);
  return prisma.$transaction(async (tx) => {
    await tx.shopBalance.update({
      where: { shopId: shopId },
      data: {
        frozen: { decrement: amount },
        version: { increment: 1 },
      },
    });

    const payout = await getPayoutRequest(shopId);

    await tx.payoutRequest.update({
      where: { id: payout!.id },
      data: {
        status: PayoutStatus.COMPLETED,
      },
    });
  });
};

export const requestWithDrawnMoneyFailed = async (
  shopId: string,
  amountInput: Decimal | number
) => {
  const amount = toDecimal(amountInput);
  return prisma.$transaction(async (tx) => {
    const updateBalance = await tx.shopBalance.update({
      where: { shopId: shopId },
      data: {
        frozen: { decrement: amount },
        available: { increment: amount },
        version: { increment: 1 },
      },
    });

    const payout = await getPayoutRequest(shopId);
    await tx.payoutRequest.update({
      where: { id: payout!.id },
      data: {
        status: PayoutStatus.REJECTED,
      },
    });

    const balanceAfter = updateBalance.available;
    const balanceBefore = balanceAfter.minus(amount);

    await payoutFailedLedgers(tx, {
      shopId: shopId,
      amount,
      balanceBefore,
      balanceAfter,
      payoutId: payout!.id,
    });

    return updateBalance;
  });
};
