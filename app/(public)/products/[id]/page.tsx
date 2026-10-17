import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { RecommendationService } from '@/features/recommend_system/services/recommendation.services';
import { TfidfStrategy } from '@/features/recommend_system/strategy/tfidf';
import DetailPage from '@/app/(public)/products/[id]/detail-client';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        title: true,
        description: true,
        images: { take: 1, select: { url: true } },
      },
    });

    if (!product) {
      return {
        title: 'Sản phẩm không tìm thấy',
      };
    }

    return {
      title: product.title,
      description: product.description || `Chi tiết sản phẩm ${product.title}`,
      openGraph: {
        title: product.title,
        description: product.description || `Chi tiết sản phẩm ${product.title}`,
        images: product.images[0]?.url ? [product.images[0].url] : [],
      },
    };
  } catch {
    return {
      title: 'Chi tiết sản phẩm',
    };
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;

  const productExists = await prisma.product.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!productExists) {
    notFound();
  }

  const recommendService = new RecommendationService();
  const recommendedProducts = await recommendService
    .getProducts(new TfidfStrategy(), id)
    .catch(() => []);

  return <DetailPage RecommendProduct={recommendedProducts} />;
}
