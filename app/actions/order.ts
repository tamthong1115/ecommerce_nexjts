'use server';

import { getCurrentUserId } from '@/lib/auth';
import { OrderStatus, Prisma } from '@/lib/generated/prisma';
import { revalidatePath } from 'next/cache';
import { OrderWithRelations } from '@/types/order.data-types';
import { OrderDTO } from '@/types/dtos/order.dto';
import { DbClient } from '@/types/api';
import { prisma_clean } from '@/lib/queue/prisma-clean';

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

    const createdOrders = await Promise.all(
      shopIds.map(async (shopId, index) => {
        const shopItems = itemsByShop[shopId];

        const itemsTotal = shopItems.reduce(
          (sum, item) => sum + Number(item.total),
          0
        );

        const ratio = itemsTotal / Number(draft.itemsTotal);

        const shippingFee = Number(draft.shippingFee);
        const discountTotal = Number(draft.discountTotal) * ratio;
        const grandTotal = itemsTotal + shippingFee - discountTotal;

        const orderNumber = `ORD-${timestamp}-${index + 1}`;

        return db.order.create({
          data: {
            orderNumber,
            userId,
            shopId,
            status: draft.status,
            paymentStatus: 'PENDING',

            itemsTotal: new Prisma.Decimal(itemsTotal),
            shippingFee: new Prisma.Decimal(shippingFee),
            discountTotal: new Prisma.Decimal(discountTotal),
            grandTotal: new Prisma.Decimal(grandTotal),

            shippingAddress: draft.shippingInfor as Prisma.InputJsonValue,
            notes: draft.notes,

            items: {
              create: shopItems.map((item) => ({
                productId: item.productId,
                variantId: item.variantId,
                shopId: item.shopId!,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.total,
                title: item.title,
              })),
            },

            vouchers: {
              create: draft.vouchers.map((v) => ({
                voucher: { connect: { id: v.voucherId } },
              })),
            },
          },
          include: {
            items: true,
            vouchers: { include: { voucher: true } },
          },
        });
      })
    );

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

    const order = await prisma_clean.order.findMany({
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
