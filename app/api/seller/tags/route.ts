import { NextRequest, NextResponse } from 'next/server';
import { requireSeller } from '@/lib/require-admin';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const sellerSession = await requireSeller();
  if (!sellerSession) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const q = req.nextUrl.searchParams.get('q') ?? '';
  try {
    const tags = await prisma.tag.findMany({
      where: q ? { name: { contains: q, mode: 'insensitive' } } : {},
      take: 50,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    });

    console.log(`tags: ${JSON.stringify(tags, null, 2)}`);

    return NextResponse.json({ success: true, data: tags });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
