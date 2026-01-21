import { NextRequest, NextResponse } from 'next/server';
import { redisClient } from '@/lib/redis';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (!res.ok) throw new Error(`Fetch failed: ${res.statusText}`);

    const data = await res.json();
    const rate = data.rates.VND;

    if (!rate) throw new Error('Not found rate VND in api');

    await redisClient.setex('currency-rate', 604800, rate.toString());

    console.log(`Đã cập nhật tỉ giá: ${rate}`);

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
