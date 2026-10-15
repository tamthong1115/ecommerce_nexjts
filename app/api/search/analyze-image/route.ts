import { NextRequest, NextResponse } from 'next/server';
import { analyzeImageService } from '@/features/search/services/search.service';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const searchQuery = await analyzeImageService(file);

    return NextResponse.json({ query: searchQuery });
  } catch (error) {
    console.error('Image Analysis Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
}
