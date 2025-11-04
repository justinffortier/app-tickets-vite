/* eslint-disable */
// @ts-nocheck

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { AccruPay, COUNTRY_ISO_2, CURRENCY, TRANSACTION_PROVIDER } from "npm:@accrupay/node@0.14.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const ENV_TAG = Deno.env.get("ENV_TAG") ?? "dev";

    const ACCRUPAY_SECRET_KEY = Deno.env.get("ACCRUPAY_SECRET_KEY") ?? "";

    // Use QA secret key when in QA environment
    const ACCRUPAY_SECRET_KEY_QA = ENV_TAG === "qa"
      ? Deno.env.get("ACCRUPAY_SECRET_KEY_QA") ?? ""
      : Deno.env.get("ACCRUPAY_SECRET_KEY_QA") ?? "";

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    }

    if (!ACCRUPAY_SECRET_KEY_QA) {
      throw new Error("ACCRUPAY_SECRET_KEY_QA is not set");
    }

    // Initialize Accrupay client
    // const environment = ENV_TAG === "prod" ? "production" : "qa";
    const environment = 'qa';
    let accruPay;
    try {
      accruPay = new AccruPay({
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

      console.log(`AccruPay client initialized successfully (environment: ${environment}`);
    } catch (initError) {
      console.error("Failed to initialize AccruPay client:", initError);
      throw new Error(`AccruPay initialization failed: ${initError.message}`);
    }

    // Use service role key to bypass RLS policies
    const supabaseClient = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );

    const { action, orderId, paymentData, webhookData } = await req.json();

    let result;

    switch (action) {
      case "createPaymentSession": {
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

          result = {
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
        break;
      }

      case "confirmPayment": {
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

            result = {
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
        break;
      }

      case "handleWebhook": {
        // Verify webhook signature
        const webhookSecret = Deno.env.get("ACCRUPAY_WEBHOOK_SECRET");

        if (webhookSecret) {
          const isValid = accruPay.verifyWebhookSignature(
            webhookData,
            req.headers.get("x-accrupay-signature") || ""
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

        result = { data: { received: true } };
        break;
      }

      case "getPaymentSession": {
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
          result = { data: null };
          break;
        }

        // Return the session token
        result = {
          data: {
            sessionToken: order.payment_session_id,
            transactionId: order.payment_intent_id,
            paymentProvider: order.payment_provider,
          },
        };
        break;
      }

      case "getProviders": {
        try {
          const preSessionData = await accruPay.transactions.getClientPaymentPreSessionData({
            transactionProvider: TRANSACTION_PROVIDER.NUVEI,
          });

          console.log("Provider config fetched successfully:", preSessionData);

          result = {
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
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("Payment function error:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

