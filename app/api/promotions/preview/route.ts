import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api-response';
import { HttpStatus } from '@/types/api';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { priceCheckoutUsecase } from '@/features/promotion/usecases/price-checkout.usecase';

interface PreviewRequestBody {
  items: {
    variantId: string;
    quantity: number;
  }[];
  appliedCodes?: string[];
  currency?: 'VND' | 'USD';
}

export async function POST(req: NextRequest) {
  try {
    const body: PreviewRequestBody = await req.json();

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 'Items list cannot be empty',
          code: HttpStatus.BAD_REQUEST,
        })
      );
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const userId = session?.user?.id;

    const variantIds = body.items.map((i) => i.variantId);
    const variants = await prisma.productVariant.findMany({
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

    const variantMap = new Map(variants.map((v) => [v.id, v]));

    const checkoutItems = [];
    for (const item of body.items) {
      const v = variantMap.get(item.variantId);
      if (!v || !v.product) {
        return ResponseFactory.toNextResponse(
          ResponseFactory.error({
            message: `Variant not found: ${item.variantId}`,
            code: HttpStatus.BAD_REQUEST,
          })
        );
      }

      checkoutItems.push({
        id: v.id,
        productId: v.product.id,
        variantId: v.id,
        shopId: v.product.shopId,
        categoryId: v.product.categoryId ?? undefined,
        title: v.name || v.product.title,
        originalUnitPrice: Number(v.price),
        quantity: item.quantity,
        taxRate: v.product.taxRate ? Number(v.product.taxRate) : 0.1,
      });
    }

    const BASE_SHIPPING = 30000;
    const shopIds = Array.from(new Set(checkoutItems.map((i) => i.shopId)));
    const shippingRates = shopIds.map((shopId) => ({
      shopId,
      fee: BASE_SHIPPING,
      taxRate: 0,
    }));

    const pricingResult = await priceCheckoutUsecase(prisma, {
      items: checkoutItems,
      shippingRates,
      appliedCodes: (body.appliedCodes || []).map((c) => c.trim()).filter(Boolean),
      userId,
      currency: body.currency || 'VND',
    });

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({
        data: pricingResult,
        message: 'Promotion preview calculated successfully',
        code: HttpStatus.OK,
      })
    );
  } catch (error) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
  }
}
