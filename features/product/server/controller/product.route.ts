import { NextRequest } from 'next/server';
import { requireSeller } from '@/lib/require-role';
import { ResponseFactory } from '@/lib/api-response';
import { HttpStatus } from '@/types/api';
import { prisma } from '@/lib/db';
import { manageProductSchema } from '@/app/(seller)/seller/products/_components/productSchema';
import { Prisma } from '@/lib/generated/prisma';

export async function getProductsRoute() {
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

    // Find all shops owned by this seller
    const shops = await prisma.shop.findMany({
      where: { ownerId: sellerSession.user.id },
      select: { id: true },
    });
    const shopIds = shops.map((s) => s.id);

    // Get products for these shops
    const products = await prisma.product.findMany({
      where: { shopId: { in: shopIds } },
      select: {
        id: true,
        title: true,
        status: true,
        visibility: true,
        minPrice: true,
        maxPrice: true,
        currency: true,
        keywords: true,
        createdAt: true,
        updatedAt: true,
        shop: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        images: {
          select: {
            url: true,
            alt: true,
          },
          orderBy: { position: 'asc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Normalize Decimals to Numbers for JSON serialization
    const normalized = products.map((p) => ({
      ...p,
      minPrice: Number(p.minPrice),
      maxPrice: Number(p.maxPrice),
    }));

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({ data: normalized })
    );
  } catch (error) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
  }
}

export async function createProductRoute(req: NextRequest) {
  try {
    // FIX: Added missing await
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

    const data = parsed.data;

    if (!data.variants || data.variants.length === 0) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 'At least one product variant is required',
          code: HttpStatus.BAD_REQUEST,
        })
      );
    }

    if (!data.shopId) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 'Shop ID is required',
          code: HttpStatus.BAD_REQUEST,
        })
      );
    }

    const numericMinPrice = Math.min(...data.variants.map((v) => v.price));
    const numericMaxPrice = Math.max(...data.variants.map((v) => v.price));

    const minPriceDecimal = new Prisma.Decimal(numericMinPrice.toString());
    const maxPriceDecimal = new Prisma.Decimal(numericMaxPrice.toString());

    // Create product
    const product = await prisma.product.create({
      data: {
        title: data.title,
        slug: data.slug,
        origin: data.origin,
        description: data.description,
        status: data.status,
        visibility: data.visibility,
        attributes: data.attributes ?? {},
        minPrice: minPriceDecimal,
        maxPrice: maxPriceDecimal,
        categoryId: data.categoryId,
        currency: data.currency,
        shopId: data.shopId,
        images: {
          create:
            data.images?.map((img) => ({
              url: img.url,
              publicId: img.publicId,
              alt: img.alt,
              position: img.position,
            })) ?? [],
        },
        variants: {
          create:
            data.variants?.map((variant) => ({
              sku: variant.sku,
              name: variant.name,
              price: variant.price,
              image: variant.image,
              imagePublicId: variant.imagePublicId,
              compareAt: variant.compareAt,
              currency: variant.currency,
              stock: variant.stock,
              reserved: variant.reserved,
              weightGrams: variant.weightGrams,
              lengthMm: variant.lengthMm,
              widthMm: variant.widthMm,
              heightMm: variant.heightMm,
              attributes: variant.attributes ?? {},
              isActive: variant.isActive,
            })) ?? [],
        },
        keywords: data.keywords ?? [],
      },
    });

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

export async function getProductByIdByShopRoute(req: NextRequest) {
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

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      shop: { ownerId: sellerSession.user.id },
    },
    include: {
      images: true,
      variants: true,
    },
  });

  if (!product) {
    return ResponseFactory.toNextResponse(
      ResponseFactory.error({
        message: 'Product not found',
        code: HttpStatus.NOT_FOUND,
      })
    );
  }

  const normalized = {
    ...product,
    minPrice: Number(product.minPrice),
    maxPrice: Number(product.maxPrice),
    variants: product.variants.map((v) => ({
      ...v,
      price: Number(v.price),
      compareAt: v.compareAt != null ? Number(v.compareAt) : null,
    })),
    keywords: product.keywords ?? [],
  };

  return ResponseFactory.toNextResponse(
    ResponseFactory.success({ data: normalized })
  );
}

export async function updateProductRoute(
  req: NextRequest,
  props: { params: Promise<{ productId: string }> }
) {
  const prams = await props.params;
  try {
    const body = await req.json();
    const parsed = manageProductSchema.parse(body);

    const updateData: any = {
      title: parsed.title,
      slug: parsed.slug,
      origin: parsed.origin,
      description: parsed.description,
      status: parsed.status,
      visibility: parsed.visibility,
      attributes: parsed.attributes ?? {},
      categoryId: parsed.categoryId,
      currency: parsed.currency,
      images: {
        deleteMany: {},
        create:
          parsed.images?.map((img) => ({
            url: img.url,
            publicId: img.publicId,
            alt: img.alt,
            position: img.position,
          })) ?? [],
      },
      variants: {
        deleteMany: {},
        create:
          parsed.variants?.map((variant) => ({
            sku: variant.sku,
            name: variant.name,
            price: variant.price,
            image: variant.image,
            imagePublicId: variant.imagePublicId,
            compareAt: variant.compareAt,
            currency: variant.currency,
            stock: variant.stock,
            reserved: variant.reserved,
            weightGrams: variant.weightGrams,
            lengthMm: variant.lengthMm,
            widthMm: variant.widthMm,
            heightMm: variant.heightMm,
            attributes: variant.attributes ?? {},
            isActive: variant.isActive,
          })) ?? [],
      },
      keywords: parsed.keywords ?? [],
    };

    if (parsed.shopId) {
      updateData.shopId = parsed.shopId;
    }

    const product = await prisma.product.update({
      where: { id: prams.productId },
      data: updateData,
    });

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({ data: product })
    );
  } catch (error: any) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
  }
}
