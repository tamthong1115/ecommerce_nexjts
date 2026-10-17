import { NextRequest, NextResponse } from 'next/server';
import { deleteFromCloudinary } from '@/lib/cloudinary';
import { withAuth } from '@/lib/with-auth';

export const DELETE = withAuth(async (_userId: string, request: NextRequest) => {
  try {
    const { publicId } = await request.json();

    if (!publicId) {
      return NextResponse.json({ error: 'Missing publicId' }, { status: 400 });
    }

    await deleteFromCloudinary(publicId, {
      invalidate: true,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete image error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
});
