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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader ?? "" },
        },
      }
    );

    const { action, filters, id, formId, responses, email, data } = await req.json();

    let result;

    switch (action) {
      case "getAll": {
        let query = supabaseClient.from("forms").select("*, events(title)");

        if (filters?.event_id) {
          query = query.eq("event_id", filters.event_id);
        }

        if (filters?.is_published !== undefined) {
          query = query.eq("is_published", filters.is_published);
        }

        query = query.order("created_at", { ascending: false });

        const { data: forms, error } = await query;
        if (error) throw error;
        result = { data: forms };
        break;
      }

      case "getById": {
        const { data: form, error } = await supabaseClient
          .from("forms")
          .select("*, events(title, id)")
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;
        result = { data: form };
        break;
      }

      case "create": {
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();

        const { data: form, error } = await supabaseClient
          .from("forms")
          .insert({
            ...data,
            created_by: user?.id,
          })
          .select()
          .single();

        if (error) throw error;
        result = { data: form };
        break;
      }

      case "update": {
        const { data: form, error } = await supabaseClient
          .from("forms")
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        result = { data: form };
        break;
      }

      case "delete": {
        const { error } = await supabaseClient.from("forms").delete().eq("id", id);

        if (error) throw error;
        result = { success: true };
        break;
      }

      case "submitForm": {
        const { data: submission, error } = await supabaseClient
          .from("form_submissions")
          .insert({
            form_id: formId,
            responses,
            email,
          })
          .select()
          .single();

        if (error) throw error;
        result = { data: submission };
        break;
      }

      case "getSubmissions": {
        const { data: submissions, error } = await supabaseClient
          .from("form_submissions")
          .select("*, orders(*)")
          .eq("form_id", formId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        result = { data: submissions };
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

