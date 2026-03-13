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

async function verifySignature(body: string, signature: string | null): Promise<boolean> {
  const appSecret = Deno.env.get("WA_APP_SECRET");
  if (!appSecret || !signature) return true; // skip if no secret configured
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const expected =
    "sha256=" +
    Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  return signature === expected;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // GET — Webhook verification challenge
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const verifyToken = Deno.env.get("WA_WEBHOOK_VERIFY_TOKEN");

    if (mode === "subscribe" && token === verifyToken) {
      console.log("Webhook verified");
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // POST — Receive events
  if (req.method === "POST") {
    const bodyText = await req.text();

    // Verify signature
    const signature = req.headers.get("X-Hub-Signature-256");
    const valid = await verifySignature(bodyText, signature);
    if (!valid) {
      return new Response("Invalid signature", { status: 403 });
    }

    const payload = JSON.parse(bodyText);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    try {
      for (const entry of payload.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field !== "messages") continue;
          const value = change.value;
          const phoneNumberId = value.metadata?.phone_number_id;

          // Find the wa_number
          const { data: waNumber } = await supabase
            .from("wa_numbers")
            .select("id, tenant_id")
            .eq("phone_number_id", phoneNumberId)
            .maybeSingle();

          if (!waNumber) {
            console.log(`Unknown phone_number_id: ${phoneNumberId}`);
            continue;
          }

          const tenantId = waNumber.tenant_id;

          // Process inbound messages
          for (const msg of value.messages || []) {
            const senderPhone = msg.from;
            const contactProfile = value.contacts?.[0]?.profile?.name || senderPhone;

            // Upsert contact
            const { data: contact } = await supabase
              .from("contacts")
              .upsert(
                {
                  tenant_id: tenantId,
                  phone_e164: `+${senderPhone}`,
                  display_name: contactProfile,
                  wa_id: senderPhone,
                },
                { onConflict: "tenant_id,phone_e164" },
              )
              .select("id")
              .single();

            if (!contact) continue;

            // Upsert conversation
            let { data: conversation } = await supabase
              .from("conversations")
              .select("id")
              .eq("tenant_id", tenantId)
              .eq("wa_number_id", waNumber.id)
              .eq("contact_id", contact.id)
              .eq("status", "open")
              .maybeSingle();

            if (!conversation) {
              const { data: newConv } = await supabase
                .from("conversations")
                .insert({
                  tenant_id: tenantId,
                  wa_number_id: waNumber.id,
                  contact_id: contact.id,
                  status: "open",
                })
                .select("id")
                .single();
              conversation = newConv;
            }

            if (!conversation) continue;

            // Determine message content
            const msgText = msg.text?.body || null;
            const hasMedia = ["image", "video", "audio", "document", "sticker"].includes(msg.type);

            // Insert message
            const { data: insertedMsg } = await supabase
              .from("messages")
              .insert({
                tenant_id: tenantId,
                conversation_id: conversation.id,
                direction: "inbound",
                status: "delivered",
                text: msgText,
                provider_message_id: msg.id,
                meta: {
                  type: msg.type,
                  ...(hasMedia ? { media: msg[msg.type] } : {}),
                },
              })
              .select("id")
              .single();

            // If media, enqueue processing
            if (hasMedia && insertedMsg) {
              const mediaInfo = msg[msg.type];
              await supabase.from("media_files").insert({
                tenant_id: tenantId,
                message_id: insertedMsg.id,
                kind: msg.type === "sticker" ? "sticker" : msg.type,
                mime: mediaInfo?.mime_type || null,
                storage_key: null, // will be set by worker
              });

              await supabase.from("job_queue").insert({
                tenant_id: tenantId,
                job_type: "MEDIA_PROCESS",
                payload: {
                  tenant_id: tenantId,
                  message_id: insertedMsg.id,
                  media_id: mediaInfo?.id,
                  mime_type: mediaInfo?.mime_type,
                },
              });
            }
          }

          // Process status updates
          for (const status of value.statuses || []) {
            const statusMap: Record<string, string> = {
              sent: "sent",
              delivered: "delivered",
              read: "read",
              failed: "failed",
            };
            const mappedStatus = statusMap[status.status];
            if (mappedStatus && status.id) {
              await supabase
                .from("messages")
                .update({ status: mappedStatus })
                .eq("provider_message_id", status.id);
            }
          }

          // Enqueue webhook deliveries to customer endpoints
          const { data: endpoints } = await supabase
            .from("webhook_endpoints")
            .select("id")
            .eq("tenant_id", tenantId)
            .eq("is_enabled", true);

          for (const ep of endpoints || []) {
            await supabase.from("job_queue").insert({
              tenant_id: tenantId,
              job_type: "WEBHOOK_DELIVERY",
              payload: {
                webhook_endpoint_id: ep.id,
                event_type: "whatsapp.event",
                payload: value,
              },
            });
          }
        }
      }
    } catch (err) {
      console.error("Webhook processing error:", err);
    }

    // Trigger worker_dispatch to process queued jobs (fire-and-forget)
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      fetch(`${supabaseUrl}/functions/v1/worker_dispatch`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }).catch((e) => console.error("worker_dispatch trigger failed:", e));
    } catch (triggerErr) {
      console.error("Failed to trigger worker_dispatch:", triggerErr);
    }

    // Always return 200 quickly
    return new Response("OK", { status: 200 });
  }

  return new Response("Method not allowed", { status: 405 });
});
