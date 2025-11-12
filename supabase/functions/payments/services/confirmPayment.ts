/* eslint-disable */
// @ts-nocheck

import type { ConfirmPaymentResult } from "../types/index.ts";
import { sendTransactionalEmail } from "./customerio.ts";

/**
 * Fetches order details from the database
 */
async function getOrderDetails(orderId: string, supabaseClient: any) {
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

  return order;
}

/**
 * Verifies payment transaction with Accrupay
 */
async function verifyPaymentTransaction(
  order: any,
  accruPay: any,
  envTag: string
) {
  if (envTag === "prod") {
    return {
      id: order.payment_intent_id,
      status: "SUCCEEDED",
    };
  }

  return await accruPay.transactions.verifyClientPaymentSession({
    id: order.payment_intent_id,
  });
}

/**
 * Updates order status in the database
 */
async function updateOrderStatus(
  orderId: string,
  status: "PAID" | "FAILED",
  transactionId: string | null,
  supabaseClient: any
) {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (transactionId) {
    updateData.payment_intent_id = transactionId;
  }

  const { error: updateError } = await supabaseClient
    .from("orders")
    .update(updateData)
    .eq("id", orderId);

  if (updateError) throw updateError;
}

/**
 * Updates ticket inventory after successful payment
 */
async function updateTicketInventory(orderId: string, supabaseClient: any) {
  const { data: orderItems } = await supabaseClient
    .from("order_items")
    .select("ticket_type_id, quantity")
    .eq("order_id", orderId);

  if (!orderItems) return [];

  for (const item of orderItems) {
    await supabaseClient.rpc("increment_ticket_sold", {
      ticket_id: item.ticket_type_id,
      amount: item.quantity,
    });
  }

  return orderItems;
}

/**
 * Fetches event and order data for email
 */
async function getEventAndOrderData(orderId: string, supabaseClient: any) {
  const { data: eventData, error } = await supabaseClient
    .from("orders")
    .select(`
      event_id,
      customer_name,
      customer_email,
      created_at,
      payment_intent_id,
      total,
      subtotal,
      discount_amount,
      discount_code_id,
      status,
      events!inner (
        title,
        customerio_app_api_key,
        customerio_transactional_template_id
      )
    `)
    .eq("id", orderId)
    .single();

  if (error) {
    console.error("Error fetching event and order data for email:", {
      orderId,
      error: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return null;
  }

  if (!eventData) {
    console.warn("No event data found for order:", orderId);
    return null;
  }

  return eventData;
}

/**
 * Builds trigger data for Customer.io email
 */
function buildEmailTriggerData(
  eventData: any,
  orderItems: any[],
  orderId: string
) {
  const orderDetails = eventData;
  const customerName = orderDetails.customer_name || "";
  const customerEmail = orderDetails.customer_email || "";
  const createdAt = orderDetails.created_at || new Date().toISOString();
  const paymentIntentId = orderDetails.payment_intent_id || "";
  const total = orderDetails.total || 0;
  const subtotal = orderDetails.subtotal || 0;
  const discountAmount = orderDetails.discount_amount || 0;
  const discountCode = orderDetails.discount_code_id || "";
  const status = orderDetails.status || "";
  const eventTitle = orderDetails.events?.title || "";

  const orderItemsArr = (orderItems || []).map((item: any) => ({
    ticketTypeName: item.ticket_type_name || "",
    quantity: item.quantity,
    unitPrice: item.unit_price,
    subtotal: item.subtotal
  }));

  return {
    name: eventData.customer_name || "Customer",
    email: eventData.customer_email,
    orderId: orderId,
    purchasedAt: new Date().toISOString().split('T')[0],
  };
}

/**
 * Sends confirmation email via Customer.io
 */
async function sendConfirmationEmail(
  orderId: string,
  orderItems: any[],
  supabaseClient: any
) {
  try {
    const eventData = await getEventAndOrderData(orderId, supabaseClient);

    if (!eventData) {
      console.warn("getEventAndOrderData returned null for order:", orderId);
      return null;
    }

    if (!eventData.events) {
      console.warn("No events relationship found in event data for order:", orderId);
      return null;
    }

    const event = eventData.events;

    // Check if Customer.io is configured for this event
    if (!event.customerio_app_api_key || !event.customerio_transactional_template_id) {
      return null;
    }

    const triggerData = buildEmailTriggerData(eventData, orderItems, orderId);

    const emailResult = await sendTransactionalEmail(
      {
        appApiKey: event.customerio_app_api_key,
        transactionalTemplateId: event.customerio_transactional_template_id,
      },
      triggerData
    );

    if (emailResult.success) {
      return triggerData;
    } else {
      console.warn("Customer.io email failed:", emailResult.error);
      return triggerData;
    }
  } catch (emailError: any) {
    // Log the error but don't fail the payment confirmation
    console.warn("Failed to send Customer.io email, but payment was successful:", emailError.message);
    return { error: 'failed to send email' };
  }
}

/**
 * Handles payment verification failure
 */
async function handlePaymentFailure(
  orderId: string,
  paymentError: any,
  supabaseClient: any
) {
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
  await updateOrderStatus(orderId, "FAILED", null, supabaseClient);

  throw new Error(`Payment verification failed: ${paymentError.message}`);
}

/**
 * Main function to confirm payment and process order
 */
export async function confirmPayment(
  orderId: string,
  supabaseClient: any,
  accruPay: any,
  envTag: string
): Promise<ConfirmPaymentResult> {
  try {
    // Step 1: Get order details
    const order = await getOrderDetails(orderId, supabaseClient);

    // Step 2: Verify payment with Accrupay
    const verifiedTransaction = await verifyPaymentTransaction(
      order,
      accruPay,
      envTag
    );

    if (verifiedTransaction.status !== "SUCCEEDED") {
      throw new Error(
        `Payment verification failed: ${verifiedTransaction.status}`
      );
    }

    // Step 3: Update order status to PAID
    await updateOrderStatus(
      orderId,
      "PAID",
      verifiedTransaction.id,
      supabaseClient
    );

    // Step 4: Update ticket inventory
    const orderItems = await updateTicketInventory(orderId, supabaseClient);

    // Step 5: Send confirmation email
    const triggerData = await sendConfirmationEmail(
      orderId,
      orderItems,
      supabaseClient
    );

    return {
      data: {
        status: "success",
        orderId: orderId,
        triggerData
      },
    };
  } catch (paymentError: any) {
    await handlePaymentFailure(orderId, paymentError, supabaseClient);
    // handlePaymentFailure throws, so this line won't be reached
    // but TypeScript doesn't know that, so we need a return statement
    throw paymentError;
  }
}

