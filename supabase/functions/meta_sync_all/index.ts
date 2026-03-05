import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const categoryMap: Record<string, string> = {
  UTILITY: "UTILITY",
  MARKETING: "MARKETING",
  AUTHENTICATION: "AUTH",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    const { tenant_id } = await req.json();
    if (!tenant_id) return json({ error: "tenant_id is required" }, 400);

    // Check admin role
    const { data: membership } = await serviceClient
      .from("tenant_members")
      .select("role")
      .eq("tenant_id", tenant_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership || membership.role === "viewer") {
      return json({ error: "Forbidden" }, 403);
    }

    const waAccessToken = Deno.env.get("WA_ACCESS_TOKEN")!;
    const apiVersion = Deno.env.get("WA_API_VERSION") || "v24.0";
    const businessId = Deno.env.get("WA_BUSINESS_ID") || "314437023701205";
    const API = `https://graph.facebook.com/${apiVersion}`;

    const metaFetch = async (url: string) => {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${waAccessToken}` },
      });
      return res.json();
    };

    // 1. Fetch all WABAs under the business
    const wabasRes = await metaFetch(`${API}/${businessId}/owned_whatsapp_business_accounts?limit=100`);
    const wabas = wabasRes.data || [];

    const results = {
      wabas_synced: 0,
      numbers_synced: 0,
      templates_synced: 0,
      errors: [] as string[],
    };

    for (const waba of wabas) {
      // Fetch WABA info
      const wabaInfo = await metaFetch(
        `${API}/${waba.id}?fields=id,name,currency,timezone_id,message_template_namespace`
      );

      // Upsert wa_account
      const { data: upsertedAccount, error: accErr } = await serviceClient
        .from("wa_accounts")
        .upsert(
          {
            tenant_id,
            waba_id: waba.id,
            label: wabaInfo.name || `WABA ${waba.id}`,
          },
          { onConflict: "tenant_id,waba_id" }
        )
        .select("id")
        .single();

      if (accErr) {
        results.errors.push(`WABA ${waba.id}: ${accErr.message}`);
        continue;
      }

      const waAccountId = upsertedAccount.id;
      results.wabas_synced++;

      // 2. Fetch phone numbers for this WABA
      const phonesRes = await metaFetch(`${API}/${waba.id}/phone_numbers?limit=100`);
      const phones = phonesRes.data || [];

      for (const phone of phones) {
        // Get detailed phone info
        const phoneDetail = await metaFetch(
          `${API}/${phone.id}?fields=id,display_phone_number,verified_name,quality_rating,status,account_mode`
        );

        // Map status
        let phoneStatus = "active";
        if (phoneDetail.status === "PENDING") phoneStatus = "pending";
        else if (phoneDetail.status === "CONNECTED") phoneStatus = "active";
        else if (phoneDetail.status === "DISCONNECTED") phoneStatus = "disconnected";

        // Map type based on account_mode
        let phoneType = "connected";
        if (phoneDetail.account_mode === "SANDBOX") phoneType = "sandbox";

        const { error: numErr } = await serviceClient
          .from("wa_numbers")
          .upsert(
            {
              tenant_id,
              wa_account_id: waAccountId,
              phone_e164: phoneDetail.display_phone_number || phone.display_phone_number,
              phone_number_id: phone.id,
              status: phoneStatus,
              type: phoneType,
            },
            { onConflict: "tenant_id,phone_number_id" }
          );

        if (numErr) {
          results.errors.push(`Phone ${phone.id}: ${numErr.message}`);
        } else {
          results.numbers_synced++;
        }
      }

      // 3. Fetch templates for this WABA
      const templatesRes = await metaFetch(`${API}/${waba.id}/message_templates?limit=250`);
      const templates = templatesRes.data || [];

      for (const t of templates) {
        const category = categoryMap[t.category] || "UTILITY";
        const bodyComp = t.components?.find((c: any) => c.type === "BODY");
        const bodyText = bodyComp?.text || "";

        // Extract variables from both positional and named params
        let variables: any[] = [];
        if (bodyComp?.example?.body_text?.[0]) {
          variables = bodyComp.example.body_text[0];
        } else if (bodyComp?.example?.body_text_named_params) {
          variables = bodyComp.example.body_text_named_params;
        }

        const { error: tplErr } = await serviceClient
          .from("templates")
          .upsert(
            {
              tenant_id,
              wa_account_id: waAccountId,
              name: t.name,
              category,
              language: t.language,
              status: t.status,
              body: bodyText,
              variables,
              meta: {
                id: t.id,
                components: t.components,
                parameter_format: t.parameter_format,
                sub_category: t.sub_category,
                library_template_name: t.library_template_name,
              },
            },
            { onConflict: "tenant_id,wa_account_id,name,language" }
          );

        if (tplErr) {
          results.errors.push(`Template ${t.name}: ${tplErr.message}`);
        } else {
          results.templates_synced++;
        }
      }

      // 4. Fetch subscribed apps for this WABA (store in wa_account meta if needed)
      const appsRes = await metaFetch(`${API}/${waba.id}/subscribed_apps`);
      // Store apps info as part of the account - no separate table needed
    }

    // Audit log
    await serviceClient.from("audit_logs").insert({
      tenant_id,
      user_id: user.id,
      action: "META_SYNC_ALL",
      entity: "wa_accounts",
      meta: results,
    });

    return json({ success: true, ...results });
  } catch (err) {
    console.error("meta_sync_all error:", err);
    return json({ error: err.message }, 500);
  }
});
