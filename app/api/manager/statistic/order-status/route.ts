import { prisma } from '@/lib/db';
import { Prisma } from '@/lib/generated/prisma';
import { withAdmin } from '@/lib/with-auth';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withAdmin(async (userId: string, request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  // --- 1. Xử lý logic thời gian (Date Logic) ---
  const period = searchParams.get('period')?.toString();
  const monthParam = searchParams.get('month')?.toString();

  const now = new Date();
  let startDate: Date;
  let endDate: Date = new Date(now.setHours(23, 59, 59, 999)); // Hết ngày hôm nay

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [year, month] = monthParam.split('-').map(Number);
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 0, 23, 59, 59, 999);
  } else {
    switch (period) {
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        break;
      case '3months':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 89);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'months': // 12 tháng
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 11);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default: // Mặc định 7 ngày
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
    }
  }

  // Base date filter cho toàn bộ các query
  const dateFilter: Prisma.DateTimeFilter = {
    gte: startDate,
    lte: endDate,
  };

  try {
    // --- 2. Thực hiện query song song (Parallel Queries) ---
    // Vì điều kiện lọc của mỗi trạng thái là khác nhau (status vs paymentStatus),
    // ta không thể dùng groupBy đơn thuần. Transaction giúp chạy nhanh và nhất quán.

    const [
      pendingCount,
      paidCount,
      processingCount,
      canceledCount,
      refundedCount,
    ] = await prisma.$transaction([
      // 1. Đang chờ (PENDING)
      prisma.order.count({
        where: {
          placedAt: dateFilter,
          status: 'PENDING',
          paymentStatus: {
            in: ['PENDING'],
          },
          fulfillmentStatus: 'NOT_FULFILLED',
        },
      }),

      // 2. Đã vận chuyển (DELIVERED)
      // Logic: OrderStatus là PAID (thường implicits PaymentStatus cũng là PAID/CAPTURED)
      prisma.order.count({
        where: {
          placedAt: dateFilter,
          status: 'DELIVERED',
          paymentStatus: 'PAID',
          fulfillmentStatus: 'FULFILLED',
        },
      }),

      // 3. Đang xử lý (PROCESSING)
      prisma.order.count({
        where: {
          placedAt: dateFilter,
          status: 'PROCESSING',
        },
      }),

      // 4. Đã hủy (CANCELED)
      prisma.order.count({
        where: {
          placedAt: dateFilter,
          status: 'CANCELED',
        },
      }),

      // 5. Đã hoàn tiền (REFUNDED) -> LƯU Ý: Check PaymentStatus
      prisma.order.count({
        where: {
          placedAt: dateFilter,
          // Ưu tiên check PaymentStatus vì đây là yếu tố quyết định việc "Hoàn tiền"
          paymentStatus: 'REFUNDED',
        },
      }),
    ]);

    // --- 3. Format dữ liệu trả về ---
    // Trả về mảng đúng format frontend cần, label giữ nguyên key tiếng Anh
    // để frontend map sang tiếng Việt hoặc dùng trực tiếp.
    const statusCountsArray = [
      {
        label: 'PENDING', // Đang chờ
        total: pendingCount,
      },
      {
        label: 'DELIVERED', // Đã thanh toán
        total: paidCount,
      },
      {
        label: 'PROCESSING', // Đang xử lý
        total: processingCount,
      },
      {
        label: 'CANCELED', // Đã hủy
        total: canceledCount,
      },
      {
        label: 'REFUNDED', // Đã hoàn tiền
        total: refundedCount,
      },
    ];

    return NextResponse.json({
      success: true,
      data: statusCountsArray,
    });
  } catch (error) {
    console.error('Failed to fetch order status data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
});
