/**
 * Seed script for recommendation system training data.
 *
 * Generates:
 *  - ProductDailyStat  (~18 000 rows — every product × 90 days)
 *  - UserInteractionLog (~50 000–100 000 rows with category-preference profiles)
 *
 * Prerequisites: run the main seed.ts first so Users and Products exist.
 * Usage:        npx tsx prisma/seed-recommendation.ts
 */

import { faker } from '@faker-js/faker';
import pg from 'pg';
import 'dotenv/config';
import { prisma } from '@/lib/db';


// ── Prisma bootstrap (same pattern as seed.ts) ──────────────────────────
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// ── Configuration ───────────────────────────────────────────────────────
const DAYS_BACK = 30;
const BATCH_SIZE = 300;
const INTERACTIONS_PER_USER_MIN = 100;
const INTERACTIONS_PER_USER_MAX = 500;
const ANONYMOUS_RATIO = 0.15; // 15% of interaction logs are anonymous

// Interaction types and corresponding implicit-feedback weights
const INTERACTION_TYPES = [
  { type: 'view', weight: 1.0, probability: 0.55 },
  { type: 'cart', weight: 3.0, probability: 0.15 },
  { type: 'purchase', weight: 5.0, probability: 0.10 },
  { type: 'wishlist', weight: 2.0, probability: 0.12 },
  { type: 'review', weight: 4.0, probability: 0.08 },
] as const;

// ── Helpers ─────────────────────────────────────────────────────────────

/** Returns a Date object for `daysAgo` days before today (date-only, no time). */
function dateNDaysAgo(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Pick an interaction type using the weighted probabilities. */
function pickInteractionType() {
  const roll = Math.random();
  let cumulative = 0;
  for (const it of INTERACTION_TYPES) {
    cumulative += it.probability;
    if (roll <= cumulative) return it;
  }
  return INTERACTION_TYPES[0]; // fallback: view
}

/** Day-of-week multiplier (weekend boost). */
function dayOfWeekMultiplier(date: Date): number {
  const dow = date.getDay();
  return dow === 0 || dow === 6 ? 1.3 : 1.0;
}

// ── Main ────────────────────────────────────────────────────────────────
async function main() {
  console.log('📊 Recommendation Seed — starting...');

  // 1. Fetch existing data ------------------------------------------------
  const products = await prisma.product.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true, categoryId: true, minPrice: true },
  });

  const users = await prisma.user.findMany({
    select: { id: true },
  });

  if (products.length === 0) {
    console.error('❌ No PUBLISHED products found. Run seed.ts first.');
    process.exit(1);
  }
  if (users.length === 0) {
    console.error('❌ No users found. Run seed.ts first.');
    process.exit(1);
  }

  console.log(`  Found ${products.length} published products, ${users.length} users`);

  // Collect all unique category IDs from products
  const categoryIds = [...new Set(products.map((p) => p.categoryId).filter(Boolean))] as string[];

  // 2. Clear old recommendation data -------------------------------------
  console.log('🧹 Clearing existing ProductDailyStat & UserInteractionLog...');
  await prisma.userInteractionLog.deleteMany();
  await prisma.productDailyStat.deleteMany();

  // 3. Assign popularity tiers to products --------------------------------
  //    20% popular (3×), 60% normal (1×), 20% cold (0.3×)
  const popularityMap = new Map<string, number>();
  const shuffled = faker.helpers.shuffle([...products]);
  const popCut = Math.floor(shuffled.length * 0.2);
  const coldCut = Math.floor(shuffled.length * 0.8);

  shuffled.forEach((p, idx) => {
    if (idx < popCut) popularityMap.set(p.id, 3.0);
    else if (idx >= coldCut) popularityMap.set(p.id, 0.3);
    else popularityMap.set(p.id, 1.0);
  });

  // 4. Seed ProductDailyStat ─────────────────────────────────────────────
  console.log('📈 Seeding ProductDailyStat...');
  let statRows: {
    id: string;
    productId: string;
    date: Date;
    views: number;
    carts: number;
    sales: number;
    revenue: number;
  }[] = [];

  let statRowCount = 0;

  for (let day = 0; day < DAYS_BACK; day++) {
    const date = dateNDaysAgo(day);
    const dowMul = dayOfWeekMultiplier(date);

    for (const product of products) {
      const popMul = popularityMap.get(product.id) ?? 1.0;
      const baseMul = popMul * dowMul;

      // Random noise factor per product-day (0.6 – 1.4)
      const noise = 0.6 + Math.random() * 0.8;
      const effectiveMul = baseMul * noise;

      const views = Math.max(1, Math.round(faker.number.int({ min: 10, max: 500 }) * effectiveMul));
      const carts = Math.round(views * faker.number.float({ min: 0.02, max: 0.15 }));
      const sales = Math.round(carts * faker.number.float({ min: 0.1, max: 0.5 }));
      const revenue = sales * Number(product.minPrice);

      statRows.push({
        id: faker.string.uuid(),
        productId: product.id,
        date,
        views,
        carts,
        sales,
        revenue,
      });

      // Flush in batches
      if (statRows.length >= BATCH_SIZE) {
        await prisma.productDailyStat.createMany({ data: statRows });
        statRowCount += statRows.length;
        statRows = [];
      }
    }
  }

  // Flush remaining
  if (statRows.length > 0) {
    await prisma.productDailyStat.createMany({ data: statRows });
    statRowCount += statRows.length;
  }
  console.log(`  ✅ Created ${statRowCount} ProductDailyStat rows`);

  // 5. Build user preference profiles ────────────────────────────────────
  //    Each user prefers 2-4 categories
  const userPreferences = new Map<string, Set<string>>();
  for (const user of users) {
    const numPrefs = faker.number.int({ min: 2, max: 4 });
    const prefs = faker.helpers.arrayElements(categoryIds, numPrefs);
    userPreferences.set(user.id, new Set(prefs));
  }

  // Group products by category for fast lookups
  const productsByCategory = new Map<string, typeof products>();
  for (const p of products) {
    const catId = p.categoryId ?? '__none__';
    if (!productsByCategory.has(catId)) productsByCategory.set(catId, []);
    productsByCategory.get(catId)!.push(p);
  }

  // 6. Seed UserInteractionLog ───────────────────────────────────────────
  console.log('🔄 Seeding UserInteractionLog...');
  let logRows: {
    id: string;
    userId: string | null;
    sessionId: string | null;
    productId: string;
    interactionType: string;
    weight: number;
    createdAt: Date;
  }[] = [];
  let logRowCount = 0;

  for (const user of users) {
    const interactionCount = faker.number.int({
      min: INTERACTIONS_PER_USER_MIN,
      max: INTERACTIONS_PER_USER_MAX,
    });
    const preferredCats = userPreferences.get(user.id)!;

    for (let i = 0; i < interactionCount; i++) {
      // Decide if this interaction is anonymous (15%)
      const isAnonymous = Math.random() < ANONYMOUS_RATIO;

      // Pick a product — 3× more likely from preferred categories
      let product: (typeof products)[0];
      const preferFromFavorite = Math.random() < 0.75; // 75% chance to pick from preferred

      if (preferFromFavorite && preferredCats.size > 0) {
        const chosenCat = faker.helpers.arrayElement([...preferredCats]);
        const catProducts = productsByCategory.get(chosenCat);
        if (catProducts && catProducts.length > 0) {
          product = faker.helpers.arrayElement(catProducts);
        } else {
          product = faker.helpers.arrayElement(products);
        }
      } else {
        product = faker.helpers.arrayElement(products);
      }

      // Pick interaction type
      const interaction = pickInteractionType();

      // Generate a timestamp within the past 90 days, with realistic hour dist
      const daysAgo = faker.number.int({ min: 0, max: DAYS_BACK - 1 });
      const createdAt = dateNDaysAgo(daysAgo);
      // Realistic hours: most activity between 10–22
      const hour =
        Math.random() < 0.85
          ? faker.number.int({ min: 10, max: 22 })
          : faker.number.int({ min: 0, max: 9 });
      createdAt.setHours(hour, faker.number.int({ min: 0, max: 59 }), faker.number.int({ min: 0, max: 59 }));

      logRows.push({
        id: faker.string.uuid(),
        userId: isAnonymous ? null : user.id,
        sessionId: isAnonymous ? faker.string.uuid() : null,
        productId: product.id,
        interactionType: interaction.type,
        weight: interaction.weight,
        createdAt,
      });

      // Flush in batches
      if (logRows.length >= BATCH_SIZE) {
        await prisma.userInteractionLog.createMany({ data: logRows });
        logRowCount += logRows.length;
        logRows = [];

        if (logRowCount % 5000 === 0) {
          console.log(`    ... ${logRowCount} interaction logs created`);
        }
      }
    }
  }

  // Flush remaining
  if (logRows.length > 0) {
    await prisma.userInteractionLog.createMany({ data: logRows });
    logRowCount += logRows.length;
  }

  console.log(`  ✅ Created ${logRowCount} UserInteractionLog rows`);
  console.log('🎉 Recommendation seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
