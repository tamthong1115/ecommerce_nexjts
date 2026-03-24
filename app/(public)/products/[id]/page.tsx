import { RecommendationService } from '@/features/recommend_system/services/recommendation.services';
import { TfidfStrategy } from '@/features/recommend_system/strategy/tfidf';
import DetailPage from '@/app/(public)/products/[id]/detail-client';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recommendService = new RecommendationService();
  const product = await recommendService.getProducts(new TfidfStrategy(), id);

  if (!product) return <div>Không tìm thấy sản phẩm</div>;

  return <DetailPage RecommendProduct={product} />;
}
