'use client';

import { useQuery } from '@tanstack/react-query';
import { productRecommendDto } from '@/features/recommend_system/recommend.dto';

type RecommendType = 'bought-together' | 'also-like';

async function fetchRecommendations(
  type: RecommendType,
  productId: string
): Promise<productRecommendDto[]> {
  const res = await fetch(
    `/api/recommendations?type=${type}&productId=${productId}`
  );
  if (!res.ok) return [];
  return res.json();
}

export function useRecommendations(type: RecommendType, productId?: string) {
  return useQuery({
    queryKey: ['recommendations', type, productId],
    queryFn: () => fetchRecommendations(type, productId!),
    enabled: Boolean(productId),
    staleTime: 1000 * 60 * 5,
  });
}
