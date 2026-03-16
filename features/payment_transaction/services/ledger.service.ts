import { $Enums, Prisma } from '@/lib/generated/prisma';
import WalletType = $Enums.WalletType;
import LedgerDirection = $Enums.LedgerDirection;
import { DbClient } from '@/types/api';
import { Decimal } from '@/lib/generated/prisma/runtime/client';

export const createOrderPaidLedger = async (
  db: DbClient,
  params: {
    shopId: string;
    amount: Decimal;
    orderId: string;
    idempotencyKey?: string;
    paymentId?: string;
    balanceBefore: Decimal;
    balanceAfter: Decimal;
  }
) => {
  return db.ledgerEntry.create({
    data: {
      walletId: params.shopId,
      walletType: WalletType.SHOP,
      amount: params.amount,
      direction: LedgerDirection.CREDIT,
      type: 'ORDER_PAID',
      description: `Customer payment for order #${params.orderId}`,
      balanceBefore: params.balanceBefore,
      balanceAfter: params.balanceAfter,
      orderId: params.orderId,
      paymentId: params.paymentId,

      transactionGroup: `order_paid_${params.orderId}`,
    },
  });
};

export const createSettlementLedgers = async (
  db: DbClient,
  params: {
    walletId: string;
    amount: Decimal;

    // pending balance
    pendingBefore: Decimal;
    pendingAfter: Decimal;

    // available balance
    availableBefore: Decimal;
    availableAfter: Decimal;

    orderId: string;
    paymentId: string | null;
  }
) => {
  const transactionGroup = `settlement_${params.orderId}`;

  // 1️⃣ Pending giảm
  await db.ledgerEntry.create({
    data: {
      walletId: params.walletId,
      walletType: WalletType.SHOP,
      amount: params.amount,
      direction: LedgerDirection.DEBIT,
      type: 'SETTLEMENT',
      description: `Settlement release (pending) for order #${params.orderId}`,
      balanceBefore: params.pendingBefore,
      balanceAfter: params.pendingAfter,
      transactionGroup,
      orderId: params.orderId,
      paymentId: params.paymentId,
    },
  });

  // 2️⃣ Available tăng
  await db.ledgerEntry.create({
    data: {
      walletId: params.walletId,
      walletType: WalletType.SHOP,
      amount: params.amount,
      direction: LedgerDirection.CREDIT,
      type: 'SETTLEMENT',
      description: `Settlement completed (available) for order #${params.orderId}`,
      balanceBefore: params.availableBefore,
      balanceAfter: params.availableAfter,
      transactionGroup,
      orderId: params.orderId,
      paymentId: params.paymentId,
    },
  });
};

export const createPayoutLedgers = async (
  db: DbClient,
  params: {
    shopId: string;
    amount: Decimal;

    // frozen balance của shop
    balanceBefore: Decimal;
    balanceAfter: Decimal;

    payoutId: string;
  }
) => {
  const transactionGroup = `payout_${params.payoutId}`;

  await db.ledgerEntry.create({
    data: {
      walletId: params.shopId,
      walletType: WalletType.SHOP,
      amount: params.amount,
      direction: LedgerDirection.DEBIT,
      type: 'PAYOUT',
      description: 'Shop payout executed (funds sent to bank)',
      balanceBefore: params.balanceBefore,
      balanceAfter: params.balanceAfter,
      transactionGroup,
    },
  });

  // 2️⃣ BANK / CLEARING: tiền vào
  await db.ledgerEntry.create({
    data: {
      walletId: params.shopId,
      walletType: WalletType.SHOP,
      amount: params.amount,
      direction: LedgerDirection.CREDIT,
      type: 'PAYOUT',
      description: `Receive payout from shop ${params.shopId}`,
      transactionGroup,
    },
  });
};

export const payoutFailedLedgers = async (
  db: DbClient,
  params: {
    shopId: string;
    amount: Decimal;
    balanceBefore: Decimal;
    balanceAfter: Decimal;
    payoutId: string;
  }
) => {
  return db.ledgerEntry.create({
    data: {
      walletId: params.shopId,
      walletType: 'SHOP',
      amount: params.amount,
      direction: LedgerDirection.CREDIT,
      type: 'PAYOUT',
      description: `Receive payout from shop ${params.shopId}`,
      transactionGroup: `payout_${params.payoutId}`,
    },
  });
};
