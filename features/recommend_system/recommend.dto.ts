import { $Enums } from '@prisma/client';
import VoucherType = $Enums.VoucherType;

export interface RecommendResponseDTO {
  product_id: string | null;
  algorithm: string;
  recommendations: Array<{ product_id: string; score: number }>;
}

export interface productRecommendDto {
  id: string;
  title: string;
  minPrice: number;
  ratingAvg: number;
  ratingCount: number;
  soldCount: number;
  description: string;
  origin: string | null;
  imageUrl: string;
  voucher: {
    type: VoucherType;
    value: number;
    maxDiscount: number;
  } | null;
}
