export interface IPaymentStrategy<TParams> {
  createPaymentUrl(params: TParams): Promise<{
    url: string;
    externalId: string;
    rawPayload: Record<string, any>;
  }>;
}
