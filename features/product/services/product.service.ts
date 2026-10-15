import { prisma } from '@/lib/db';
import { Prisma } from '@/lib/generated/prisma';

export const getSellerProducts = async (sellerId: string) => {
  // Find all shops owned by this seller
  const shops = await prisma.shop.findMany({
    where: { ownerId: sellerId },
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
  return products.map((p) => ({
    ...p,
    minPrice: Number(p.minPrice),
    maxPrice: Number(p.maxPrice),
  }));
};

export const createProduct = async (data: any) => {
  if (!data.variants || data.variants.length === 0) {
    throw new Error('At least one product variant is required');
  }

  if (!data.shopId) {
    throw new Error('Shop ID is required');
  }

  const numericMinPrice = Math.min(...data.variants.map((v: any) => v.price));
  const numericMaxPrice = Math.max(...data.variants.map((v: any) => v.price));

  const minPriceDecimal = new Prisma.Decimal(numericMinPrice.toString());
  const maxPriceDecimal = new Prisma.Decimal(numericMaxPrice.toString());

  return prisma.product.create({
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
          data.images?.map((img: any) => ({
            url: img.url,
            publicId: img.publicId,
            alt: img.alt,
            position: img.position,
          })) ?? [],
      },
      variants: {
        create:
          data.variants?.map((variant: any) => ({
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
};

export const getSellerProductById = async (
  sellerId: string,
  productId: string
) => {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      shop: { ownerId: sellerId },
    },
    include: {
      images: true,
      variants: true,
    },
  });

  if (!product) return null;

  return {
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
};

export const updateSellerProduct = async (productId: string, parsed: any) => {
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
        parsed.images?.map((img: any) => ({
          url: img.url,
          publicId: img.publicId,
          alt: img.alt,
          position: img.position,
        })) ?? [],
    },
    variants: {
      deleteMany: {},
      create:
        parsed.variants?.map((variant: any) => ({
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

  return prisma.product.update({
    where: { id: productId },
    data: updateData,
  });
};
