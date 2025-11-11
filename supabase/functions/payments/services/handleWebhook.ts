/* eslint-disable */
// @ts-nocheck

import type { WebhookResult } from "../types/index.ts";

export async function handleWebhook(
  webhookData: any,
  signature: string,
  supabaseClient: any,
  accruPay: any
): Promise<WebhookResult> {
  // Verify webhook signature
  const webhookSecret = Deno.env.get("ACCRUPAY_WEBHOOK_SECRET");

  if (webhookSecret) {
    const isValid = accruPay.verifyWebhookSignature(
      webhookData,
      signature
    );

    if (!isValid) {
      throw new Error("Invalid webhook signature");
    }
  }

  // Process webhook event
  const { eventType, data } = webhookData;

  switch (eventType) {
    case "payment.success":
    case "payment.approved": {
      const orderId = data.metadata?.orderId;

      if (orderId) {
        const { error: updateError } = await supabaseClient
          .from("orders")
          .update({
            status: "PAID",
            payment_intent_id: data.transactionId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId)
          .eq("status", "PENDING");

        if (!updateError) {
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
        }
      }
      break;
    }

    case "payment.failed":
    case "payment.declined": {
      const orderId = data.metadata?.orderId;

      if (orderId) {
        await supabaseClient
          .from("orders")
          .update({
            status: "FAILED",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId)
          .eq("status", "PENDING");
      }
      break;
    }
  }

  return { data: { received: true } };
}

