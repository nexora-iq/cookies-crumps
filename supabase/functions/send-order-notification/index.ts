import webpush from "npm:web-push";
import { createClient } from "npm:@supabase/supabase-js@2";

type WebhookPayload = {
  type?: string;
  table?: string;
  schema?: string;
  record?: Record<string, unknown>;
  old_record?: Record<string, unknown> | null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com";
const webhookSecret = Deno.env.get("WEBHOOK_SECRET");

if (!supabaseUrl || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey) {
  console.error("Missing required Edge Function secrets.");
}

const supabaseAdmin = createClient(
  supabaseUrl ?? "",
  serviceRoleKey ?? "",
  { auth: { persistSession: false, autoRefreshToken: false } },
);

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (webhookSecret) {
      const authorization = req.headers.get("authorization") || "";
      if (authorization !== `Bearer ${webhookSecret}`) {
        return json({ error: "Unauthorized" }, 401);
      }
    }

    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const payload = await req.json() as WebhookPayload;

    if (payload.type !== "INSERT" || payload.table !== "orders") {
      return json({ ignored: true });
    }

    const order = payload.record || {};
    const customerName = String(order.customer_name || "زبون جديد");
    const total = Number(order.total_price || 0).toLocaleString("ar-IQ");
    const orderId = String(order.id || "");

    const { data: subscriptions, error } = await supabaseAdmin
      .from("admin_push_subscriptions")
      .select("id, endpoint, p256dh, auth");

    if (error) {
      console.error("Failed to load subscriptions:", error);
      return json({ error: error.message }, 500);
    }

    const notificationPayload = JSON.stringify({
      title: "🍪 Cookies Crumbs — طلب جديد",
      body: `وصل طلب جديد من ${customerName} — المبلغ ${total} د.ع`,
      url: "/iamnoor98naem",
      orderId,
    });

    let sent = 0;
    let removed = 0;

    for (const row of subscriptions || []) {
      const subscription = {
        endpoint: row.endpoint,
        keys: {
          p256dh: row.p256dh,
          auth: row.auth,
        },
      };

      try {
        await webpush.sendNotification(subscription, notificationPayload);
        sent++;
      } catch (error) {
        const statusCode =
          typeof error === "object" && error !== null && "statusCode" in error
            ? Number((error as { statusCode?: number }).statusCode)
            : 0;

        // الاشتراكات المنتهية/غير الصالحة يمكن حذفها بأمان.
        if (statusCode === 404 || statusCode === 410) {
          await supabaseAdmin
            .from("admin_push_subscriptions")
            .delete()
            .eq("id", row.id);
          removed++;
        } else {
          console.error(`Push failed for subscription ${row.id}:`, error);
        }
      }
    }

    return json({
      success: true,
      orderId,
      subscriptions: subscriptions?.length || 0,
      sent,
      removed,
    });
  } catch (error) {
    console.error("send-order-notification error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500,
    );
  }
});
