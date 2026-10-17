import 'dotenv/config';
import { prisma } from '../../lib/db';

const categoryTree = [
  {
    name: 'Electronics',
    slug: 'electronics',
    position: 0,
    children: [
      { name: 'Smartphones & Accessories', slug: 'smartphones-accessories', position: 0 },
      { name: 'Computers & Laptops', slug: 'computers-laptops', position: 1 },
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
      { name: 'Jewellery & Watches', slug: 'jewellery-watches', position: 4 },
    ],
  },
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
      { name: 'Wellness & Self-care', slug: 'wellness-selfcare', position: 4 },
    ],
  },
  {
    name: 'Food & Beverages',
    slug: 'food-beverages',
    position: 4,
    children: [
      { name: 'Groceries & Daily Needs', slug: 'groceries-daily-needs', position: 0 },
      { name: 'Snacks & Sweets', slug: 'snacks-sweets', position: 1 },
      { name: 'Drinks & Beverages', slug: 'drinks-beverages', position: 2 },
      { name: 'Organic & Health Foods', slug: 'organic-health-foods', position: 3 },
      { name: 'Gourmet & Gifts', slug: 'gourmet-gifts', position: 4 },
    ],
  },
  {
    name: 'Sports & Outdoors',
    slug: 'sports-outdoors',
    position: 5,
    children: [
      { name: 'Fitness Equipment', slug: 'fitness-equipment', position: 0 },
      { name: 'Outdoor Recreation', slug: 'outdoor-recreation', position: 1 },
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
      { name: 'Personal Care Devices', slug: 'personal-care-devices', position: 0 },
      { name: 'Fitness Trackers', slug: 'fitness-trackers', position: 1 },
      { name: 'Sleep & Relaxation', slug: 'sleep-relaxation', position: 2 },
      { name: 'Healthy Living Products', slug: 'healthy-living-products', position: 3 },
      { name: 'Vitamins & Supplements', slug: 'vitamins-supplements', position: 4 },
    ],
  },
  {
    name: 'Baby, Kids & Toys',
    slug: 'baby-kids-toys',
    position: 7,
    children: [
      { name: 'Baby Gear & Essentials', slug: 'baby-gear-essentials', position: 0 },
      { name: 'Toys & Games', slug: 'toys-games', position: 1 },
      { name: 'Kids Clothing & Shoes', slug: 'kids-clothing-shoes', position: 2 },
      { name: 'Educational & STEM Toys', slug: 'educational-stem-toys', position: 3 },
      { name: 'Kids Furniture & Decor', slug: 'kids-furniture-decor', position: 4 },
    ],
  },
  {
    name: 'Books, Movies & Games',
    slug: 'books-movies-games',
    position: 8,
    children: [
      { name: 'Books & eBooks', slug: 'books-ebooks', position: 0 },
      { name: 'Movies & TV Series', slug: 'movies-tv-series', position: 1 },
      { name: 'Video Games & Consoles', slug: 'video-games-consoles', position: 2 },
      { name: 'Board Games & Puzzles', slug: 'board-games-puzzles', position: 3 },
      { name: 'Music & Instruments', slug: 'music-instruments', position: 4 },
    ],
  },
  {
    name: 'Pet Supplies',
    slug: 'pet-supplies',
    position: 9,
    children: [
      { name: 'Dog Supplies', slug: 'dog-supplies', position: 0 },
      { name: 'Cat Supplies', slug: 'cat-supplies', position: 1 },
      { name: 'Fish & Aquatic Pets', slug: 'fish-aquatic-pets', position: 2 },
      { name: 'Bird Supplies', slug: 'bird-supplies', position: 3 },
      { name: 'Small Pet Care', slug: 'small-pet-care', position: 4 },
    ],
  },
  {
    name: 'Bags, Luggage & Accessories',
    slug: 'bags-luggage-accessories',
    position: 10,
    children: [
      { name: 'Backpacks', slug: 'backpacks', position: 0 },
      { name: 'Suitcases & Travel Bags', slug: 'suitcases-travel-bags', position: 1 },
      { name: 'Handbags & Wallets', slug: 'handbags-wallets', position: 2 },
      { name: 'Travel Accessories', slug: 'travel-accessories', position: 3 },
      { name: 'Briefcases & Laptop Bags', slug: 'briefcases-laptop-bags', position: 4 },
    ],
  },
  {
    name: 'Automotive & Industrial',
    slug: 'automotive-industrial',
    position: 11,
    children: [
      { name: 'Car Accessories', slug: 'car-accessories', position: 0 },
      { name: 'Motorcycle Gear', slug: 'motorcycle-gear', position: 1 },
      { name: 'Oils & Fluids', slug: 'oils-fluids', position: 2 },
      { name: 'Tools & Equipment', slug: 'tools-equipment', position: 3 },
      { name: 'Industrial Supplies', slug: 'industrial-supplies', position: 4 },
    ],
  },
  {
    name: 'Office Supplies & Stationery',
    slug: 'office-supplies-stationery',
    position: 12,
    children: [
      { name: 'Writing Instruments', slug: 'writing-instruments', position: 0 },
      { name: 'Notebooks & Paper', slug: 'notebooks-paper', position: 1 },
      { name: 'Desk Organization', slug: 'desk-organization', position: 2 },
      { name: 'Office Electronics', slug: 'office-electronics', position: 3 },
      { name: 'Packaging & Shipping', slug: 'packaging-shipping', position: 4 },
    ],
  },
  {
    name: 'DIY, Tools & Hardware',
    slug: 'diy-tools-hardware',
    position: 13,
    children: [
      { name: 'Power Tools', slug: 'power-tools', position: 0 },
      { name: 'Hand Tools', slug: 'hand-tools', position: 1 },
      { name: 'Fasteners & Hardware', slug: 'fasteners-hardware', position: 2 },
      { name: 'Painting & Decorating', slug: 'painting-decorating', position: 3 },
      { name: 'Electrical & Plumbing', slug: 'electrical-plumbing', position: 4 },
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
      { name: 'Personalized Gifts', slug: 'personalized-gifts', position: 3 },
      { name: 'Greeting Cards', slug: 'greeting-cards', position: 4 },
    ],
  },
];

async function seedCategories() {
  console.log('Seeding categories...');
  for (const topCat of categoryTree) {
    const parent = await prisma.category.upsert({
      where: { slug: topCat.slug },
      update: { name: topCat.name, position: topCat.position, isActive: true },
      create: {
        name: topCat.name,
        slug: topCat.slug,
        position: topCat.position,
        isActive: true,
      },
    });

    for (const sub of topCat.children) {
      await prisma.category.upsert({
        where: { slug: sub.slug },
        update: {
          name: sub.name,
          position: sub.position,
          parentId: parent.id,
          isActive: true,
        },
        create: {
          parentId: parent.id,
          name: sub.name,
          slug: sub.slug,
          position: sub.position,
          isActive: true,
        },
      });
    }
  }
  console.log('Categories seeded successfully.');
}

seedCategories()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
