/* eslint-disable */
// @ts-nocheck

import { TRANSACTION_PROVIDER } from "npm:@accrupay/node@0.14.0";
import type { GetProvidersResult } from "../types/index.ts";

export async function getProviders(
  accruPayClients: { production: any; sandbox: any },
  envTag: string
): Promise<GetProvidersResult> {
  try {
    // Use default environment based on ENV_TAG for getProviders
    const defaultEnv = envTag === "prod" ? "production" : "sandbox";
    const accruPay = accruPayClients[defaultEnv] || accruPayClients.sandbox;
    
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

