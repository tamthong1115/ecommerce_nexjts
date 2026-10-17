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

  //period of time to show
  const period = searchParams.get('period')?.toString();

  //option: watch detail of any month (e.g., "2025-10")
  // Fixed typo from ',month' to 'month'
  const monthParam = searchParams.get('month')?.toString();

  const whereClause: Prisma.OrderWhereInput = {
    fulfillmentStatus: 'FULFILLED',
    status: 'DELIVERED',
    paymentStatus: 'PAID',
  };

  // --- 2. Add date logic based on params ---
  const now = new Date();
  let startDate: Date;
  let endDate: Date = new Date(now.setHours(23, 59, 59, 999)); // End of today
  let groupByMonth = false;

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
        startDate.setDate(startDate.getDate() - 6); // e.g., 11th -> 5th. (5,6,7,8,9,10,11) is 7 days
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        // Data for the last 30 days (including today)
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 29); // Go back 29 days to get 30 days total
        startDate.setHours(0, 0, 0, 0);
        break;
      case '3months':
        // Data for the last 90 days (including today)
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 89); // Go back 89 days to get 90 days total
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'months':
        // Data for the last 12 months (including this month)
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 11); // e.g., Nov 2025 -> Dec 2024
        startDate.setDate(1); // Set to the 1st day of that month
        startDate.setHours(0, 0, 0, 0);
        groupByMonth = true; // Special case: group by month
        break;
      default:
        // Default to last 7 days if no valid period is set
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
    }
  }

  whereClause.placedAt = {
    gte: startDate,
    lte: endDate,
  };

  // --- 3. Fetch all orders in the range ---
  try {
    const orders = await prisma.order.findMany({
      where: whereClause,
      select: {
        grandTotal: true,
        placedAt: true,
      },
      orderBy: {
        placedAt: 'asc', // Order ascending for processing
      },
    });

    // --- 4. Group data in JavaScript for the chart ---
    // We group by UTC date to keep things consistent
    const groupedData = new Map<string, number>();
    let totalSum = 0;

    for (const order of orders) {
      if (!order.placedAt) continue;

      // Use UTC date for grouping
      const dateKey = order.placedAt.toISOString();

      const key = groupByMonth
        ? dateKey.substring(0, 7) // 'YYYY-MM'
        : dateKey.substring(0, 10); // 'YYYY-MM-DD'

      const currentTotal = groupedData.get(key) || 0;
      const newTotal = currentTotal + order.grandTotal.toNumber();
      groupedData.set(key, newTotal);

      totalSum += order.grandTotal.toNumber(); // Calculate total sum
    }

    // --- 5. Fill in gaps (days/months with 0 revenue) ---
    const chartData = [];
    const currentDate = new Date(startDate);

    // Helper to get UTC date key
    const getUTCKey = (d: Date, byMonth: boolean) => {
      const iso = d.toISOString();
      return byMonth ? iso.substring(0, 7) : iso.substring(0, 10);
    };

    if (groupByMonth) {
      // Loop from start month to end month
      currentDate.setDate(1); // Start from 1st of the month
      // FIX: Use <= to include the last month
      while (currentDate <= endDate) {
        const key = getUTCKey(currentDate, true);
        chartData.push({
          date: key,
          total: groupedData.get(key) || 0,
        });
        currentDate.setMonth(currentDate.getMonth() + 1); // Move to next month
      }
    } else {
      // Loop from start day to end day
      // FIX: Use <= to include the last day
      while (currentDate <= endDate) {
        const key = getUTCKey(currentDate, false);
        chartData.push({
          date: key,
          total: groupedData.get(key) || 0,
        });
        currentDate.setDate(currentDate.getDate() + 1); // Move to next day
      }
    }

    // --- 6. Return everything ---
    return NextResponse.json({
      success: true,
      data: chartData, // This is the list of {date, total} for the chart
      sum: totalSum, // This is the total revenue for the period
    });
  } catch (error) {
    console.error('Failed to fetch revenue data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
});
