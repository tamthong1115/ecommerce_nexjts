import { GoogleGenAI } from '@google/genai';
import { prisma } from '@/lib/db';
import { Prisma } from '@/lib/generated/prisma';
import ProductOrderByWithRelationInput = Prisma.ProductOrderByWithRelationInput;
import ProductWhereInput = Prisma.ProductWhereInput;
import { parseSearchQueryWithAI } from '@/features/search/gemini-search';
import { env } from '@/lib/env';

const genai = new GoogleGenAI({ apiKey: env.GOOGLE_API_KEY });

export async function analyzeImageService(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const base64String = Buffer.from(arrayBuffer).toString('base64');

  const prompt = `
  You are an image labeling system.
  
  Your task:
  - Identify the product shown in the image.
  - Return ONLY the shortest, simplest name possible.
  - Do NOT guess beyond what is clearly visible.
  - Do NOT improve or rephrase the label.
  - Do NOT generate marketing names or descriptions.
  - If the item is a keyboard → return "keyboard".
  - If the item is a coat → return "coat".
  - If the item is a mouse → return "mouse".
  - If text or brand is visible (e.g., "ek keyboard"), return it EXACTLY.
  - Maximum length: 1–3 words.
  - No sentences. No punctuation. No quotes.
  - Output language: English or Vietnamese (match the product text if visible, otherwise default to Vietnamese).
  
  Return ONLY the label:`;

  const result = await genai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: file.type,
              data: base64String,
            },
          },
        ],
      },
    ],
  });

  const text = result.text;
  if (!text) {
    throw new Error('Failed to identify product');
  }

  return text.trim();
}

export async function getSuggestionsService(query: string) {
  if (!query || query.length < 2) {
    return [];
  }

  return prisma.product.findMany({
    where: {
      status: 'PUBLISHED',
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { shop: { name: { contains: query, mode: 'insensitive' } } },
      ],
    },
    take: 5,
    select: {
      id: true,
      title: true,
      category: {
        select: { name: true },
      },
      images: {
        take: 1,
        select: { url: true },
      },
    },
  });
}

export interface SearchProductsParams {
  q?: string | null;
  useAI?: boolean;
  titleOnly?: boolean;
  category?: string | null;
  shopId?: string | null;
  minPrice?: string | null;
  maxPrice?: string | null;
  sortBy?: string | null;
  sortOrder?: string | null;
  page?: number;
  limit?: number;
}

export async function searchProductsService(params: SearchProductsParams) {
  let query = params.q || '';
  const aiParams: any = {};

  if (params.useAI && query) {
    try {
      const categories = await prisma.category.findMany({
        select: { slug: true },
      });
      const categorySlugs = categories.map((c) => c.slug);
      const aiResult = await parseSearchQueryWithAI(query, categorySlugs);

      if (aiResult) {
        if (aiResult.query) query = aiResult.query;
        if (aiResult.minPrice) aiParams.minPrice = String(aiResult.minPrice);
        if (aiResult.maxPrice) aiParams.maxPrice = String(aiResult.maxPrice);
        if (aiResult.category) aiParams.category = aiResult.category;
        if (aiResult.sortBy) aiParams.sortBy = aiResult.sortBy;
        if (aiResult.sortOrder) aiParams.sortOrder = aiResult.sortOrder;
      }
    } catch (err) {
      console.error('AI Search Failed, falling back to standard', err);
    }
  }

  const category = params.category || aiParams.category;
  const shopId = params.shopId;
  const minPrice = params.minPrice || aiParams.minPrice;
  const maxPrice = params.maxPrice || aiParams.maxPrice;
  const sortBy = params.sortBy || aiParams.sortBy || 'createdAt';
  const sortOrder = params.sortOrder || aiParams.sortOrder || 'desc';

  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  const whereClause: ProductWhereInput = {
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    AND: [],
  };

  if (query) {
    if (params.titleOnly) {
      whereClause.OR = [{ title: { contains: query, mode: 'insensitive' } }];
    } else {
      whereClause.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { shop: { name: { contains: query, mode: 'insensitive' } } },
      ];
    }
  }

  if (category) {
    const data = await prisma.category.findFirst({
      where: { slug: category },
      select: { id: true },
    });

    if (data) {
      const categoryIds = await getCategoryWithChildren(data.id);
      whereClause.categoryId = { in: categoryIds };
    }
  }

  if (shopId) {
    whereClause.shopId = shopId;
  }

  if (minPrice) {
    whereClause.minPrice = { gte: Number(minPrice) };
  }

  if (maxPrice) {
    whereClause.maxPrice = { lte: Number(maxPrice) };
  }

  const orderBy: ProductOrderByWithRelationInput = {};
  if (sortBy === 'price') {
    orderBy.minPrice = sortOrder as 'asc' | 'desc';
  } else if (sortBy === 'rating') {
    orderBy.ratingAvg = sortOrder as 'asc' | 'desc';
  } else if (sortBy === 'name') {
    orderBy.title = sortOrder as 'asc' | 'desc';
  } else if (sortBy === 'createdAt') {
    orderBy.createdAt = sortOrder as 'asc' | 'desc';
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        minPrice: true,
        maxPrice: true,
        currency: true,
        ratingAvg: true,
        ratingCount: true,
        origin: true,
        images: {
          take: 1,
          select: { url: true, alt: true },
        },
        shop: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        VoucherProduct: {
          take: 1,
          select: {
            voucher: {
              select: {
                type: true,
                value: true,
                maxDiscount: true,
              },
            },
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.product.count({ where: whereClause }),
  ]);

  const formatted = products.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    minPrice: p.minPrice,
    maxPrice: p.maxPrice,
    currency: p.currency,
    ratingAvg: p.ratingAvg,
    ratingCount: p.ratingCount,
    origin: p.origin,
    imageUrl: p.images[0]?.url ?? null,
    imageAlt: p.images[0]?.alt ?? null,
    shop: p.shop,
    category: p.category,
    voucher: p.VoucherProduct[0]?.voucher ?? null,
  }));

  return {
    products: formatted,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function getCategoryWithChildren(
  rootId: string,
  maxDepth = 6
): Promise<string[]> {
  const allIds: string[] = [];
  const visited = new Set<string>();
  let currentLevelIds = [rootId];

  visited.add(rootId);
  allIds.push(rootId);

  let depth = 0;
  while (currentLevelIds.length > 0) {
    if (++depth > maxDepth) break;

    const subCategories = await prisma.category.findMany({
      where: { parentId: { in: currentLevelIds } },
      select: { id: true },
    });

    if (subCategories.length === 0) break;

    const subIds = subCategories
      .map((c) => c.id)
      .filter((id) => !visited.has(id));

    if (subIds.length === 0) break;

    subIds.forEach((id) => {
      visited.add(id);
      allIds.push(id);
    });

    currentLevelIds = subIds;
  }

  return allIds;
}
