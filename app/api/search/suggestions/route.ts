import { NextRequest, NextResponse } from 'next/server';
import { getSuggestionsService } from '@/features/search/services/search.service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const suggestions = await getSuggestionsService(q);
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Suggestion Error', error);
    return NextResponse.json([], { status: 500 });
  }
}
