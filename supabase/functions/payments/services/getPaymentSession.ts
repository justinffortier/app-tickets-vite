/* eslint-disable */
// @ts-nocheck

import type { GetPaymentSessionResult } from "../types/index.ts";

export async function getPaymentSession(
  orderId: string,
  supabaseClient: any
): Promise<GetPaymentSessionResult> {
  // Get payment session from database
  const { data: order, error: orderError } = await supabaseClient
    .from("orders")
    .select(`
      id,
      status,
      payment_session_id,
      payment_intent_id,
      payment_provider
    `)
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) throw orderError;
  if (!order) throw new Error("Order not found");

  // If no session exists or order is not pending, return null (frontend will create new session)
  if (!order.payment_session_id || order.status !== "PENDING") {
    return { data: null };
  }

  // Return the session token
  return {
    data: {
      sessionToken: order.payment_session_id,
      transactionId: order.payment_intent_id,
      paymentProvider: order.payment_provider,
    },
  };
}

