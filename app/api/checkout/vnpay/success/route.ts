import { NextRequest, NextResponse } from 'next/server';
import { sortObject } from '@/app/api/checkout/vnpay/route';
import qs from 'qs';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  let vnp_Params: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    vnp_Params[key] = value;
  }

  const secureHash = vnp_Params['vnp_SecureHash'];
  const rspCode = vnp_Params['vnp_ResponseCode'];
  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  vnp_Params = sortObject(vnp_Params);
  const secretKey = process.env.VNPAY_SECRET_KEY!;

  const signData = qs.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac('sha512', secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  const isSuccess = secureHash === signed && rspCode === '00';

  if (isSuccess) {
    return NextResponse.redirect(`${process.env.VNPAY_RETURN_URL}`);
  } else {
    return NextResponse.redirect(`${process.env.BETTER_AUTH_URL}/cancel`);
  }
}
