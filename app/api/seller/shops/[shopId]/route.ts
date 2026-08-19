import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireSeller } from '@/lib/require-admin';
import { ShopStatus } from '@/lib/generated/prisma';

const updateShopSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format')
    .optional(),
  description: z.string().nullable().optional(),
  logoUrl: z.url().nullable().optional(),
  logoPublicId: z.string().nullable().optional(),
  coverUrl: z.url().nullable().optional(),
  coverPublicId: z.string().nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  status: z.enum(ShopStatus).optional(),
});

export async function GET(
  req: Request,
  props: { params: Promise<{ shopId: string }> }
) {
  const params = await props.params;
  try {
    const session = await requireSeller();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const shop = await prisma.shop.findUnique({
      where: {
        id: params.shopId,
        ownerId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        logoPublicId: true,
        coverUrl: true,
        coverPublicId: true,
        status: true,
        contactEmail: true,
        contactPhone: true,
        ratingAvg: true,
        ratingCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const normalized = {
      ...shop,
      ratingAvg: Number(shop.ratingAvg),
    };

    return NextResponse.json(normalized, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ shopId: string }> }
) {
  const params = await props.params;
  try {
    const session = await requireSeller();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parse = updateShopSchema.safeParse(body);

    if (!parse.success) {
      return NextResponse.json(
        { error: parse.error.flatten() },
        { status: 400 }
      );
    }

    const payload = parse.data;

    const existing = await prisma.shop.findUnique({
      where: { id: params.shopId },
      select: { ownerId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    if (existing.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (payload.slug) {
      const slugTaken = await prisma.shop.findFirst({
        where: {
          slug: payload.slug,
          id: { not: params.shopId },
        },
      });

      if (slugTaken) {
        return NextResponse.json(
          { error: 'Slug already taken' },
          { status: 409 }
        );
      }
    }

    const shop = await prisma.shop.update({
      where: { id: params.shopId },
      data: payload,
    });

    return NextResponse.json({ shop }, { status: 200 });
  } catch (err: any) {
    console.error('update shop error', err);
    if (err?.code === 'P2002' && err?.meta?.target?.includes('slug')) {
      return NextResponse.json(
        { error: 'Slug already taken' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: err?.message ?? 'Server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ shopId: string }> }
) {
  const params = await props.params;
  try {
    const session = await requireSeller();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const existing = await prisma.shop.findUnique({
      where: { id: params.shopId },
      select: { ownerId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    if (existing.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.shop.update({
      where: { id: params.shopId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Server error' },
      { status: 500 }
    );
  }
}
