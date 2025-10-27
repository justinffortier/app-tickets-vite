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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    }

    // Use service role key to bypass RLS policies
    const supabaseClient = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );

    const { action, eventId, id, code, data } = await req.json();

    let result;

    switch (action) {
      case "getByEventId": {
        const { data: discounts, error } = await supabaseClient
          .from("discount_codes")
          .select("*")
          .eq("event_id", eventId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        result = { data: discounts };
        break;
      }

      case "getById": {
        const { data: discount, error } = await supabaseClient
          .from("discount_codes")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;
        result = { data: discount };
        break;
      }

      case "create": {
        const { data: discount, error } = await supabaseClient
          .from("discount_codes")
          .insert(data)
          .select()
          .single();

        if (error) throw error;
        result = { data: discount };
        break;
      }

      case "update": {
        const { data: discount, error } = await supabaseClient
          .from("discount_codes")
          .update(data)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        result = { data: discount };
        break;
      }

      case "delete": {
        const { error } = await supabaseClient
          .from("discount_codes")
          .delete()
          .eq("id", id);

        if (error) throw error;
        result = { success: true };
        break;
      }

      case "validateCode": {
        const { data: discount, error } = await supabaseClient
          .from("discount_codes")
          .select("*")
          .eq("code", code.toUpperCase())
          .eq("event_id", eventId)
          .eq("is_active", true)
          .maybeSingle();

        if (error) throw error;
        if (!discount) {
          result = { valid: false, error: "Invalid discount code" };
          break;
        }

        if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
          result = { valid: false, error: "Discount code has expired" };
          break;
        }

        if (discount.max_uses && discount.used_count >= discount.max_uses) {
          result = { valid: false, error: "Discount code has reached maximum uses" };
          break;
        }

        result = { valid: true, discount };
        break;
      }

      case "incrementUsage": {
        const { data, error } = await supabaseClient.rpc("increment_discount_usage", {
          discount_id: id,
        });

        if (error) throw error;
        result = { data };
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
