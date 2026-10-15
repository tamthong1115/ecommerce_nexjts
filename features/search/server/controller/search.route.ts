import {
  analyzeImageService,
  getSuggestionsService,
  searchProductsService,
} from '@/features/search/services/search.service';
import { NextRequest, NextResponse } from 'next/server';

export async function analyzeImage(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File;
    if (!file) return NextResponse.json({ error: 'No image' }, { status: 400 });
    const query = await analyzeImageService(file);
    return NextResponse.json({ query });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function suggestions(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  const result = await getSuggestionsService(q);
  return NextResponse.json(result);
}

export async function search(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  const result = await searchProductsService({ q });
  return NextResponse.json(result);
}
