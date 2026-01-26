import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/with-auth';
import { AddToCartRequest, UpdateCartRequest } from '@/types/cart.data-types';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api-response';

export const GET = withAuth(async (userId: string) => {
  const cart = await prisma.cart.findUnique({
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

  return NextResponse.json(cart);
});

export const POST = withAuth(async (userId: string, request: NextRequest) => {
  try {
    const body: AddToCartRequest = await request.json();

    //check cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      await prisma.cart.create({
        data: { userId },
      });
    }

    //check product variant
    const product = await prisma.productVariant.findUnique({
      where: { id: body.variantId },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product variant not found' },
        { status: 404 }
      );
    }

    //check if product already in cart
    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        cartId_variantId: { cartId: cart!.id, variantId: body.variantId },
      },
    });

    let cartItem;

    if (existingCartItem) {
      cartItem = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: existingCartItem.quantity + body.quantity,
        },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart!.id,
          variantId: body.variantId,
          quantity: body.quantity,
          priceSnap: body.priceSnap,
          currency: body.currency,
        },
      });
    }

    return NextResponse.json(
      {
        message: 'Item added to cart successfully',
        cartItem,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error('Lỗi khi thêm sản phẩm vào giỏ hàng:', e);
    return ResponseFactory.toNextResponse(ResponseFactory.error());
  }
});

export const PATCH = withAuth(async (userId: string, request: NextRequest) => {
  try {
    const body: UpdateCartRequest = await request.json();

    if (!body.items || !Array.isArray(body.items)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    for (const item of body.items) {
      await prisma.cartItem.update({
        where: {
          cartId_variantId: {
            cartId: cart.id,
            variantId: item.variant.id,
          },
        },
        data: {
          quantity: item.quantity,
        },
      });
    }

    return NextResponse.json(
      { message: 'Cart updated successfully' },
      { status: 200 }
    );
  } catch (e) {
    console.error('Lỗi khi cập nhật giỏ hàng:', e);

    if (e instanceof Error && e.message.includes('Record not found')) {
      return NextResponse.json(
        { error: 'Some items do not exist in the cart' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: (e as Error).message },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (userId: string) => {
  try {
    await prisma.cart.delete({
      where: { userId },
    });

    return NextResponse.json(
      { message: 'cart deleted successfully' },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
  }
});
