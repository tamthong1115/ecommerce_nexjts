import crypto from 'crypto';
import { $Enums, Currency, FulfillmentStatus, PaymentStatus } from '@prisma/client';
import OrderStatus = $Enums.OrderStatus;
import { prisma } from '@/lib/db';


async function generateFakeOrders(numOrders = 2000) {
  console.log("⏳ Bắt đầu quá trình bơm dữ liệu ảo...");

  // 1. Lấy dữ liệu thật từ DB làm nguyên liệu (Tránh lỗi Foreign Key)
  const users = await prisma.user.findMany({ select: { id: true }, take: 100 });

  // Lấy các sản phẩm đang được PUBLISHED
  const products = await prisma.product.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true, shopId: true, title: true, minPrice: true },
    take: 50
  });

  if (users.length === 0 || products.length < 5) {
    console.error("❌ Lỗi: Cần ít nhất 1 User và 5 Product trong DB để chạy script này!");
    return;
  }

  // 2. Định nghĩa các "Quy luật mua sắm" (Giúp FP-Growth dễ dàng bắt được rule)
  const comboA = [products[0], products[1]]; // Ví dụ: SP 0 và SP 1 hay được mua cùng nhau
  const comboB = [products[2], products[3], products[4]]; // SP 2, 3, 4 đi chung 1 combo

  const ordersData: any[] = [];
  const orderItemsData: any[] = [];

  // Dữ liệu giả cho địa chỉ (kiểu Json)
  const dummyAddress = { line1: "123 Fake Street", city: "Test City", phone: "0123456789" };

  console.log(`⚙️ Đang tạo ${numOrders} đơn hàng...`);

  // 3. Vòng lặp tạo dữ liệu ảo trong RAM
  for (let i = 0; i < numOrders; i++) {
    const orderId = crypto.randomUUID();
    const user = users[Math.floor(Math.random() * users.length)];

    // Quyết định xem đơn hàng này sẽ mua cái gì để tạo quy luật
    const scenario = Math.random();
    let basket: typeof products = [];

    if (scenario < 0.4) {
      basket = comboA; // 40% xác suất khách mua Combo A
    } else if (scenario < 0.7) {
      basket = comboB; // 30% xác suất khách mua Combo B
    } else {
      // 30% xác suất khách mua lung tung (chọn random 1-3 món)
      const numItems = Math.floor(Math.random() * 3) + 1;
      const shuffled = [...products].sort(() => 0.5 - Math.random());
      basket = shuffled.slice(0, numItems);
    }

    // Tính tổng tiền dựa trên giá minPrice
    const totalAmount = basket.reduce((sum, item) => sum + Number(item.minPrice), 0);
    const shopId = basket[0].shopId; // Lấy shopId của món đầu tiên

    // Tạo ngày lùi về quá khứ ngẫu nhiên trong 30 ngày
    const placedAt = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
    const dateString = placedAt.toISOString().slice(0, 10).replace(/-/g, '');

    // Chuẩn bị record Order
    ordersData.push({
      id: orderId,
      orderNumber: `FAKE-${dateString}-${i.toString().padStart(5, '0')}`, // Đánh dấu chữ FAKE
      userId: user.id,
      shopId: shopId,
      status: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.PAID,
      fulfillmentStatus: FulfillmentStatus.FULFILLED,
      currency: Currency.VND,
      itemsTotal: totalAmount,
      shippingFee: 0,
      discountTotal: 0,
      taxTotal: 0,
      grandTotal: totalAmount,
      shippingAddress: dummyAddress,
      placedAt: placedAt,
      updatedAt: placedAt
    });

    // Chuẩn bị records OrderItem
    for (const item of basket) {
      orderItemsData.push({
        id: crypto.randomUUID(),
        orderId: orderId,
        productId: item.id,
        shopId: item.shopId,
        title: `(FAKE) ${item.title}`,
        unitPrice: item.minPrice,
        quantity: 1,
        discount: 0,
        total: item.minPrice
      });
    }
  }

  // 4. Bơm hàng loạt vào DB bằng Transaction
  console.log("💾 Đang ghi vào Database bằng Prisma (Có thể mất vài giây)...");

  try {
    await prisma.$transaction([
      prisma.order.createMany({ data: ordersData, skipDuplicates: true }),
      prisma.orderItem.createMany({ data: orderItemsData, skipDuplicates: true })
    ]);
    console.log("✅ Hoàn tất! Đã bơm thành công 2000 đơn hàng ảo.");
  } catch (error) {
    console.error("❌ Quá trình lưu thất bại:", error);
  }
}

// Chạy hàm và ngắt kết nối an toàn
generateFakeOrders()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });