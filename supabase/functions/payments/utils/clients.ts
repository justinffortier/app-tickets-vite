/* eslint-disable */
// @ts-nocheck

import { createClient } from "npm:@supabase/supabase-js@2";
import { AccruPay, TRANSACTION_PROVIDER } from "npm:@accrupay/node@0.14.0";

export function initializeSupabaseClient() {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  // Use service role key to bypass RLS policies
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

export function initializeAccruPayClient() {
  const ENV_TAG = Deno.env.get("ENV_TAG") ?? "dev";
  const ACCRUPAY_SECRET_KEY = Deno.env.get("ACCRUPAY_SECRET_KEY") ?? "";
  const ACCRUPAY_SECRET_KEY_QA = Deno.env.get("ACCRUPAY_SECRET_KEY_QA") ?? "";

  if (!ACCRUPAY_SECRET_KEY_QA) {
    throw new Error("ACCRUPAY_SECRET_KEY_QA is not set");
  }

  // Initialize Accrupay client
  // const environment = ENV_TAG === "prod" ? "production" : "qa";
  const environment = 'qa';

  try {
    const accruPay = new AccruPay({
      apiSecret: environment === "production" ? ACCRUPAY_SECRET_KEY : ACCRUPAY_SECRET_KEY_QA,
      environment,
      onAuthError: () => {
        console.error("AccruPay Authentication Error - onAuthError callback triggered");
      },
      onGraphQLError: (errors) => {
        console.error("AccruPay GraphQL Errors:", JSON.stringify(errors, null, 2));
      },
      onNetworkError: (error) => {
        console.error("AccruPay Network Error:", error);
      },
    });

    console.log(`AccruPay client initialized successfully (environment: ${environment})`);
    return accruPay;
  } catch (initError) {
    console.error("Failed to initialize AccruPay client:", initError);
    throw new Error(`AccruPay initialization failed: ${initError.message}`);
  }
}

export function getEnvironment() {
  return Deno.env.get("ENV_TAG") ?? "dev";
}

