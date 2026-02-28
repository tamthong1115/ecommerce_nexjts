import { prisma } from '@/lib/db';
import redisClient from '@/lib/redis';
import { StockManager } from '@/lib/stock-manager';

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const CACHE_KEY = `product:${id}:detail`;

    let productData: any = null;
    const cachedData = await redisClient.get(CACHE_KEY);
    if (cachedData) {
      productData = JSON.parse(cachedData);
    } else {
      const now = new Date();
      const data = await prisma.product.findUnique({
        where: {
          id: id,
        },
        select: {
          id: true,
          shop: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
              ratingAvg: true,
              ratingCount: true,
              slug: true,
            },
          },
          title: true,
          description: true,
          attributes: true,
          ratingAvg: true,
          ratingCount: true,
          minPrice: true,
          maxPrice: true,
          soldCount: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          images: {
            select: {
              url: true,
              alt: true,
            },
          },
          variants: {
            where: {
              isActive: true,
            },
            select: {
              id: true,
              productId: true,
              image: true,
              sku: true,
              price: true,
              stock: true,
              attributes: true,
              name: true,
            },
          },
          VoucherProduct: {
            where: {
              voucher: {
                isActive: true,
                startAt: { lte: now },
                endAt: { gte: now },
              },
            },
            select: {
              voucher: {
                select: {
                  id: true,
                  code: true,
                  type: true,
                  value: true,
                  maxDiscount: true,
                  minSubtotal: true,
                  startAt: true,
                  endAt: true,
                },
              },
            },
          },
        },
      });

      if (!data) {
        return new Response(JSON.stringify({ message: 'Product not found' }), {
          status: 404,
        });
      }

      productData = data;
      await redisClient.setex(CACHE_KEY, 3600, JSON.stringify(productData));
    }

    console.log(
      `[GET /api/product/${id}] data: ${JSON.stringify(productData, null, 2)}`
    );

    if (productData.variants && productData.variants.length > 0) {
      // Dùng Promise.all để lấy stock song song (nhanh hơn)
      const variantsWithRealStock = await Promise.all(
        productData.variants.map(async (v: any) => {
          const realStock = await StockManager.getStock(v.id);
          return {
            ...v,
            stock: realStock, // Ghi đè stock
          };
        })
      );
      productData.variants = variantsWithRealStock;
    }
    return new Response(JSON.stringify({ success: true, productData }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
      status: 500,
    });
  }
}
