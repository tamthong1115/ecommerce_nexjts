import { NextRequest } from 'next/server';
import { requireSeller } from '@/lib/require-admin';
import { ResponseFactory } from '@/lib/api-response';
import { HttpStatus } from '@/types/api';
import { manageProductSchema } from '@/app/(seller)/seller/products/_components/productSchema';
import {
  createProduct,
  getSellerProducts,
} from '@/features/product/services/product.service';

export async function GET() {
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

    const normalized = await getSellerProducts(sellerSession.user.id);

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({ data: normalized })
    );
  } catch (error) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
  }
}

export async function POST(req: NextRequest) {
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
    const parsed = manageProductSchema.safeParse(body);

    if (!parsed.success) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 'Invalid product data',
          code: HttpStatus.BAD_REQUEST,
          errors: parsed.error.flatten().fieldErrors,
        })
      );
    }

    const product = await createProduct(parsed.data);

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({
        data: product,
        message: 'Product created successfully',
        code: HttpStatus.CREATED,
      })
    );
  } catch (error: any) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
  }
}
