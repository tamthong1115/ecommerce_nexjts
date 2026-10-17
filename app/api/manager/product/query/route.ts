import { ResponseFactory } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { withAdmin } from '@/lib/with-auth';
import { HttpStatus } from '@/types/api';
import { NextRequest } from 'next/server';

export const GET = withAdmin(async (userId: string, request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  const id = searchParams.get('id');

  if (!id) {
    return ResponseFactory.toNextResponse(
      ResponseFactory.error({
        message: 't_missing_id',
        code: HttpStatus.BAD_REQUEST,
      })
    );
  }

  try {
    const data = await prisma.product.findFirst({
      where: {
        id,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        origin: true,
        description: true,
        status: true,
        visibility: true,
        attributes: true,
        minPrice: true,
        maxPrice: true,
        currency: true,
        createdAt: true,
        updatedAt: true,
        shop: {
          select: { id: true, name: true, logoUrl: true, slug: true },
        },
        images: {
          select: { url: true, alt: true },
        },
        variants: {
          select: {
            id: true,
            sku: true,
            name: true,
            price: true,
            stock: true,
            image: true,
            currency: true,
            attributes: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!data) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 'Product not found',
          code: HttpStatus.NOT_FOUND,
        })
      );
    }

    // Convert Decimals to Numbers if needed (standard for JSON responses)
    const normalizedData = {
      ...data,
      minPrice: Number(data.minPrice),
      maxPrice: Number(data.maxPrice),
      variants: data.variants.map((v) => ({
        ...v,
        price: Number(v.price),
      })),
    };

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({
        data: normalizedData,
        message: 't_success',
        code: HttpStatus.OK,
      })
    );
  } catch (err) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(err));
  }
});
