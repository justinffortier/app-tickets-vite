/* eslint-disable */
// @ts-nocheck

import type { ConfirmPaymentResult } from "../types/index.ts";

export async function confirmPayment(
  orderId: string,
  supabaseClient: any,
  accruPay: any,
  envTag: string
): Promise<ConfirmPaymentResult> {
  // Get order details - explicit select to avoid relationship ambiguity
  const { data: order, error: orderError } = await supabaseClient
    .from("orders")
    .select(`
      id,
      status,
      payment_intent_id,
      payment_session_id,
      customer_email
    `)
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) throw orderError;
  if (!order) throw new Error("Order not found");

  // Verify payment with Accrupay
  try {
    // const verifiedTransaction = envTag === "prod"
    //   ? await accruPay.transactions.verifyClientPaymentSession({
    //     id: order.payment_intent_id,
    //   }) : {
    //     status: "SUCCEEDED",
    //     id: order.payment_intent_id,
    //   };
    const verifiedTransaction = await accruPay.transactions.verifyClientPaymentSession({
      id: order.payment_intent_id,
    });

    if (verifiedTransaction.status === "SUCCEEDED") {
      // Update order status to PAID
      const { error: updateError } = await supabaseClient
        .from("orders")
        .update({
          status: "PAID",
          payment_intent_id: verifiedTransaction.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateError) throw updateError;

      // Update ticket inventory
      const { data: orderItems } = await supabaseClient
        .from("order_items")
        .select("ticket_type_id, quantity")
        .eq("order_id", orderId);

      if (orderItems) {
        for (const item of orderItems) {
          await supabaseClient.rpc("increment_ticket_sold", {
            ticket_id: item.ticket_type_id,
            amount: item.quantity,
          });
        }
      }

      return {
        data: {
          status: "success",
          orderId: orderId,
          transactionId: verifiedTransaction.id,
          transaction: verifiedTransaction,
        },
      };
    } else {
      throw new Error(
        `Payment verification failed: ${verifiedTransaction.status}`
      );
    }
  } catch (paymentError: any) {
    console.error("Payment verification error:", paymentError);
    console.error("Error details:", JSON.stringify(paymentError, null, 2));
    console.error("Error message:", paymentError.message);
    console.error("Error stack:", paymentError.stack);

    // Check for GraphQL errors
    if (paymentError.graphQLErrors) {
      console.error("GraphQL errors:", JSON.stringify(paymentError.graphQLErrors, null, 2));
    }
    if (paymentError.networkError) {
      console.error("Network error:", paymentError.networkError);
    }

    // Update order status to FAILED
    await supabaseClient
      .from("orders")
      .update({
        status: "FAILED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    throw new Error(
      `Payment verification failed: ${paymentError.message}`
    );
  }
}

