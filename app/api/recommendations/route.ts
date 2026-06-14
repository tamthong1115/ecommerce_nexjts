import { NextRequest, NextResponse } from 'next/server';
import { RecommendationService } from '@/features/recommend_system/services/recommendation.services';
import { FpGrowthStrategy } from '@/features/recommend_system/strategy/FpGrowth.strategy';
import { CFStrategy } from '@/features/recommend_system/strategy/cf.strategy';

const svc = new RecommendationService();

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get('type');
  const productId = searchParams.get('productId');

  if (!productId) {
    return NextResponse.json(
      { error: 'productId is required' },
      { status: 400 }
    );
  }

  try {
    const strategy =
      type === 'bought-together' ? new FpGrowthStrategy() : new CFStrategy();
    const products = await svc.getProducts(strategy, productId);
    return NextResponse.json(products);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
