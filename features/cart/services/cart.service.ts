import { prisma } from '@/lib/db';
import { AddToCartRequest, UpdateCartRequest } from '../types';

export class CartService {
  static async getCart(userId: string) {
    return prisma.cart.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        items: {
          select: {
            id: true,
            quantity: true,
            priceSnap: true,
            variant: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
                compareAt: true,
                stock: true,
                productId: true,
                product: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                    images: {
                      select: { url: true, alt: true, position: true },
                      orderBy: { position: 'asc' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  static async addToCart(userId: string, data: AddToCartRequest) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    const product = await prisma.productVariant.findUnique({
      where: { id: data.variantId },
    });

    if (!product) {
      throw new Error('Product variant not found');
    }

    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        cartId_variantId: { cartId: cart.id, variantId: data.variantId },
      },
    });

    if (existingCartItem) {
      return prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: existingCartItem.quantity + data.quantity,
        },
      });
    } else {
      return prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId: data.variantId,
          quantity: data.quantity,
          priceSnap: data.priceSnap,
          currency: data.currency,
        },
      });
    }
  }

  static async updateCart(userId: string, data: UpdateCartRequest) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new Error('Cart not found');
    }

    const updates = [];
    for (const item of data.items) {
      updates.push(
        prisma.cartItem.update({
          where: {
            cartId_variantId: {
              cartId: cart.id,
              variantId: item.variant.id,
            },
          },
          data: {
            quantity: item.quantity,
          },
        })
      );
    }

    await prisma.$transaction(updates);
    return { message: 'Cart updated successfully' };
  }

  static async removeItem(userId: string, variantId: string) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new Error('Cart not found');
    }

    await prisma.cartItem.delete({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId,
        },
      },
    });

    return { message: 'Product removed from cart successfully' };
  }

  static async clearCart(userId: string) {
    return prisma.cart.delete({
      where: { userId },
    });
  }
}
