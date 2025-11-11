/* eslint-disable */
// @ts-nocheck

import { TRANSACTION_PROVIDER, CURRENCY, COUNTRY_ISO_2 } from "npm:@accrupay/node@0.14.0";
import type { PaymentSessionResult } from "../types/index.ts";

export async function createPaymentSession(
  orderId: string,
  supabaseClient: any,
  accruPay: any
): Promise<PaymentSessionResult> {
  // Get order details - explicit select to avoid relationship ambiguity
  const { data: order, error: orderError } = await supabaseClient
    .from("orders")
    .select(`
      id,
      event_id,
      form_submission_id,
      discount_code_id,
      subtotal,
      discount_amount,
      total,
      status,
      payment_intent_id,
      payment_session_id,
      payment_provider,
      customer_email,
      customer_name,
      customer_first_name,
      customer_last_name,
      customer_phone,
      billing_address,
      billing_address_2,
      billing_city,
      billing_state,
      billing_zip,
      created_at,
      updated_at,
      events!inner(title),
      order_items(
        id,
        order_id,
        ticket_type_id,
        quantity,
        unit_price,
        subtotal,
        ticket_types(name)
      )
    `)
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) throw orderError;
  if (!order) throw new Error("Order not found");

  if (order.status !== "PENDING") {
    throw new Error(`Order status is ${order.status}, cannot create payment session`);
  }

  // Create payment session with Accrupay/Nuvei
  try {
    // Convert amount to bigint (cents)
    const amountInCents = Math.round(parseFloat(order.total) * 100);

    console.log("Creating payment session for order:", order.id);
    console.log("Amount in cents:", amountInCents);

    const sessionData = {
      transactionProvider: TRANSACTION_PROVIDER.NUVEI,
      data: {
        amount: BigInt(amountInCents),
        currency: CURRENCY.USD,
        billing: {
          billingFirstName: order.customer_first_name || "Guest",
          billingLastName: order.customer_last_name || "User",
          billingEmail: order.customer_email,
          billingPhone: order.customer_phone || null,
          billingAddressCountry: COUNTRY_ISO_2.US,
          billingAddressState: order.billing_state || "CA",
          billingAddressCity: order.billing_city || "City",
          billingAddressLine1: order.billing_address || "123 Main St",
          billingAddressLine2: order.billing_address_2 || null,
          billingAddressPostalCode: order.billing_zip || "00000",
        },
        storePaymentMethod: false,
        merchantInternalCustomerCode: order.customer_email,
        merchantInternalTransactionCode: order.id,
      },
    };

    console.log("Session data:", JSON.stringify(sessionData, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    const transaction = await accruPay.transactions.startClientPaymentSession(sessionData);

    // Get pre-session data for React SDK
    let preSessionData = null;
    try {
      const preSessionDataResponse = await accruPay.transactions.getClientPaymentPreSessionData({
        transactionProvider: TRANSACTION_PROVIDER.NUVEI,
      });
      preSessionData = {
        ...preSessionDataResponse,
        env: preSessionDataResponse.environment,
      };
    } catch (preSessionError) {
      console.warn("Could not fetch pre-session data:", preSessionError);
      // Continue without pre-session data - session token should be sufficient
    }

    // Store session information in order
    const { error: updateError } = await supabaseClient
      .from("orders")
      .update({
        payment_session_id: transaction.token,
        payment_provider: "nuvei",
        payment_intent_id: transaction.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) throw updateError;

    return {
      data: {
        sessionToken: transaction.token,
        transactionId: transaction.id,
        tokenExpiresAt: transaction.tokenExpiresAt,
        preSessionData: preSessionData,
      },
    };
  } catch (paymentError: any) {
    console.error("Accrupay payment session error:", paymentError);
    console.error("Error details:", JSON.stringify(paymentError, null, 2));
    console.error("Error stack:", paymentError.stack);

    // Check for specific error types
    if (paymentError.networkError) {
      console.error("Network error:", paymentError.networkError);
    }
    if (paymentError.graphQLErrors) {
      console.error("GraphQL errors:", paymentError.graphQLErrors);
    }

    throw new Error(
      `Failed to create payment session: ${paymentError.message || JSON.stringify(paymentError)}`
    );
  }
}

