import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api-response';
import redisClient from '@/lib/redis';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const intentId = searchParams.get('intent_id')?.trim();

  if (!intentId) {
    return ResponseFactory.toNextResponse(
      ResponseFactory.error({ message: 'Missing intent_id', code: 400 })
    );
  }

  const redisKey = `payment_url:${intentId}`;
  console.log(redisKey);
  const result = await redisClient.get(redisKey);
  console.log(result);

  if (!result) {
    return ResponseFactory.toNextResponse(
      ResponseFactory.error({
        message: 'Checkout session not found',
        code: 400,
      })
    );
  }

  return ResponseFactory.toNextResponse(
    ResponseFactory.success({ data: { url: result }, code: 200 })
  );
}
