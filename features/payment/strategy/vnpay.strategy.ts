import { IPaymentStrategy } from '@/features/payment/strategy/payment.interface';
import { VnpayPaymentParams } from '@/features/payment/payment.dto';
import dayjs from 'dayjs';
import qs from 'qs';
import crypto from 'crypto';
import { sortObject } from '@/app/api/checkout/vnpay/route';

export class VnPayStrategy implements IPaymentStrategy<VnpayPaymentParams> {
  async createPaymentUrl(params: VnpayPaymentParams) {
    const { amount, orderIds, ipAddr, draftId, bankCode, language } = params;

    const tmnCode = process.env.VNPAY_TERMINAL_ID!;
    const secretKey = process.env.VNPAY_SECRET_KEY!;
    let vnpUrl = process.env.VNPAY_URL!;
    const returnUrl = process.env.VNPAY_RETURN_URL!;

    if (!tmnCode || !secretKey || !vnpUrl || !returnUrl) {
      throw new Error(
        'MISSING ENV VARIABLES (VNPAY_TERMINAL_ID, VNPAY_SECRET_KEY...)'
      );
    }

    // VNPay payment integration is not implemented yet
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const date = new Date();
    const createDate = dayjs(date).format('YYYYMMDDHHmmss');
    const TxnRef = `${draftId}_${date.getTime()}_${random}`;
    const orderInfo = `Thanh_toan_don_hang_qua_VNPAY`;
    const orderType = '200000';
    const locale = language;
    const currency = 'VND';
    let vnp_Params: Record<string, string | number> = {};

    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = locale;
    vnp_Params['vnp_CurrCode'] = currency;
    vnp_Params['vnp_TxnRef'] = TxnRef;
    vnp_Params['vnp_OrderInfo'] = orderInfo;
    vnp_Params['vnp_OrderType'] = orderType;
    vnp_Params['vnp_Amount'] = Math.floor(amount * 100);
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;
    if (bankCode !== null && bankCode !== '') {
      vnp_Params['vnp_BankCode'] = bankCode;
    }

    vnp_Params = sortObject(vnp_Params);

    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    vnp_Params['vnp_SecureHash'] = hmac
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    vnpUrl += '?' + qs.stringify(vnp_Params, { encode: false });
    return {
      url: vnpUrl,
      externalId: TxnRef,
      rawPayload: {
        id: TxnRef,
        url: vnpUrl,
        vnp_Amount: amount,
        vnp_BankCode: bankCode,
        vnp_TxnRef: TxnRef,
        provider: 'VNPAY',
        orderIds,
        draftId,
        vnp_IpAddr: ipAddr,
      },
    };
  }
}
