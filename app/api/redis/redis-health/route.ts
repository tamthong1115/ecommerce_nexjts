import { NextResponse } from 'next/server';
import { redisClient } from '@/lib/redis';
import { withAdmin } from '@/lib/with-auth';

export const GET = withAdmin(async () => {
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
});
