'use server';

import { getCurrentUserId } from '@/lib/auth';
import { OrderStatus, Prisma } from '@/lib/generated/prisma';
import { revalidatePath } from 'next/cache';
import { OrderWithRelations } from '@/types/order.data-types';
import { OrderDTO } from '@/types/dtos/order.dto';
import { DbClient } from '@/types/api';
import { prisma } from '@/lib/db';
import { allocateLargestRemainder } from '@/features/promotion/engine/allocate';
import { reservePromotion } from '@/features/promotion/services/redemption.service';

type CreateOrderResult =
  | { success: true; order: OrderWithRelations[] }
  | { success: false; error: string };

export async function createOrder(
  db: DbClient,
  draftId: string
): Promise<CreateOrderResult> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }
    console.log('api call: ' + draftId);
    const draft = await db.orderDraft.findUnique({
      where: { id: draftId, userId },
      include: {
        items: true,
        vouchers: { include: { voucher: true } },
        applications: { include: { promotion: true } },
      },
    });

    if (!draft) {
      return { success: false, error: 'Draft not found' };
    }

    const itemsByShop = draft.items.reduce(
      (acc, item) => {
        if (!item.shopId) throw new Error('OrderItem missing shopId!');
        if (!acc[item.shopId]) acc[item.shopId] = [];
        acc[item.shopId].push(item);
        return acc;
      },
      {} as Record<string, typeof draft.items>
    );

    const shopIds = Object.keys(itemsByShop);
    const timestamp = Date.now();

    const totalShippingOriginal =
      Number(draft.shippingFee) + Number(draft.shippingDiscount);
    const totalShippingDiscount = Number(draft.shippingDiscount);
    const shopBaseShipping =
      shopIds.length > 0 ? Math.round(totalShippingOriginal / shopIds.length) : 0;

    const shippingDiscountAllocations = allocateLargestRemainder(
      totalShippingDiscount,
      shopIds.map((id) => ({ id, weight: 1 }))
    );

    const createdOrders: OrderWithRelations[] = [];
    const reservedPromotionIds = new Set<string>();

    for (let index = 0; index < shopIds.length; index++) {
      const shopId = shopIds[index];
      const shopItems = itemsByShop[shopId];

      const shopItemsGross = shopItems.reduce(
        (sum, item) => sum + Number(item.total),
        0
      );
      const shopSubtotalNet = shopItems.reduce(
        (sum, item) => sum + Number(item.unitPriceNet || 0) * item.quantity,
        0
      );
      const shopTaxTotal = shopItems.reduce(
        (sum, item) => sum + Number(item.taxAmount || 0),
        0
      );

      const shopShippingDiscount = shippingDiscountAllocations[shopId] || 0;
      const shopShippingFee = Math.max(0, shopBaseShipping - shopShippingDiscount);
      const shopItemDiscounts = shopItems.reduce(
        (sum, item) => sum + Number(item.discount || 0),
        0
      );
      const shopDiscountTotal = shopItemDiscounts + shopShippingDiscount;
      const shopGrandTotal = shopItemsGross + shopShippingFee;

      const orderNumber = `ORD-${timestamp}-${index + 1}`;

      const shopApplications = (draft.applications || []).filter(
        (app) => app.shopId === shopId || (app.shopId === null && index === 0)
      );

      const order = await db.order.create({
        data: {
          orderNumber,
          userId,
          shopId,
          status: draft.status,
          paymentStatus: 'PENDING',

          itemsTotal: new Prisma.Decimal(shopItemsGross),
          subtotalNet: new Prisma.Decimal(shopSubtotalNet),
          shippingFee: new Prisma.Decimal(shopShippingFee),
          shippingDiscount: new Prisma.Decimal(shopShippingDiscount),
          discountTotal: new Prisma.Decimal(shopDiscountTotal),
          taxTotal: new Prisma.Decimal(shopTaxTotal),
          grandTotal: new Prisma.Decimal(shopGrandTotal),

          shippingAddress: draft.shippingInfor as Prisma.InputJsonValue,
          notes: draft.notes,

          items: {
            create: shopItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              shopId: item.shopId!,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              total: item.total,
              taxRate: item.taxRate,
              unitPriceNet: item.unitPriceNet,
              taxAmount: item.taxAmount,
              isGift: item.isGift,
              title: item.title,
            })),
          },

          applications: {
            create: shopApplications.map((app) => ({
              promotion: { connect: { id: app.promotionId } },
              amount: app.amount,
              sponsor: app.sponsor,
              platformShare: app.platformShare,
              shopShare: app.shopShare,
              shopId: app.shopId,
              snapshot: app.snapshot as Prisma.InputJsonValue,
            })),
          },

          vouchers: {
            create: draft.vouchers
              .filter((v) => !v.voucher.shopId || v.voucher.shopId === shopId)
              .map((v) => ({
                voucher: { connect: { id: v.voucherId } },
              })),
          },
        },
        include: {
          items: true,
          vouchers: { include: { voucher: true } },
          applications: { include: { promotion: true } },
        },
      });

      for (const app of shopApplications) {
        if (!reservedPromotionIds.has(app.promotionId)) {
          await reservePromotion(db, {
            promotionId: app.promotionId,
            userId,
            orderId: order.id,
          });
          reservedPromotionIds.add(app.promotionId);
        }
      }

      createdOrders.push(order as unknown as OrderWithRelations);
    }

    await db.orderDraft.delete({
      where: { id: draft.id },
    });

    const cart = await db.cart.findUnique({ where: { userId } });
    if (cart) {
      await db.cartItem.deleteMany({
        where: {
          cartId: cart.id,
          variantId: {
            in: draft.items
              .map((i) => i.variantId)
              .filter((id): id is string => !!id),
          },
        },
      });
      revalidatePath('/cart');
    }

    return {
      success: true,
      order: createdOrders,
    };
  } catch (error) {
    console.error('Error createOrder:', error);
    return { success: false, error: error as string };
  }
}

interface GetOrdersParams {
  cursor?: string;
  status?: OrderStatus;
  orderId?: string;
  limit?: number;
}

export async function getOrder(
  _prevState: any,
  formData: GetOrdersParams = {}
): Promise<{ orders: OrderDTO[]; nextCursor: string | undefined }> {
  const { cursor, status, orderId, limit = 10 } = formData;

  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error('Unauthorized');
    }
    const filter = {
      userId,
      ...(orderId && { orderId }),
      ...(status && { status }),
    };

    const order = await prisma.order.findMany({
      where: filter,
      orderBy: { placedAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              include: { images: true },
            },
            variant: {
              select: {
                image: true,
              },
            },
          },
        },
      },
      take: limit + 1,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
    });

    const hasNextPage = order.length > limit;
    const nextCursor = hasNextPage ? order[limit - 1].id : undefined;

    return JSON.parse(
      JSON.stringify({
        orders: hasNextPage ? order.slice(0, limit) : order,
        nextCursor,
      })
    );
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw new Error((error as string) || 'Internal Server Error');
  }
}
