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
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set. Please set it in your Supabase project secrets.");
    }

    // Use service role key to bypass RLS policies
    const supabaseClient = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );

    const { action, filters, id, firebaseUid, orgId, role, userId, data } =
      await req.json();

    let result;

    switch (action) {
      case "getAll": {
        let query = supabaseClient.from("users").select("*");

        if (filters?.organization_id) {
          query = query.eq("user_organizations.organization_id", filters.organization_id);
        }

        query = query.order("created_at", { ascending: false });

        const { data: users, error } = await query;
        if (error) throw error;
        result = { data: users };
        break;
      }

      case "getById": {
        const { data: user, error } = await supabaseClient
          .from("users")
          .select("*, user_organizations(organization_id, role, organizations(name))")
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;
        result = { data: user };
        break;
      }

      case "getByFirebaseUid": {
        const { data: user, error } = await supabaseClient
          .from("users")
          .select("*, user_organizations(organization_id, role, organizations(name))")
          .eq("firebase_uid", firebaseUid)
          .maybeSingle();

        if (error) throw error;
        result = { data: user };
        break;
      }

      case "create": {
        const { data: user, error } = await supabaseClient
          .from("users")
          .insert(data)
          .select()
          .single();

        if (error) throw error;
        result = { data: user };
        break;
      }

      case "update": {
        const { data: user, error } = await supabaseClient
          .from("users")
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        result = { data: user };
        break;
      }

      case "delete": {
        const { error } = await supabaseClient
          .from("users")
          .delete()
          .eq("id", id);

        if (error) throw error;
        result = { success: true };
        break;
      }

      case "getOrganizations": {
        const { data: orgs, error } = await supabaseClient
          .from("user_organizations")
          .select("*, organizations(*)")
          .eq("user_id", userId);

        if (error) throw error;
        result = { data: orgs };
        break;
      }

      case "addToOrganization": {
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

      case "removeFromOrganization": {
        const { error } = await supabaseClient
          .from("user_organizations")
          .delete()
          .eq("user_id", userId)
          .eq("organization_id", orgId);

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
  } catch (error: any) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({
        error: error?.message || "An error occurred",
        details: error?.toString(),
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
