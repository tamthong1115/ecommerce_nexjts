import { prisma } from '@/lib/db';
import { Prisma } from '@/lib/generated/prisma';
import { withAdmin } from '@/lib/with-auth';
import { NextRequest, NextResponse } from 'next/server';

// build api for calculator revenue by a week, a month, 3 months and months
// a week: show data (sum of each day) of 7 days lastest
// a month: show data (sum of each day) of 30 days lastest
// 3 months: show data (sum of each day) of 3 months latests
// months: show data (sum of each month) of 12 months lastest
export const GET = withAdmin(async (userId: string, request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  //the elements that api will return
  const amount = Number(searchParams.get('amount') ?? 5);

  //period of time to show
  const period = searchParams.get('period')?.toString();

  //option: watch detail of any month (e.g., "2025-10")
  const monthParam = searchParams.get('month')?.toString();

  // --- 1. Base whereClause (Dates only) ---
  // IMPROVEMENT: We remove 'status: "PAID"' here so we can
  // query for all 5 statuses in our new query.
  const whereClause: Prisma.OrderWhereInput = {
    status: 'DELIVERED',
    fulfillmentStatus: 'FULFILLED',
    paymentStatus: 'PAID',
  };

  try {
    // --- 2. Add date logic based on params ---
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now.setHours(23, 59, 59, 999)); // End of today

    // This entire date logic block remains unchanged
    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      // Option: View details of a specific month (group by day)
      const [year, month] = monthParam.split('-').map(Number);
      startDate = new Date(year, month - 1, 1); // First day of the month
      endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of the month
    } else {
      // Option: View a general period
      switch (period) {
        case 'week':
          // Data for the last 7 days (including today)
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 6);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'month':
          // Data for the last 30 days (including today)
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 29);
          startDate.setHours(0, 0, 0, 0);
          break;
        case '3months':
          // Data for the last 90 days (including today)
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 89);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'months':
          // Data for the last 12 months (including this month)
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 11);
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          break;
        default:
          // Default to last 7 days
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 6);
          startDate.setHours(0, 0, 0, 0);
      }
    }

    // Add the date range to the base whereClause
    whereClause.placedAt = {
      gte: startDate,
      lte: endDate,
    };

    // ---
    // 3: Get the top 10 product IDs and their total quantity
    // ---
    const aggregatedData = await prisma.orderItem.groupBy({
      // Group by the product ID
      by: ['productId'],

      // Apply your original filters to the related order
      // Note: 'order' is the assumed relation name from OrderItem -> Order
      where: {
        order: {
          ...whereClause,
        },
      },

      // Sum the 'quantity' field for each group
      _sum: {
        quantity: true,
      },

      // Order by the summed quantity in descending order
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },

      // Get only the top 10
      take: amount,
    });

    /*
`aggregatedData` will look like this:
[
  { productId: 'clx123', _sum: { quantity: 500 } },
  { productId: 'clx456', _sum: { quantity: 450 } },
  ...
]
*/

    // ---
    // 4: Get the product details (like title) for the top 10
    // ---

    // Extract just the product IDs from the aggregated data
    const productIds = aggregatedData.map((item) => item.productId);

    // Fetch the corresponding products
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        title: true,
      },
    });

    // Create a simple map for easy lookup
    const productMap = new Map(products.map((p) => [p.id, p.title]));

    // ---
    // 5: Combine the data into a final list
    // ---
    const topProducts = aggregatedData.map((agg) => ({
      productId: agg.productId,
      title: productMap.get(agg.productId) || 'Unknown Product',
      totalQuantity: agg._sum.quantity, // The summed quantity
    }));

    /*
`topProducts` is your final result:
[
  { productId: 'clx123', title: 'Product A', totalQuantity: 500 },
  { productId: 'clx456', title: 'Product B', totalQuantity: 450 },
  ...
]
*/
    return NextResponse.json({
      success: true,
      data: topProducts,
    });
  } catch (error) {
    console.error('Failed to fetch revenue data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
});
