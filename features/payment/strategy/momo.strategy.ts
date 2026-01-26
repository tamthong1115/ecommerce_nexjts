import { IPaymentStrategy } from '@/features/payment/strategy/payment.interface';
import { MomoPaymentParams } from '@/features/payment/payment.dto';
import { v4 } from 'uuid';
import crypto from 'crypto';
import 'dotenv/config';

export class MomoStrategy implements IPaymentStrategy<MomoPaymentParams> {
  async createPaymentUrl(params: MomoPaymentParams) {
    const { amount, draftId, origin, orderIds } = params;

    //MOMO Infor
    const partnerCode = process.env.MOMO_PARTNER_CODE!;
    const accessKey = process.env.MOMO_ACCESS_KEY!;
    const secretKey = process.env.MOMO_SECRET_KEY!;
    const apiEndpoint = process.env.MOMO_API_END_POINT!;

    if (!partnerCode || !accessKey || !secretKey || !apiEndpoint) {
      throw new Error('MISSING MOMO ENV VARIABLES');
    }

    const requestId = v4();
    const orderId = `${draftId}_${new Date().getTime()}`;
    const orderInfo = `Thanh_toan_don_hang_${draftId}`;
    const redirectUrl = `${origin}/success`;
    const ipnUrl = `${origin}api/checkout/momo/ipn`;
    const requestType = 'captureWallet';
    const extraData = '';
    const lang = 'en';
    const autoCapture = true;

    const rawSignature =
      'accessKey=' +
      accessKey +
      '&amount=' +
      amount +
      '&extraData=' +
      extraData +
      '&ipnUrl=' +
      ipnUrl +
      '&orderId=' +
      orderId +
      '&orderInfo=' +
      orderInfo +
      '&partnerCode=' +
      partnerCode +
      '&redirectUrl=' +
      redirectUrl +
      '&requestId=' +
      requestId +
      '&requestType=' +
      requestType;

    const hashSignature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = JSON.stringify({
      partnerCode: partnerCode,
      partnerName: 'Test',
      storeId: 'MomoTestStore',
      requestId: requestId,
      amount: amount,
      orderId: orderId,
      orderInfo: orderInfo,
      redirectUrl: redirectUrl,
      ipnUrl: ipnUrl,
      lang: lang,
      requestType: requestType,
      autoCapture: autoCapture,
      extraData: extraData,
      signature: hashSignature,
    });

    try {
      const momoRes = await fetch(process.env.MOMO_API_END_POINT!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      });

      const data = await momoRes.json();

      if (data.resultCode !== 0) {
        throw new Error(`MoMo Error: ${data.message || 'Unknown error'}`);
      }

      return {
        url: data.payUrl,
        externalId: requestId,
        rawPayload: {
          id: requestId,
          amount_total: amount,
          metadata: {
            provider: 'MOMO',
            orderId,
            requestId,
            transId: data.transId,
            orderIds,
            draftId,
          },
        },
      };
    } catch (error) {
      console.error('Momo Strategy Error:', error);
      throw error;
    }
  }
}
