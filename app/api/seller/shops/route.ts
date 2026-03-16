import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { requireSeller } from '@/lib/require-role';
import { ShopMemberRole } from '@/lib/generated/prisma';
import { ResponseFactory } from '@/lib/api-response';
import { HttpStatus } from '@/types/api';

const createShopSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  description: z.string().nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  logoPublicId: z.string().nullable().optional(),
  coverUrl: z.string().url().nullable().optional(),
  coverPublicId: z.string().nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
});

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/\-+/g, '-');
}

export async function GET() {
  try {
    const session = await requireSeller();
    if (!session?.user?.id) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 'Unauthenticated',
          code: HttpStatus.UNAUTHORIZED,
        })
      );
    }
    const sellerId = session.user.id;

    const shops = await prisma.shop.findMany({
      where: {
        OR: [
          { ownerId: sellerId },
          { members: { some: { userId: sellerId } } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        coverUrl: true,
        status: true,
        contactEmail: true,
        contactPhone: true,
        ratingAvg: true,
        ratingCount: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const normalized = shops.map((s) => ({
      ...s,
      ratingAvg: Number(s.ratingAvg),
    }));

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({ data: normalized })
    );
  } catch (err: any) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(err));
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    if (!body.slug && body.name) {
      body.slug = slugify(body.name);
    }

    const parse = createShopSchema.safeParse(body);
    if (!parse.success) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 'Validation failed',
          code: HttpStatus.BAD_REQUEST,
          errors: parse.error.flatten().fieldErrors,
        })
      );
    }
    const payload = parse.data;

    const session = await getSessionUser();
    if (!session?.user?.id) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 'Unauthenticated',
          code: HttpStatus.UNAUTHORIZED,
        })
      );
    }
    const ownerId = session.user.id;

    const existing = await prisma.shop.findUnique({
      where: { slug: payload.slug },
    });
    if (existing) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 'Slug already taken',
          code: HttpStatus.CONFLICT,
        })
      );
    }

    // Use transaction to ensure both shop and member are created or neither
    const shop = await prisma.$transaction(async (tx) => {
      const newShop = await tx.shop.create({
        data: {
          ownerId,
          name: payload.name,
          slug: payload.slug,
          description: payload.description ?? null,
          logoUrl: payload.logoUrl ?? null,
          logoPublicId: payload.logoPublicId ?? null,
          coverUrl: payload.coverUrl ?? null,
          coverPublicId: payload.coverPublicId ?? null,
          contactEmail: payload.contactEmail ?? null,
          contactPhone: payload.contactPhone ?? null,
          status: 'PENDING',
        },
      });

      await tx.shopMember.create({
        data: {
          shopId: newShop.id,
          userId: ownerId,
          role: ShopMemberRole.OWNER,
        },
      });

      return newShop;
    });

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({
        data: shop,
        message: `Shop ${shop.name} created successfully`,
        code: HttpStatus.CREATED,
      })
    );
  } catch (err: any) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(err));
  }
}
