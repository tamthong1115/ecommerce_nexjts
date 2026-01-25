import {
  $Enums,
  ConversationStatus,
  ConversationType,
  FulfillmentStatus,
  MessageType,
  PaymentProvider,
  PaymentStatus,
  Prisma,
  PrismaClient,
  ProductStatus,
  Role,
  ShopMemberRole,
  Visibility,
  VoucherType, 
} from '../lib/generated/prisma';
import { faker } from '@faker-js/faker';
import { Currency, OrderStatus } from '../lib/generated/prisma';
import MessageRole = $Enums.MessageRole;
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🧹 Đang xóa dữ liệu cũ...');
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.orderVoucher.deleteMany();
  await prisma.voucherRedemption.deleteMany();
  await prisma.voucherProduct.deleteMany();
  await prisma.voucherCategory.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.review.deleteMany();
  await prisma.returnItem.deleteMany();
  await prisma.returnRequest.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.orderPayment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.shopMember.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.address.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  console.log('🚀 Bắt đầu seed dữ liệu...');

  // ------------------------
  // 1️⃣ USERS
  // ------------------------

  const TOTAL_USERS = 100;
  const SELLER_COUNT = 30;
  const ADMIN_COUNT = 3;

  const uniqueEmails = new Set<string>();
  while (uniqueEmails.size < TOTAL_USERS) {
    uniqueEmails.add(faker.internet.email().toLowerCase());
  }
  const emailList = Array.from(uniqueEmails);

  const users = await Promise.all(
    emailList.map((email, idx) =>
      prisma.user.create({
        data: {
          id: faker.string.uuid(),
          name: faker.person.fullName(),
          email,
          emailVerified: true,
          image: faker.image.avatar(),
          shopCount:faker.number.int({ min: 10, max: 10000 }),
          role:
            idx < ADMIN_COUNT
              ? Role.admin
              : idx < ADMIN_COUNT + SELLER_COUNT
                ? Role.seller
                : Role.user,
        },
      })
    )
  );
  console.log(`✅ Created ${users.length} users`);

  // ------------------------
  // 1️⃣ SESSIONS
  // ------------------------
  const session = await Promise.all(
    Array.from({ length: TOTAL_USERS }).map(() =>
      prisma.session.create({
        data: {
          id: faker.string.uuid(),
          expiresAt: faker.date.future(),
          token: faker.string.uuid(),
          createdAt: faker.date.past(),
          updatedAt: faker.date.recent(),
          ipAddress: faker.internet.ipv4(),
          userAgent: faker.internet.userAgent(),
          userId: faker.helpers.arrayElement(users).id,
        },
      })
    )
  );

  console.log(`✅ Created ${session.length} sessions`);

  // ------------------------
  // 1️⃣ ACCOUNTS
  // ------------------------
  const account = await Promise.all(
    Array.from({ length: TOTAL_USERS }).map(() =>
      prisma.account.create({
        data: {
          id: faker.string.uuid(),
          accountId: faker.string.uuid(),
          providerId: faker.company.name(),
          userId: faker.helpers.arrayElement(users).id,
          accessToken: null,
          refreshToken: null,
          accessTokenExpiresAt: null,
          refreshTokenExpiresAt: null,
          scope: null,
          password: null,
          createdAt: faker.date.past(),
          updatedAt: faker.date.recent(),
        },
      })
    )
  );

  console.log(`✅ Created ${account.length} accounts`);

  // ------------------------
  // 1️⃣ VERIFICAION
  // ------------------------
  const verification = await Promise.all(
    Array.from({ length: TOTAL_USERS }).map(() =>
      prisma.verification.create({
        data: {
          id: faker.string.uuid(),
          identifier: faker.internet.email(),
          value: faker.string.numeric(6),
          expiresAt: faker.date.future(),
          createdAt: faker.date.past(),
          updatedAt: faker.date.recent(),
        },
      })
    )
  );

  console.log(`✅ Created ${verification.length} verifications`);

  // ------------------------
  // 1️⃣ USER PROFILE
  // ------------------------
  const userProfiles = await Promise.all(
    users.slice(0, 100).map((user) =>
      prisma.userProfile.create({
        data: {
          id: faker.string.uuid(),
          userId: user.id,
          phone: faker.phone.number(),
          emailForBill: faker.internet.email(),
          birthDate: faker.date.past({ years: 30 }),
          gender: faker.helpers.arrayElement(['MALE', 'FEMALE', 'OTHER']),
          bio: faker.lorem.sentence(),
          createdAt: faker.date.past(),
          updatedAt: faker.date.recent(),
        },
      })
    )
  );

  console.log(`✅ Created ${userProfiles.length} userProfiles`);

  // ------------------------
  // 1️⃣ ADDRESS
  // ------------------------
  const address = await Promise.all(
    Array.from({ length: TOTAL_USERS }).map(() =>
      prisma.address.create({
        data: {
          id: faker.string.uuid(),
          userId: faker.helpers.arrayElement(users).id,
          fullName: faker.person.fullName(),
          phone: faker.string.numeric(10),
          line1: faker.location.streetAddress(),
          line2: faker.location.secondaryAddress(),
          ward: faker.location.state(),
          city: faker.location.city(),
          province: faker.location.state(),
          country: faker.location.country(),
          postalCode: faker.location.zipCode(),
          isDefault: faker.datatype.boolean(),
          createdAt: faker.date.past(),
          updatedAt: faker.date.recent(),
          deletedAt: null,
        },
      })
    )
  );

  console.log(`✅ Created ${address.length} addresses`);

  // ------------------------v
  // 1️⃣ NOTIFICATION
  // ------------------------
  // const notification = await Promise.all(
  //   Array.from({ length: TOTAL_USERS }).map(() =>
  //     prisma.notification.create({
  //       data: {
  //         id: faker.string.uuid(),
  //         userId: faker.helpers.arrayElement(users).id,
  //         type: faker.helpers.arrayElement(['INFO', 'WARNING', 'ALERT']),
  //         title: faker.lorem.sentence(),
  //         body: faker.lorem.paragraph(),
  //         metadata: undefined,
  //         readAt: null,
  //         createdAt: faker.date.past(),
  //       },
  //     })
  //   )
  // );
  //
  // console.log(`✅ Created ${notification.length} notifications`);

  // ------------------------
  // 2️⃣ SHOPS
  // ------------------------
  const sellerUsers = users.filter((u) => u.role === Role.seller);
  const SHOP_COUNT = Math.min(SELLER_COUNT, sellerUsers.length);

  const shops = await Promise.all(
    sellerUsers.slice(0, SHOP_COUNT).map((owner) =>
  prisma.shop.create({
        data: {
          ownerId: owner.id,
          name: faker.company.name(),
          slug: faker.company.name().toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + faker.string.uuid().slice(0, 8),
          description: faker.company.catchPhrase(),
          logoUrl: faker.image.urlPicsumPhotos({ width: 200, height: 200 }),
          coverUrl: faker.image.urlPicsumPhotos({ width: 800, height: 300 }),
          status: 'ACTIVE',
          followerCount:faker.number.int({ min: 10, max: 10000 })
        },
      })

    )
  );

  console.log(`✅ Created ${shops.length} shops`);

  // ------------------------
  // 2️⃣ SHOP MEMBERS
  // ------------------------
  const BATCH = 100;
  const rows: Prisma.ShopMemberCreateManyInput[] = [];
  const usedPairs = new Set<string>();

  // 1) Ensure every shop owner exists as OWNER
  for (const s of shops) {
    const key = `${s.id}_${s.ownerId}`;
    if (!usedPairs.has(key)) {
      usedPairs.add(key);
      rows.push({
        id: faker.string.uuid(),
        shopId: s.id,
        userId: s.ownerId,
        role: ShopMemberRole.OWNER,
        createdAt: faker.date.recent(),
      });
    }
  }

  // 2) Add 2-6 additional members per shop with weighted roles
  for (const s of shops) {
    const memberCount = faker.number.int({ min: 1, max: 6 });
    const sellerPool = sellerUsers.filter((u) => u.id !== s.ownerId);
    const userPool = users.filter((u) => u.id !== s.ownerId);

    const picked = new Set<string>();
    let attempts = 0;
    while (picked.size < memberCount && attempts < memberCount * 10) {
      attempts++;
      // bias: 60% pick from sellers, otherwise from all users
      const pool = faker.datatype.boolean({ probability: 0.6 }) ? sellerPool : userPool;
      if (pool.length === 0) break;
      const u = faker.helpers.arrayElement(pool);
      const key = `${s.id}_${u.id}`;
      if (usedPairs.has(key) || picked.has(key)) continue;
      picked.add(key);

      // Weighted role selection
      const roll = faker.number.int({ min: 1, max: SELLER_COUNT });
      const role = roll <= 20 ? ShopMemberRole.STAFF : ShopMemberRole.MANAGER;


      usedPairs.add(key);
      rows.push({
        id: faker.string.uuid(),
        shopId: s.id,
        userId: u.id,
        role,
        createdAt: faker.date.past(),
      });
    }
  }

  // 3) Insert in batches to avoid pool exhaustion and use skipDuplicates
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    await prisma.shopMember.createMany({ data: chunk, skipDuplicates: true });
  }

  console.log(`✅ Created/ensured ${rows.length} shop members`);

  // Ensure every shop owner is also present at least once as a member (optional)
  const ownerMemberPromises = shops.map(async (s) => {
    const exists = await prisma.shopMember.findFirst({
      where: { shopId: s.id, userId: s.ownerId },
    });
    if (!exists) {
      return prisma.shopMember.create({
        data: {
          id: faker.string.uuid(),
          shopId: s.id,
          userId: s.ownerId,
          role: ShopMemberRole.OWNER,
          createdAt: faker.date.recent(),
        },
      });
    }
    return null;
  });

  const ownerMembers = (await Promise.all(ownerMemberPromises)).filter(Boolean);
  if (ownerMembers.length) {
    console.log(`✅ Ensured ${ownerMembers.length} shop owners are also members`);
  }

  console.log('🎉 Minimal seed complete: users (with sellers), shops, and shop members created.');
  console.log('Extend the script to seed products, orders, conversations, etc., as needed.');


  // ------------------------
  // 3️⃣ CATEGORIES
  // ------------------------
  const categoryTree = [
    {
      name: 'Electronics',
      slug: 'electronics',
      position: 0,
      children: [
        {
          name: 'Smartphones & Accessories',
          slug: 'smartphones-accessories',
          position: 0,
        },
        {
          name: 'Computers & Laptops',
          slug: 'computers-laptops',
          position: 1,
        },
        { name: 'Audio & Headphones', slug: 'audio-headphones', position: 2 },
        { name: 'Cameras & Drones', slug: 'cameras-drones', position: 3 },
        { name: 'Smart Home & IoT', slug: 'smart-home-iot', position: 4 },
      ],
    },
    {
      name: 'Fashion & Apparel',
      slug: 'fashion-apparel',
      position: 1,
      children: [
        { name: 'Women’s Clothing', slug: 'womens-clothing', position: 0 },
        { name: 'Men’s Clothing', slug: 'mens-clothing', position: 1 },
        { name: 'Shoes & Footwear', slug: 'shoes-footwear', position: 2 },
        { name: 'Bags & Accessories', slug: 'bags-accessories', position: 3 },
        {
          name: 'Jewellery & Watches',
          slug: 'jewellery-watches',
          position: 4,
        },
      ],
    },
    // ... add further top‐level entries similarly
    {
      name: 'Home & Living',
      slug: 'home-living',
      position: 2,
      children: [
        { name: 'Furniture', slug: 'furniture', position: 0 },
        { name: 'Home Décor', slug: 'home-decor', position: 1 },
        { name: 'Kitchen & Dining', slug: 'kitchen-dining', position: 2 },
        { name: 'Bedding & Bath', slug: 'bedding-bath', position: 3 },
        { name: 'Lighting & Lamps', slug: 'lighting-lamps', position: 4 },
      ],
    },
    {
      name: 'Beauty & Personal Care',
      slug: 'beauty-personal-care',
      position: 3,
      children: [
        { name: 'Skincare', slug: 'skincare', position: 0 },
        { name: 'Haircare', slug: 'haircare', position: 1 },
        { name: 'Makeup & Cosmetics', slug: 'makeup-cosmetics', position: 2 },
        { name: 'Fragrances', slug: 'fragrances', position: 3 },
        {
          name: 'Wellness & Self-care',
          slug: 'wellness-selfcare',
          position: 4,
        },
      ],
    },
    {
      name: 'Food & Beverages',
      slug: 'food-beverages',
      position: 4,
      children: [
        {
          name: 'Groceries & Daily Needs',
          slug: 'groceries-daily-needs',
          position: 0,
        },
        { name: 'Snacks & Sweets', slug: 'snacks-sweets', position: 1 },
        { name: 'Drinks & Beverages', slug: 'drinks-beverages', position: 2 },
        {
          name: 'Organic & Health Foods',
          slug: 'organic-health-foods',
          position: 3,
        },
        { name: 'Gourmet & Gifts', slug: 'gourmet-gifts', position: 4 },
      ],
    },
    {
      name: 'Sports & Outdoors',
      slug: 'sports-outdoors',
      position: 5,
      children: [
        { name: 'Fitness Equipment', slug: 'fitness-equipment', position: 0 },
        {
          name: 'Outdoor Recreation',
          slug: 'outdoor-recreation',
          position: 1,
        },
        { name: 'Sportswear', slug: 'sportswear', position: 2 },
        { name: 'Team Sports Gear', slug: 'team-sports-gear', position: 3 },
        { name: 'Camping & Hiking', slug: 'camping-hiking', position: 4 },
      ],
    },
    {
      name: 'Health & Wellness',
      slug: 'health-wellness',
      position: 6,
      children: [
        {
          name: 'Personal Care Devices',
          slug: 'personal-care-devices',
          position: 0,
        },
        { name: 'Fitness Trackers', slug: 'fitness-trackers', position: 1 },
        { name: 'Sleep & Relaxation', slug: 'sleep-relaxation', position: 2 },
        {
          name: 'Healthy Living Products',
          slug: 'healthy-living-products',
          position: 3,
        },
        {
          name: 'Vitamins & Supplements',
          slug: 'vitamins-supplements',
          position: 4,
        },
      ],
    },
    {
      name: 'Baby, Kids & Toys',
      slug: 'baby-kids-toys',
      position: 7,
      children: [
        {
          name: 'Baby Gear & Essentials',
          slug: 'baby-gear-essentials',
          position: 0,
        },
        { name: 'Toys & Games', slug: 'toys-games', position: 1 },
        {
          name: 'Kids Clothing & Shoes',
          slug: 'kids-clothing-shoes',
          position: 2,
        },
        {
          name: 'Educational & STEM Toys',
          slug: 'educational-stem-toys',
          position: 3,
        },
        {
          name: 'Kids Furniture & Decor',
          slug: 'kids-furniture-decor',
          position: 4,
        },
      ],
    },
    {
      name: 'Books, Movies & Games',
      slug: 'books-movies-games',
      position: 8,
      children: [
        { name: 'Books & eBooks', slug: 'books-ebooks', position: 0 },
        { name: 'Movies & TV Series', slug: 'movies-tv-series', position: 1 },
        {
          name: 'Video Games & Consoles',
          slug: 'video-games-consoles',
          position: 2,
        },
        {
          name: 'Board Games & Puzzles',
          slug: 'board-games-puzzles',
          position: 3,
        },
        {
          name: 'Music & Instruments',
          slug: 'music-instruments',
          position: 4,
        },
      ],
    },
    {
      name: 'Pet Supplies',
      slug: 'pet-supplies',
      position: 9,
      children: [
        { name: 'Pet Food', slug: 'pet-food', position: 0 },
        {
          name: 'Pet Toys & Accessories',
          slug: 'pet-toys-accessories',
          position: 1,
        },
        {
          name: 'Pet Health & Grooming',
          slug: 'pet-health-grooming',
          position: 2,
        },
        {
          name: 'Aquatic & Fish Supplies',
          slug: 'aquatic-fish-supplies',
          position: 3,
        },
        {
          name: 'Pet Bedding & Habitat',
          slug: 'pet-bedding-habitat',
          position: 4,
        },
      ],
    },
    {
      name: 'Bags, Luggage & Accessories',
      slug: 'bags-luggage-accessories',
      position: 10,
      children: [
        {
          name: 'Backpacks & School Bags',
          slug: 'backpacks-school-bags',
          position: 0,
        },
        { name: 'Travel Luggage', slug: 'travel-luggage', position: 1 },
        { name: 'Handbags & Wallets', slug: 'handbags-wallets', position: 2 },
        {
          name: 'Laptop Bags & Briefcases',
          slug: 'laptop-bags-briefcases',
          position: 3,
        },
        {
          name: 'Accessories & Wallets',
          slug: 'accessories-wallets',
          position: 4,
        },
      ],
    },
    {
      name: 'Automotive & Industrial',
      slug: 'automotive-industrial',
      position: 11,
      children: [
        { name: 'Car Accessories', slug: 'car-accessories', position: 0 },
        { name: 'Motorbike Parts', slug: 'motorbike-parts', position: 1 },
        { name: 'Tools & Equipment', slug: 'tools-equipment', position: 2 },
        {
          name: 'Industrial Supplies',
          slug: 'industrial-supplies',
          position: 3,
        },
        {
          name: 'Car Electronics & Audio',
          slug: 'car-electronics-audio',
          position: 4,
        },
      ],
    },
    {
      name: 'Office Supplies & Stationery',
      slug: 'office-supplies-stationery',
      position: 12,
      children: [
        { name: 'Office Furniture', slug: 'office-furniture', position: 0 },
        {
          name: 'Printers & Supplies',
          slug: 'printers-supplies',
          position: 1,
        },
        {
          name: 'Stationery & Writing',
          slug: 'stationery-writing',
          position: 2,
        },
        { name: 'School Supplies', slug: 'school-supplies', position: 3 },
        {
          name: 'Office Tech Accessories',
          slug: 'office-tech-accessories',
          position: 4,
        },
      ],
    },
    {
      name: 'DIY, Tools & Hardware',
      slug: 'diy-tools-hardware',
      position: 13,
      children: [
        { name: 'Power Tools', slug: 'power-tools', position: 0 },
        { name: 'Hand Tools', slug: 'hand-tools', position: 1 },
        {
          name: 'Building Materials',
          slug: 'building-materials',
          position: 2,
        },
        { name: 'Home Improvement', slug: 'home-improvement', position: 3 },
        {
          name: 'Painting & Decorating',
          slug: 'painting-decorating',
          position: 4,
        },
      ],
    },
    {
      name: 'Gifts & Special Occasions',
      slug: 'gifts-special-occasions',
      position: 14,
      children: [
        { name: 'Gift Hampers', slug: 'gift-hampers', position: 0 },
        { name: 'Seasonal Decor', slug: 'seasonal-decor', position: 1 },
        { name: 'Party Supplies', slug: 'party-supplies', position: 2 },
        {
          name: 'Personalized Gifts',
          slug: 'personalized-gifts',
          position: 3,
        },
        { name: 'Greeting Cards', slug: 'greeting-cards', position: 4 },
      ],
    },
  ];

  for (const topCat of categoryTree) {
    const topId = faker.string.uuid();
    await prisma.category.create({
      data: {
        id: topId,
        parentId: null,
        name: topCat.name,
        slug: topCat.slug,
        position: topCat.position,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        imageUrl: null,
      },
    });
    for (const sub of topCat.children) {
      await prisma.category.create({
        data: {
          id: faker.string.uuid(),
          parentId: topId,
          name: sub.name,
          slug: sub.slug,
          position: sub.position,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          imageUrl: null,
        },
      });
    }
  }
  const categories = await prisma.category.findMany();
  console.log(
    `✅ Seeded ${categoryTree.length} top-categories with sub-categories`
  );

  // ------------------------
  // 4️⃣ PRODUCTS
  // ------------------------
  console.log('🌱 Creating Products with consistent Variant prices...');

  const products = await Promise.all(
    Array.from({ length: 200 }).map(async () => {
      const shop = faker.helpers.arrayElement(shops);
      const category = faker.helpers.arrayElement(categories);

      // 1. Generate Variant Data in Memory First
      // We generate 3 variants per product
      const generatedVariants = Array.from({ length: 3 }).map(() => ({
        sku: `SKU-${faker.string.alphanumeric(8).toUpperCase()}-${Date.now()}`,
        name: faker.commerce.productMaterial(),
        image: faker.image.urlPicsumPhotos({ width: 600, height: 600, blur: 0 }),
        price: faker.number.float({
          min: 100_000,
          max: 500_000,
          fractionDigits: 0,
        }),
        stock: faker.number.int({ min: 5, max: 20 }),
        weightGrams: faker.number.int({ min: 50, max: 5000 }),
        lengthMm: faker.number.int({ min: 50, max: 500 }),
        widthMm: faker.number.int({ min: 50, max: 500 }),
        heightMm: faker.number.int({ min: 10, max: 300 }),
      }));

      // 2. Calculate Min and Max from the generated variants
      const prices = generatedVariants.map((v) => v.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      // Status & Visibility Logic
      const statusRoll = faker.number.int({ min: 1, max: 100 });
      const status =
        statusRoll <= 70
          ? ProductStatus.PUBLISHED
          : statusRoll <= 90
            ? ProductStatus.DRAFT
            : ProductStatus.ARCHIVED;

      const visibilityRoll = faker.number.int({ min: 1, max: 100 });
      const visibility =
        visibilityRoll <= 80
          ? Visibility.PUBLIC
          : visibilityRoll <= 95
            ? Visibility.UNLISTED
            : Visibility.PRIVATE;

      const productTitle = faker.commerce.productName();

      // 3. Create Product AND Variants in one go (Nested Write)
      return prisma.product.create({
        data: {
          shopId: shop.id,
          categoryId: category.id,
          title: productTitle,
          slug:
            faker.helpers.slugify(productTitle.toLowerCase()) +
            '-' +
            faker.string.alphanumeric(6).toLowerCase(),
          description: faker.commerce.productDescription(),
          origin: faker.location.country(),
          // ✅ USE CALCULATED VALUES HERE
          minPrice: minPrice,
          maxPrice: maxPrice,
          status,
          visibility,
          soldCount: faker.number.int({ min: 10, max: 10000 }),

          // Create Images inline
          images: {
            create: Array.from({ length: 3 }).map(() => ({
              url: faker.image.urlPicsumPhotos({ width: 600, height: 600, blur: 0 }),
              alt: productTitle,
            })),
          },

          // Create Variants inline using the pre-generated data
          variants: {
            create: generatedVariants.map((v) => ({
              sku: v.sku,
              name: v.name,
              image: v.image,
              price: v.price, // ✅ Matches the calculation used for min/max
              stock: v.stock,
              weightGrams: v.weightGrams,
              lengthMm: v.lengthMm,
              widthMm: v.widthMm,
              heightMm: v.heightMm,
            })),
          },
        },
        include: {
          variants: true, // Return variants so we can use them for Orders later
        },
      });
    })
  );

  // Flatten variants array for later use in Cart/Orders seeding
  const variants = products.flatMap((p) => p.variants);

  console.log(`✅ Created ${products.length} products with consistent price ranges.`);
  console.log(`✅ Created ${variants.length} product variants.`);

  // ------------------------
  // 6️⃣ PRODUCT IMAGES
  // ------------------------
  const images = await Promise.all(
    products.flatMap((product) =>
      Array.from({ length: 3 }).map(() =>
        prisma.productImage.create({
          data: {
            productId: product.id,
            url: faker.image.urlPicsumPhotos({ width: 600, height: 600 ,blur:0}),
            alt: product.title,
          },
        })
      )
    )
  );

  console.log(`✅ Created ${images.length} product images`);



// ------------------------
// 5️⃣ PRODUCT TAGS
// ------------------------


  // ------------------------
  // 7️⃣ CARTS
  // ------------------------
  const carts = await Promise.all(
    users.map((user) =>
      prisma.cart.create({
        data: {
          userId: user.id,
        },
      })
    )
  );

  console.log(`✅ Created ${carts.length} carts`);

  // ------------------------
  // 8️⃣ CART ITEMS
  // ------------------------
  // 8️⃣ CART ITEMS (batched to avoid P2024 pool exhaustion)
  {
    console.log('🌱 Seeding cart items (batched)...');

    const ITEMS_PER_CART = 4;
    const BATCH_SIZE = 500; // adjust based on pool size
    const allRows: Prisma.CartItemCreateManyInput[] = [];

    for (const cart of carts) {
      const picked = faker.helpers.arrayElements(variants, ITEMS_PER_CART);
      for (const variant of picked) {
        allRows.push({
          id: faker.string.uuid(),
          cartId: cart.id,
          variantId: variant.id,
          quantity: faker.number.int({ min: 1, max: 3 }),
          priceSnap: variant.price,
        });
      }
    }

    // Chunked createMany to keep connection usage low
    for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
      const slice = allRows.slice(i, i + BATCH_SIZE);
      await prisma.cartItem.createMany({ data: slice, skipDuplicates: true });
    }

    console.log(`✅ Created ${allRows.length} cart items (in batches)`);
  }

  // ------------------------
  // 8️⃣ WISHLIST
  // ------------------------
  await prisma.wishlist.createMany({
    data: users.map((user) => ({
      id: faker.string.uuid(), // Ensure you generate the ID here if not auto-generated
      userId: user.id,         // Use the foreign key directly
      createdAt: faker.date.past(),
    })),
    skipDuplicates: true,
  });

  const wishlists = await prisma.wishlist.findMany();

  console.log(`✅ Created ${wishlists.length} wishlists`);
  // ------------------------
  // 8️⃣ WISHLIST ITEMS
  // ------------------------
  const uniquePairs = new Set();
  const wishlistItemsData = [];

  while (wishlistItemsData.length < 10) {
    const wishlist = faker.helpers.arrayElement(wishlists);
    const product = faker.helpers.arrayElement(products);
    const key = `${wishlist.id}_${product.id}`;

    if (!uniquePairs.has(key)) {
      uniquePairs.add(key);
      wishlistItemsData.push({
        id: faker.string.uuid(),
        wishlistId: wishlist.id,
        productId: product.id,
        createdAt: faker.date.past(),
      });
    }
  }

  // Tạo 1 lần duy nhất
  await prisma.wishlistItem.createMany({
    data: wishlistItemsData,
  });

  console.log(`✅ Created ${10} wishlist items`);
// ------------------------
  // 5️⃣ VOUCHERS (Enhanced for Top Deals)
  // ------------------------
  console.log('🌱 Creating Vouchers...');

  const vouchers = await Promise.all(
    Array.from({ length: 150 }).map(async (_, index) => {
      // First 40 vouchers are "High Value" for Top Deals
      const isHighValue = index < 40;

      const type = isHighValue
        ? VoucherType.PERCENT
        : faker.helpers.arrayElement(Object.values(VoucherType));

      // 70% Shop Specific
      const shop = faker.helpers.maybe(() => faker.helpers.arrayElement(shops), { probability: 0.7 });

      const startAt = faker.date.recent({ days: 90 });
      const endAt = faker.date.future();

      let value = 0;
      let maxDiscount = null;

      if (type === 'PERCENT') {
        value = isHighValue
          ? faker.number.int({ min: 20, max: 50 }) // 20-50% off
          : faker.number.int({ min: 5, max: 15 });
        maxDiscount = faker.number.int({ min: 50_000, max: 500_000 });
      } else {
        value = faker.number.int({ min: 20_000, max: 200_000 });
      }

      return prisma.voucher.create({
        data: {
          code: (isHighValue ? 'HOT-' : 'VC-') + faker.string.alphanumeric(6).toUpperCase(),
          type,
          value,
          maxDiscount,
          minSubtotal: faker.number.int({ min: 0, max: 300_000 }),
          shopId: shop?.id,
          isActive: true,
          startAt,
          endAt,
          usageLimit: 1000,
        },
      });
    })
  );
  console.log(`✅ Created ${vouchers.length} vouchers`);

  // ------------------------
  // 6️⃣ VOUCHER LINKING (Guaranteed Top Deals)
  // ------------------------
  const voucherProductsData: Prisma.VoucherProductCreateManyInput[] = [];
  const usedLinks = new Set<string>();

  // STRATEGY: Link High Value Vouchers to Best Sellers
  const popularProducts = [...products].sort((a, b) => b.soldCount - a.soldCount).slice(0, 50);
  const highValueVouchers = vouchers.filter(v => v.type === 'PERCENT' && Number(v.value) >= 20);

  for (const product of popularProducts) {
    // Find a compatible voucher (Global or Same Shop)
    const voucher = highValueVouchers.find(v => v.shopId === null || v.shopId === product.shopId);

    if (voucher) {
      const key = `${voucher.id}-${product.id}`;
      if (!usedLinks.has(key)) {
        usedLinks.add(key);
        voucherProductsData.push({ voucherId: voucher.id, productId: product.id });
      }
    }
  }

  // Random Links for others
  for (const voucher of vouchers) {
    const randomProds = faker.helpers.arrayElements(products, 3);
    for (const p of randomProds) {
      if (voucher.shopId && voucher.shopId !== p.shopId) continue; // Skip mismatch
      const key = `${voucher.id}-${p.id}`;
      if (!usedLinks.has(key)) {
        usedLinks.add(key);
        voucherProductsData.push({ voucherId: voucher.id, productId: p.id });
      }
    }
  }

  await prisma.voucherProduct.createMany({ data: voucherProductsData, skipDuplicates: true });
  console.log(`✅ Linked vouchers to products (including Top Deals)`);

  // ------------------------
  // 7️⃣ ORDERS (Math-Aware)
  // ------------------------
  console.log('🌱 Seeding Orders with valid math...');

  const orders = await Promise.all(
    Array.from({ length: 100 }).map(async (_, i) => {
      const user = faker.helpers.arrayElement(users);
      const shop = faker.helpers.arrayElement(shops);

      const placedAt = faker.date.recent({ days: 120 });

      // 1. Pick Items from THIS SHOP
      const shopVariants = products
        .filter((p) => p.shopId === shop.id)
        .flatMap((p) => p.variants);
      if (shopVariants.length === 0) return null; // Skip if shop has no items

      const selectedVariants = faker.helpers.arrayElements(shopVariants, faker.number.int({ min: 1, max: 3 }));

      const itemsData = selectedVariants.map(v => {
        const quantity = faker.number.int({ min: 1, max: 3 });
        const total = Number(v.price) * quantity;
        return {
          productId: v.productId,
          variantId: v.id,
          unitPrice: Number(v.price),
          quantity,
          total,
          title: v.name || 'Product',
        };
      });

      const itemsTotal = itemsData.reduce((acc, i) => acc + i.total, 0);
      const shippingFee = 30000;

      // 2. Validate Vouchers
      const eligibleVoucher = vouchers.find(v =>
        (v.shopId === null || v.shopId === shop.id) &&
        itemsTotal >= Number(v.minSubtotal || 0) &&
        placedAt >= v.startAt && placedAt <= v.endAt
      );

      // 3. Calc Discount
      let discountTotal = 0;
      let orderVoucherData = undefined;
      let voucherRedemptionData = undefined;

      if (eligibleVoucher) {
        if (eligibleVoucher.type === 'PERCENT') {
          const raw = itemsTotal * (Number(eligibleVoucher.value) / 100);
          const max = Number(eligibleVoucher.maxDiscount);
          discountTotal = max ? Math.min(raw, max) : raw;
        } else if (eligibleVoucher.type === 'FIXED') {
          discountTotal = Number(eligibleVoucher.value);
        } else {
          discountTotal = Math.min(shippingFee, Number(eligibleVoucher.value));
        }

        // Cap discount
        if (discountTotal > itemsTotal + shippingFee) discountTotal = itemsTotal + shippingFee;

        orderVoucherData = { create: { voucherId: eligibleVoucher.id } };
        voucherRedemptionData = {
          create: {
            voucherId: eligibleVoucher.id,
            userId: user.id,
            usedAt: placedAt
          }
        };
      }

      const grandTotal = itemsTotal + shippingFee - discountTotal;

      // 4. Create Order
      const order = await prisma.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}-${i}`,
          userId: user.id,
          shopId: shop.id,
          status: OrderStatus.DELIVERED,
          paymentStatus: PaymentStatus.PAID,
          fulfillmentStatus: FulfillmentStatus.FULFILLED,
          currency: Currency.VND,
          itemsTotal,
          shippingFee,
          discountTotal,
          grandTotal,
          placedAt,
          updatedAt: placedAt,

          shippingAddress: { name: user.name, address: '123 Fake St' }, // Simplified

          items: {
            create: itemsData.map(item => ({
              productId: item.productId,
              variantId: item.variantId,
              title: item.title,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              total: item.total
            }))
          },
          vouchers: orderVoucherData,
          VoucherRedemption: voucherRedemptionData ? {
            // We have to link it to order, but nested write in Order for VoucherRedemption
            // requires 'order' to exist.
            // Easier to create separately or use `connect` if structured differently.
            // For this schema, simple way is creating redemption AFTER order if `create` fails here.
            // But actually, Prisma allows this reverse relation creation:
            create: [{
              voucherId: eligibleVoucher!.id,
              userId: user.id,
              usedAt: placedAt
            }]
          } : undefined
        }
      });

      // Payment Record
      await prisma.payment.create({
        data: {
          amount: grandTotal,
          status: PaymentStatus.PAID,
          provider: PaymentProvider.STRIPE,
          orders: { create: { orderId: order.id } }
        }
      });

      return order;
    })
  );
  console.log(`✅ Created orders`);


// ------------------------
  // 8️⃣ REVIEWS (Verified Purchases)
  // ------------------------
  console.log('🌱 Seeding Reviews (Verified Purchases)...');

  // 1. Fetch OrderItems to turn into reviews
  // We only review items from orders that are not PENDING/CANCELED in this logic
  const validOrderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        status: { in: [OrderStatus.DELIVERED, OrderStatus.SHIPPED, OrderStatus.FULFILLED] }
      }
    },
    include: { order: true }, // We need the userId from the order
    take: 1500 // Limit to 500 reviews
  });

  const reviewData = validOrderItems.map((item) => {
    const rating = faker.number.int({ min: 3, max: 5 }); // Skew towards positive
    const images=faker.image.urlPicsumPhotos({ width: 200, height: 200 });
    return {
      id: faker.string.uuid(),
      productId: item.productId,
      userId: item.order!.userId, // The buyer
      orderItemId: item.id, // Verified purchase link
      rating,
      images,
      title: rating >= 4 ? faker.word.adjective() + ' product!' : 'Just okay',
      body: faker.lorem.sentences({ min: 1, max: 3 }),
      likes: faker.number.int({ min: 0, max: 50 }),
      createdAt: faker.date.between({ from: item.order!.placedAt, to: new Date() }),
    };
  });

  // Bulk create reviews
  await prisma.review.createMany({
    data: reviewData,
    skipDuplicates: true,
  });

  console.log(`✅ Created ${reviewData.length} reviews`);

  // 2. Update Product Ratings Aggregates
  console.log('🧮 Aggregating Product Ratings...');
  const ratingStats = await prisma.review.groupBy({
    by: ['productId'],
    _avg: { rating: true },
    _count: { rating: true },
  });

  for (const stat of ratingStats) {
    await prisma.product.update({
      where: { id: stat.productId },
      data: {
        ratingAvg: stat._avg.rating || 0,
        ratingCount: stat._count.rating,
      },
    });
  }
  console.log(`✅ Updated ratings for ${ratingStats.length} products`);

  // ------------------------
  // 9️⃣ PRODUCT QUESTIONS
  // ------------------------
  // (Optional: Simple random questions)
  const productQuestionsData = await Promise.all(
    Array.from({ length: 30 }).map(async () => {
      const p = faker.helpers.arrayElement(products);
      const u = faker.helpers.arrayElement(users);
      return {
        productId: p.id,
        userId: u.id,
        body: faker.lorem.sentence() + '?',
        answer: faker.datatype.boolean() ? faker.lorem.sentence() : null,
        createdAt: faker.date.recent(),
      };
    })
  );

  await prisma.productQuestion.createMany({ data: productQuestionsData });
  console.log(`✅ Created product questions`);

  // ------------------------
  // 🔟 CONVERSATIONS
  // ------------------------
  console.log('💬 Seeding Conversations...');

  // SCENARIO A: Order Inquiries (User asks Shop about an Order)
  const recentOrders = await prisma.order.findMany({
    take: 20,
    where: { shopId: { not: null } },
    include: { shop: true, user: true }
  });

  for (const order of recentOrders) {
    if (!order.shopId) continue;

    // 1. Create Conversation
    const conv = await prisma.conversation.create({
      data: {
        type: ConversationType.ORDER_INQUIRY,
        status: ConversationStatus.OPEN,
        subject: `Inquiry: Order #${order.orderNumber}`,
        shopId: order.shopId,
        createdAt: faker.date.recent(),
      }
    });

    // 2. Add Participants
    await prisma.conversationParticipant.createMany({
      data: [
        // The Buyer
        {
          conversationId: conv.id,
          userId: order.userId,
          shopId: null,
          joinedAt: conv.createdAt,
        },
        // The Shop (Seller) - Note: Shop participates as an entity
        {
          conversationId: conv.id,
          userId: null,
          shopId: order.shopId,
          joinedAt: conv.createdAt,
        }
      ]
    });

    // 3. Add Messages
    // Message 1: User sends Order Card
    await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderRole: MessageRole.USER,
        senderUserId: order.userId,
        type: MessageType.ORDER_CARD,
        content: `Order #${order.orderNumber}`,
        relatedOrderId: order.id,
        createdAt: conv.createdAt,
      }
    });

    // Message 2: User asks question
    await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderRole: MessageRole.USER,
        senderUserId: order.userId,
        type: MessageType.TEXT,
        content: "Hi, when will this order be shipped?",
        createdAt: new Date(conv.createdAt.getTime() + 1000), // 1 sec later
      }
    });

    // Message 3: Shop replies
    await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderRole: MessageRole.SHOP,
        senderShopId: order.shopId,
        type: MessageType.TEXT,
        content: "Hello! We are packing it right now. It goes out tomorrow.",
        createdAt: new Date(conv.createdAt.getTime() + 1000 * 60 * 60), // 1 hour later
      }
    });
  }

  // SCENARIO B: Product Inquiries (User asks Shop about a Product)
  // Create 10 random product chats
  for (let i = 0; i < 10; i++) {
    const product = faker.helpers.arrayElement(products);
    const user = faker.helpers.arrayElement(users);

    // 1. Create Conversation
    const conv = await prisma.conversation.create({
      data: {
        type: ConversationType.GENERAL,
        status: ConversationStatus.OPEN,
        subject: `Question about ${product.title.substring(0, 20)}...`,
        shopId: product.shopId,
        createdAt: faker.date.recent(),
      }
    });

    // 2. Add Participants
    await prisma.conversationParticipant.createMany({
      data: [
        { conversationId: conv.id, userId: user.id },
        { conversationId: conv.id, shopId: product.shopId }
      ]
    });

    // 3. Messages
    // User sends product card
    await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderRole: MessageRole.USER,
        senderUserId: user.id,
        type: MessageType.PRODUCT_CARD,
        content: product.title,
        relatedProductId: product.id,
        createdAt: conv.createdAt,
      }
    });

    // User asks question
    await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderRole: MessageRole.USER,
        senderUserId: user.id,
        content: "Do you have this in size XL?",
        createdAt: new Date(conv.createdAt.getTime() + 5000),
      }
    });
  }

  console.log(`✅ Created Conversations`);
  console.log('🎉 SEED COMPLETE!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });