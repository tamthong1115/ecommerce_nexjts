import { NextRequest, NextResponse } from 'next/server';
import { syncCurrencyRate } from '@/lib/sync-currency-rate';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rate = await syncCurrencyRate();
    return NextResponse.json({ success: true, rate }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
