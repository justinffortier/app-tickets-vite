/* eslint-disable */
// @ts-nocheck

export interface PaymentSessionResult {
  data: {
    sessionToken: string;
    transactionId: string;
    tokenExpiresAt?: string;
    preSessionData?: any;
  };
}

export interface ConfirmPaymentResult {
  data: {
    status: string;
    orderId: string;
    transactionId: string;
    transaction: any;
  };
}

export interface GetPaymentSessionResult {
  data: {
    sessionToken: string;
    transactionId: string;
    paymentProvider: string;
  } | null;
}

export interface GetProvidersResult {
  data: Array<{
    name: string;
    config: any;
  }>;
}

export interface WebhookResult {
  data: {
    received: boolean;
  };
}

