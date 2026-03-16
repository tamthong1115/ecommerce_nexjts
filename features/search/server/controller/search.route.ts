import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@/lib/generated/prisma';
import ProductOrderByWithRelationInput = Prisma.ProductOrderByWithRelationInput;
import { ResponseFactory } from '@/lib/api-response';
import { ApiResponse } from '@/types/api';
import ProductWhereInput = Prisma.ProductWhereInput;
import { parseSearchQueryWithAI } from '@/features/search/gemini-search';
import { env } from '@/lib/env';

const genai = new GoogleGenAI({ apiKey: env.GOOGLE_API_KEY });

export async function analyzeImage(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

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

    // Clean up text (remove newlines or extra spaces)
    const searchQuery = text.trim();

    return NextResponse.json({ query: searchQuery });
  } catch (error) {
    console.error('Image Analysis Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
}

export async function suggestions(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const suggestions = await prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { shop: { name: { contains: q, mode: 'insensitive' } } },
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

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Suggestion Error', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function search(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    let query = searchParams.get('q') || '';
    const useAI = searchParams.get('ai') === 'true';

    const aiParams: any = {};
    if (useAI && query) {
      try {
        // Fetch valid category slugs for Gemini to match against
        const categories = await prisma.category.findMany({
          select: { slug: true },
        });
        const categorySlugs = categories.map((c) => c.slug);

        const aiResult = await parseSearchQueryWithAI(query, categorySlugs);

        if (aiResult) {
          // Use AI's cleaned keywords (e.g., "laptop" instead of "show me cheap laptops")
          if (aiResult.query) query = aiResult.query;

          // Map AI findings to filters
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

    const titleOnly =
      searchParams.get('titleOnly') === '1' ||
      searchParams.get('titleOnly') === 'true';
    const category = searchParams.get('category') || aiParams.category;
    const shopId = searchParams.get('shopId');
    const minPrice = searchParams.get('minPrice') || aiParams.minPrice;
    const maxPrice = searchParams.get('maxPrice') || aiParams.maxPrice;
    const sortBy = searchParams.get('sortBy') || aiParams.sortBy || 'createdAt';
    const sortOrder =
      searchParams.get('sortOrder') || aiParams.sortOrder || 'desc';

    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;

    const whereClause: ProductWhereInput = {
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      AND: [],
    };

    // Search by product name or seller shop name
    if (query) {
      if (titleOnly) {
        // Only search in product title
        whereClause.OR = [{ title: { contains: query, mode: 'insensitive' } }];
      } else {
        // Default behavior: search in title, description, and shop name
        whereClause.OR = [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { shop: { name: { contains: query, mode: 'insensitive' } } },
        ];
      }
    }

    if (category) {
      const data = await prisma.category.findFirst({
        where: {
          slug: category,
        },
        select: {
          id: true,
        },
      });

      if (!data) {
        return ResponseFactory.toNextResponse({
          success: false,
          message: 't_category_not_found',
          code: 403,
        } as ApiResponse);
      }

      const categoryIds = await getCategoryWithChildren(data.id);
      whereClause.categoryId = { in: categoryIds };
    }

    if (shopId) {
      whereClause.shopId = shopId;
    }

    if (minPrice) {
      whereClause.minPrice = {
        gte: Number(minPrice),
      };
    }

    if (maxPrice) {
      whereClause.maxPrice = {
        lte: Number(maxPrice),
      };
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

    return NextResponse.json({
      success: true,
      products: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

async function getCategoryWithChildren(
  rootId: string,
  maxDepth = 6
): Promise<string[]> {
  // BFS
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
