import { NextRequest, NextResponse } from 'next/server';
import { searchProductsService } from '@/features/search/services/search.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const query = searchParams.get('q') || '';
    const useAI = searchParams.get('ai') === 'true';
    const titleOnly =
      searchParams.get('titleOnly') === '1' ||
      searchParams.get('titleOnly') === 'true';
    const category = searchParams.get('category');
    const shopId = searchParams.get('shopId');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder');
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;

    const result = await searchProductsService({
      q: query,
      useAI,
      titleOnly,
      category,
      shopId,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      products: result.products,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
