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

    const { action, filters, id, data } = await req.json();

    let result;

    switch (action) {
      case "getAll": {
        let query = supabaseClient.from("events").select("*");

        if (filters?.status) {
          query = query.eq("status", filters.status);
        }
        if (filters?.created_by) {
          query = query.eq("created_by", filters.created_by);
        }

        query = query.order("created_at", { ascending: false });

        const { data: events, error } = await query;
        if (error) throw error;
        result = { data: events };
        break;
      }

      case "getById": {
        const { data: event, error } = await supabaseClient
          .from("events")
          .select("*, ticket_types(*)")
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;
        result = { data: event };
        break;
      }

      case "create": {
        // created_by should be passed in the data from the client
        // It should be the user's Supabase ID (from users table, not auth.users)
        const { data: event, error } = await supabaseClient
          .from("events")
          .insert(data)
          .select()
          .single();

        if (error) throw error;
        result = { data: event };
        break;
      }

      case "update": {
        const { data: event, error } = await supabaseClient
          .from("events")
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        result = { data: event };
        break;
      }

      case "delete": {
        const { error } = await supabaseClient
          .from("events")
          .delete()
          .eq("id", id);

        if (error) throw error;
        result = { success: true };
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
  } catch (error) {
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
