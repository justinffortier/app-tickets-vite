/* eslint-disable */
// @ts-nocheck

import { TRANSACTION_PROVIDER } from "npm:@accrupay/node@0.14.0";
import type { GetProvidersResult } from "../types/index.ts";

export async function getProviders(
  accruPay: any
): Promise<GetProvidersResult> {
  try {
    const preSessionData = await accruPay.transactions.getClientPaymentPreSessionData({
      transactionProvider: TRANSACTION_PROVIDER.NUVEI,
    });

    return {
      data: [{
        name: 'nuvei',
        config: {
          ...preSessionData,
          env: preSessionData.environment,
        }
      }]
    };
  } catch (error: any) {
    console.error("Error fetching providers:", error);
    throw new Error(`Failed to fetch providers: ${error.message}`);
  }
}

