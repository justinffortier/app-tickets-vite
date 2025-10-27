import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");

    const clientOptions: any = {};
    if (authHeader) {
      clientOptions.global = {
        headers: { Authorization: authHeader },
      };
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      clientOptions
    );

    const { action, filters, id, status, paymentIntentId, items, discountCodeId } =
      await req.json();

    let result;

    switch (action) {
      case "getAll": {
        let query = supabaseClient
          .from("orders")
          .select("*, events(title), order_items(*, ticket_types(name))");

        if (filters?.event_id) {
          query = query.eq("event_id", filters.event_id);
        }

        if (filters?.status) {
          query = query.eq("status", filters.status);
        }

        query = query.order("created_at", { ascending: false });

        const { data: orders, error } = await query;
        if (error) throw error;
        result = { data: orders };
        break;
      }

      case "getById": {
        const { data: order, error } = await supabaseClient
          .from("orders")
          .select(
            "*, events(title), order_items(*, ticket_types(name)), discount_codes(code, type, value)"
          )
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;
        result = { data: order };
        break;
      }

      case "create": {
        const orderData = data;
        const { items, ...order } = orderData;

        const { data: newOrder, error: orderError } = await supabaseClient
          .from("orders")
          .insert(order)
          .select()
          .single();

        if (orderError) throw orderError;

        if (items && items.length > 0) {
          const orderItems = items.map((item: any) => ({
            order_id: newOrder.id,
            ticket_type_id: item.ticket_type_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.quantity * item.unit_price,
          }));

          const { error: itemsError } = await supabaseClient
            .from("order_items")
            .insert(orderItems);

          if (itemsError) throw itemsError;
        }

        const { data: createdOrder } = await supabaseClient
          .from("orders")
          .select(
            "*, events(title), order_items(*, ticket_types(name)), discount_codes(code, type, value)"
          )
          .eq("id", newOrder.id)
          .maybeSingle();

        result = { data: createdOrder };
        break;
      }

      case "updateStatus": {
        const updateData: any = {
          status,
          updated_at: new Date().toISOString(),
        };

        if (paymentIntentId) {
          updateData.payment_intent_id = paymentIntentId;
        }

        const { data: order, error } = await supabaseClient
          .from("orders")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;

        if (status === "PAID") {
          const { data: orderItems } = await supabaseClient
            .from("order_items")
            .select("ticket_type_id, quantity")
            .eq("order_id", id);

          if (orderItems) {
            for (const item of orderItems) {
              await supabaseClient.rpc("increment_ticket_sold", {
                ticket_id: item.ticket_type_id,
                amount: item.quantity,
              });
            }
          }
        }

        result = { data: order };
        break;
      }

      case "calculateTotal": {
        let subtotal = 0;

        for (const item of items) {
          const { data: ticket } = await supabaseClient
            .from("ticket_types")
            .select("price")
            .eq("id", item.ticket_type_id)
            .single();

          if (ticket) {
            subtotal += parseFloat(ticket.price) * item.quantity;
          }
        }

        let discountAmount = 0;

        if (discountCodeId) {
          const { data: discount } = await supabaseClient
            .from("discount_codes")
            .select("type, value")
            .eq("id", discountCodeId)
            .single();

          if (discount) {
            if (discount.type === "PERCENT") {
              discountAmount = (subtotal * parseFloat(discount.value)) / 100;
            } else {
              discountAmount = parseFloat(discount.value);
            }
          }
        }

        const total = Math.max(0, subtotal - discountAmount);

        result = {
          subtotal: parseFloat(subtotal.toFixed(2)),
          discount_amount: parseFloat(discountAmount.toFixed(2)),
          total: parseFloat(total.toFixed(2)),
        };
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

