import { NextResponse } from 'next/server';
import { redisClient } from '@/lib/redis';

export async function GET() {
  try {
    const pong = await redisClient.ping();

    if (pong === 'PONG') {
      return NextResponse.json(
        { status: 'ok', message: 'Kết nối đến Redis thành công!' },
        { status: 200 }
      );
    } else {
      throw new Error('Phản hồi không mong đợi từ Redis.');
    }
  } catch (error) {
    console.error('Lỗi khi kiểm tra kết nối Redis:', error);
    return NextResponse.json(
      { status: 'error', message: 'Kết nối đến Redis thất bại.' },
      { status: 500 }
    );
  }
}
