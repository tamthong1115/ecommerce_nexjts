import { NextRequest } from 'next/server';
import { requireSeller } from '@/lib/require-admin';
import { ResponseFactory } from '@/lib/api-response';
import { HttpStatus } from '@/types/api';
import { manageProductSchema } from '@/app/(seller)/seller/products/_components/productSchema';
import {
  getSellerProductById,
  updateSellerProduct,
} from '@/features/product/services/product.service';

export async function GET(req: NextRequest) {
  const sellerSession = await requireSeller();
  if (!sellerSession) {
    return ResponseFactory.toNextResponse(
      ResponseFactory.error({
        message: 'Unauthorized',
        code: HttpStatus.FORBIDDEN,
      })
    );
  }

  const { productId } = req.nextUrl.searchParams.has('productId')
    ? { productId: req.nextUrl.searchParams.get('productId') }
    : { productId: req.url.split('/').pop() };

  if (!productId) {
    return ResponseFactory.toNextResponse(
      ResponseFactory.error({
        message: 'Missing productId',
        code: HttpStatus.BAD_REQUEST,
      })
    );
  }

  const product = await getSellerProductById(
    sellerSession.user.id,
    productId
  );

  if (!product) {
    return ResponseFactory.toNextResponse(
      ResponseFactory.error({
        message: 'Product not found',
        code: HttpStatus.NOT_FOUND,
      })
    );
  }

  return ResponseFactory.toNextResponse(
    ResponseFactory.success({ data: product })
  );
}

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ productId: string }> }
) {
  const params = await props.params;
  try {
    const sellerSession = await requireSeller();
    if (!sellerSession) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 'Unauthorized',
          code: HttpStatus.UNAUTHORIZED,
        })
      );
    }

    const body = await req.json();
    const parsed = manageProductSchema.parse(body);

    const product = await updateSellerProduct(params.productId, parsed);

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({ data: product })
    );
  } catch (error: any) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
  }
}
