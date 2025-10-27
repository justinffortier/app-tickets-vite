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

    const { action, filters, id, orgId, userId, role, data } = await req.json();

    let result;

    switch (action) {
      case "getAll": {
        let query = supabaseClient.from("organizations").select("*");

        if (filters?.user_id) {
          query = query.eq("user_organizations.user_id", filters.user_id);
        }

        query = query.order("created_at", { ascending: false });

        const { data: orgs, error } = await query;
        if (error) throw error;
        result = { data: orgs };
        break;
      }

      case "getById": {
        const { data: org, error } = await supabaseClient
          .from("organizations")
          .select("*, user_organizations(user_id, role, users(*))")
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;
        result = { data: org };
        break;
      }

      case "create": {
        const { data: org, error } = await supabaseClient
          .from("organizations")
          .insert(data)
          .select()
          .single();

        if (error) throw error;
        result = { data: org };
        break;
      }

      case "update": {
        const { data: org, error } = await supabaseClient
          .from("organizations")
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        result = { data: org };
        break;
      }

      case "delete": {
        const { error } = await supabaseClient
          .from("organizations")
          .delete()
          .eq("id", id);

        if (error) throw error;
        result = { success: true };
        break;
      }

      case "getUsers": {
        const { data: users, error } = await supabaseClient
          .from("user_organizations")
          .select("*, users(*)")
          .eq("organization_id", orgId);

        if (error) throw error;
        result = { data: users };
        break;
      }

      case "addUser": {
        const { data: userOrg, error } = await supabaseClient
          .from("user_organizations")
          .insert({
            user_id: userId,
            organization_id: orgId,
            role,
          })
          .select()
          .single();

        if (error) throw error;
        result = { data: userOrg };
        break;
      }

      case "removeUser": {
        const { error } = await supabaseClient
          .from("user_organizations")
          .delete()
          .eq("organization_id", orgId)
          .eq("user_id", userId);

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
