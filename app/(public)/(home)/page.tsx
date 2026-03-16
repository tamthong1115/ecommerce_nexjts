import { CarouselPanel } from '@/features/public/home/components/carousel-panel';
import { CategoryPromotionPanel } from '@/features/public/home/components/category-promotion-panel';
import { NewArrivals } from '@/features/public/home/components/new-arrivals';
import { SuggestDealToday } from '@/features/public/home/components/suggest-deal-today';
import { TopDealItems } from '@/features/public/home/components/top-deal-items';
import banner2 from '../../../public/banners/banner-home-1.png';
import banner1 from '../../../public/banners/banner-home-2.png';
import Banner from '@/features/public/components/banner';
import { RecommendationService } from '@/features/recommend_system/services/recommendation.services';
import { TrendingStrategy } from '@/features/recommend_system/strategy/trending.strategy';

export default async function Home() {
  const recommendService = new RecommendationService();
  const trendingProducts = await recommendService.getProducts(
    new TrendingStrategy()
  );

  return (
    <div className="w-full h-full flex flex-col justify-start items-center gap-4">
      <CarouselPanel />
      <CategoryPromotionPanel />
      <Banner banner={banner2} />
      <TopDealItems data={trendingProducts} size={'5'} />
      <NewArrivals size={'5'} />
      <Banner banner={banner1} />
      <SuggestDealToday size="5" />
    </div>
  );
}
