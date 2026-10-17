'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Prisma, Voucher } from '@/lib/generated/prisma';
import { createOrderDraftSchema } from '@/lib/validation/orderDraft';
import { priceCheckoutUsecase } from '@/features/promotion/usecases/price-checkout.usecase';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { customAlphabet } from 'nanoid';
import dayjs from 'dayjs';

export async function getOrderDrafts(draftId?: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  const userId = session.user.id;

  const whereInput: Prisma.OrderDraftWhereInput = { userId };
  if (draftId) {
    whereInput.id = draftId;
  }

  const draft = await prisma.orderDraft.findFirst({
    where: whereInput,
    orderBy: {
      placedAt: 'desc',
    },
    select: {
      id: true,
      orderNumber: true,
      itemsTotal: true,
      shippingFee: true,
      shippingDiscount: true,
      discountTotal: true,
      taxTotal: true,
      grandTotal: true,
      shippingInfor: true,
      vouchers: {
        select: {
          voucher: {
            select: {
              id: true,
              code: true,
              type: true,
              value: true,
              minSubtotal: true,
              maxDiscount: true,
              startAt: true,
              endAt: true,
              shopId: true,
            },
          },
        },
      },
      applications: {
        include: {
          promotion: {
            select: {
              id: true,
              code: true,
              name: true,
              kind: true,
              target: true,
              sponsor: true,
            },
          },
        },
      },
      items: {
        select: {
          id: true,
          title: true,
          quantity: true,
          unitPrice: true,
          discount: true,
          total: true,
          taxRate: true,
          unitPriceNet: true,
          taxAmount: true,
          isGift: true,
          product: {
            select: {
              shop: {
                select: {
                  name: true,
                },
              },
              images: {
                select: {
                  url: true,
                  alt: true,
                  position: true,
                },
                orderBy: { position: 'asc' },
              },
            },
          },
        },
      },
    },
  });

  if (!draft) return { success: false, error: 'No draft found' };

  const draftPlain = {
    ...draft,
    itemsTotal: draft.itemsTotal.toNumber(),
    shippingFee: draft.shippingFee.toNumber(),
    shippingDiscount: draft.shippingDiscount ? draft.shippingDiscount.toNumber() : 0,
    discountTotal: draft.discountTotal.toNumber(),
    taxTotal: draft.taxTotal ? draft.taxTotal.toNumber() : 0,
    grandTotal: draft.grandTotal.toNumber(),
    vouchers: draft.vouchers.map((v) => ({
      ...v.voucher,
      value: v.voucher.value.toNumber(),
      maxDiscount: v.voucher.maxDiscount
        ? v.voucher.maxDiscount.toNumber()
        : null,
      minSubtotal: v.voucher.minSubtotal
        ? v.voucher.minSubtotal.toNumber()
        : null,
    })),
    applications: (draft.applications || []).map((a) => ({
      id: a.id,
      promotionId: a.promotionId,
      code: a.promotion?.code ?? null,
      name: a.promotion?.name ?? '',
      kind: a.promotion?.kind,
      target: a.promotion?.target,
      sponsor: a.sponsor,
      amount: a.amount.toNumber(),
      platformShare: a.platformShare.toNumber(),
      shopShare: a.shopShare.toNumber(),
      shopId: a.shopId,
    })),
    items: draft.items.map((item) => ({
      ...item,
      unitPrice: item.unitPrice.toNumber(),
      discount: item.discount.toNumber(),
      total: item.total.toNumber(),
      taxRate: item.taxRate.toNumber(),
      unitPriceNet: item.unitPriceNet ? item.unitPriceNet.toNumber() : null,
      taxAmount: item.taxAmount.toNumber(),
      isGift: item.isGift,
    })),
  };

  return { success: true, draft: draftPlain };
}
export type OrderDraftResult = Awaited<ReturnType<typeof getOrderDrafts>>;

export type OrderDraftActionResponse = OrderDraftResult & {
  redirectTo?: string;
  message?: string;
};

export async function createOrderDraft(
  formData: FormData
): Promise<OrderDraftActionResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false, error: 'Unauthorized' };
  const userId = session.user.id;

  const rawData = Object.fromEntries(formData.entries());
  if (!rawData.data)
    return { success: false, error: 'Missing data field in FormData' };

  let data;
  try {
    const parseData = JSON.parse(rawData.data as string);
    data = createOrderDraftSchema.parse(parseData);
  } catch (e) {
    return { success: false, error: 'Invalid data format' + e };
  }
  const { notes, items, voucher } = data;

  const headersList = await headers();
  const refer = headersList.get('referer');
  let currentPath = '/';

  if (refer) {
    try {
      const urlInstance = new URL(refer);
      currentPath = urlInstance.pathname + urlInstance.search;
    } catch (error) {
      return { success: false, error: 'Invalid referer URL:' + refer + error };
    }
  }

  // 1️⃣ Get Default Shipping Address
  const defaultAddress = await prisma.address.findFirst({
    where: { userId, isDefault: true },
  });
  if (!defaultAddress) {
    const encodeCallBack = encodeURIComponent(currentPath);
    return {
      success: false,
      redirectTo: `/customer/account/address?callbackUrl=${encodeCallBack}`,
      message: 'Default address missing',
      error: 'Address Missing',
    };
  }

  const shippingInfor = {
    name: defaultAddress.fullName,
    phone: defaultAddress.phone,
    address: defaultAddress.line1,
    city: defaultAddress.city,
    district: defaultAddress.district,
    ward: defaultAddress.ward,
  };

  try {
    const variantIds = items.map((i) => i.variantId);
    const dbVariants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        product: {
          select: {
            id: true,
            shopId: true,
            categoryId: true,
            title: true,
            taxRate: true,
          },
        },
      },
    });

    const variantMap = new Map(dbVariants.map((v) => [v.id, v]));

    interface DraftItemDetail {
      productId: string;
      variantId: string;
      shopId: string;
      categoryId: string | null;
      quantity: number;
      unitPrice: number;
      title: string;
      taxRate: number;
    }

    const itemDetails: DraftItemDetail[] = [];
    for (const item of items) {
      const variant = variantMap.get(item.variantId);

      if (!variant || !variant.product) {
        return {
          success: false,
          error: `Variant not found - (ID: ${item.variantId})`,
        };
      }

      if (variant.stock < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for variant ID: ${item.variantId}`,
        };
      }

      itemDetails.push({
        productId: variant.product.id,
        variantId: variant.id,
        shopId: variant.product.shopId,
        categoryId: variant.product.categoryId,
        quantity: item.quantity,
        unitPrice: Number(variant.price),
        title: variant.name || variant.product.title,
        taxRate: variant.product.taxRate ? Number(variant.product.taxRate) : 0.1,
      });
    }

    const appliedCodes = voucher
      ? voucher.map((v) => v.code.trim()).filter(Boolean)
      : [];

    const matchedLegacyVouchers =
      appliedCodes.length > 0
        ? await prisma.voucher.findMany({
            where: { code: { in: appliedCodes } },
          })
        : [];

    const BASE_SHIPPING = 30000;
    const shopIds = Array.from(new Set(itemDetails.map((i) => i.shopId)));
    const shippingRates = shopIds.map((shopId) => ({
      shopId,
      fee: BASE_SHIPPING,
      taxRate: 0,
    }));

    const pricingResult = await priceCheckoutUsecase(prisma, {
      items: itemDetails.map((i) => ({
        id: i.variantId,
        productId: i.productId,
        variantId: i.variantId,
        shopId: i.shopId,
        categoryId: i.categoryId ?? undefined,
        title: i.title,
        originalUnitPrice: i.unitPrice,
        quantity: i.quantity,
        taxRate: i.taxRate,
      })),
      shippingRates,
      appliedCodes,
      userId,
      currency: (data.currency as 'VND' | 'USD') || 'VND',
    });

    const rejectedUserCode = pricingResult.rejectedPromotions.find(
      (r) => r.code && appliedCodes.includes(r.code)
    );
    if (rejectedUserCode) {
      return {
        success: false,
        error: `Mã khuyến mãi ${rejectedUserCode.code} không thể áp dụng: ${rejectedUserCode.reason}`,
      };
    }

    const giftItemsToCreate = [];
    if (pricingResult.giftsToAdd && pricingResult.giftsToAdd.length > 0) {
      const giftVariantIds = pricingResult.giftsToAdd.map((g) => g.variantId);
      const giftVariants = await prisma.productVariant.findMany({
        where: { id: { in: giftVariantIds } },
        include: {
          product: {
            select: { id: true, shopId: true, title: true },
          },
        },
      });
      const giftVariantMap = new Map(giftVariants.map((v) => [v.id, v]));

      for (const gift of pricingResult.giftsToAdd) {
        const gVar = giftVariantMap.get(gift.variantId);
        if (gVar && gVar.product) {
          giftItemsToCreate.push({
            productId: gVar.product.id,
            variantId: gVar.id,
            shopId: gVar.product.shopId,
            quantity: gift.quantity,
            unitPrice: new Prisma.Decimal(0),
            discount: new Prisma.Decimal(0),
            total: new Prisma.Decimal(0),
            taxRate: new Prisma.Decimal(0),
            unitPriceNet: new Prisma.Decimal(0),
            taxAmount: new Prisma.Decimal(0),
            isGift: true,
            title: `[Quà tặng] ${gVar.name || gVar.product.title}`,
          });
        }
      }
    }

    const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);
    const timestamp = dayjs().format('YYYYMMDD_HHmm');
    const orderNumber = `ORD-${timestamp}-${nanoid()}`;

    await prisma.orderDraft.deleteMany({
      where: { userId },
    });

    const newDraft = await prisma.orderDraft.create({
      data: {
        userId,
        orderNumber,
        status: 'AWAITING_PAYMENT',
        itemsTotal: new Prisma.Decimal(pricingResult.summary.itemsTotalGross),
        shippingFee: new Prisma.Decimal(pricingResult.summary.shippingFeeFinal),
        shippingDiscount: new Prisma.Decimal(pricingResult.summary.shippingFeeDiscount),
        discountTotal: new Prisma.Decimal(pricingResult.summary.discountTotal),
        taxTotal: new Prisma.Decimal(pricingResult.summary.taxTotal),
        grandTotal: new Prisma.Decimal(pricingResult.summary.grandTotal),
        notes,
        shippingInfor,
        items: {
          create: [
            ...pricingResult.items.map((line) => {
              const matched = itemDetails.find((d) => d.variantId === line.variantId);
              return {
                productId: matched?.productId || '',
                variantId: line.variantId,
                shopId: line.shopId,
                quantity: line.quantity,
                unitPrice: new Prisma.Decimal(line.effectiveUnitPrice),
                discount: new Prisma.Decimal(line.discountTotal),
                total: new Prisma.Decimal(line.grossTotal),
                taxRate: new Prisma.Decimal(line.taxRate),
                unitPriceNet: new Prisma.Decimal(
                  line.quantity > 0 ? line.netTotal / line.quantity : 0
                ),
                taxAmount: new Prisma.Decimal(line.taxAmount),
                isGift: line.isGift,
                title: matched?.title || '',
              };
            }),
            ...giftItemsToCreate,
          ],
        },
        applications: {
          create: pricingResult.appliedPromotions.map((app) => ({
            promotion: { connect: { id: app.promotionId } },
            amount: new Prisma.Decimal(app.totalDiscount),
            sponsor: app.sponsor,
            platformShare: new Prisma.Decimal(app.platformShare),
            shopShare: new Prisma.Decimal(app.shopShare),
            shopId:
              app.appliedToShopIds && app.appliedToShopIds.length === 1
                ? app.appliedToShopIds[0]
                : null,
            snapshot: app as unknown as Prisma.InputJsonValue,
          })),
        },
        vouchers: {
          create: matchedLegacyVouchers.map((v) => ({
            voucher: { connect: { id: v.id } },
          })),
        },
      },
    });

    revalidatePath('/draft');

    return await getOrderDrafts(newDraft.id);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
