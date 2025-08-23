// src/app/api/internal/webhooks/dispatch/route.js
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import crypto from "crypto";

/** HMAC signing helper (same scheme your receiver verifies) */
function signPayload(secret, timestamp, rawBody) {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(`${timestamp}.${rawBody}`);
  return `v1=${hmac.digest("hex")}`;
}

/** retry schedule in seconds */
function backoff(attempts) {
  const schedule = [60, 300, 1800, 7200, 43200, 86400, 172800];
  const idx = Math.min(attempts, schedule.length - 1);
  return schedule[idx] * 1000;
}

/** core worker */
async function dispatchDue(limit = 20) {
  const { data: due, error } = await supabaseAdmin
    .from("webhook_outbox")
    .select(`
      id, event_type, payload, attempts,
      webhook_endpoints:endpoint_id ( id, url, secret, is_active )
    `)
    .lte("next_attempt_at", new Date().toISOString())
    .lt("attempts", 7)
    .order("next_attempt_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  if (!due?.length) return { sent: 0 };

  let sent = 0;

  for (const row of due) {
    const ep = row.webhook_endpoints;
    if (!ep?.is_active) {
      await supabaseAdmin.from("webhook_outbox").delete().eq("id", row.id);
      continue;
    }

    const rawBody = JSON.stringify(row.payload);
    const ts = Math.floor(Date.now() / 1000).toString();
    const signature = signPayload(ep.secret, ts, rawBody);
    const idempotencyKey = crypto.randomUUID();

    try {
      const res = await fetch(ep.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Echo-Event": row.event_type,
          "X-Echo-Timestamp": ts,
          "X-Echo-Signature": signature,
          "Idempotency-Key": idempotencyKey
        },
        body: rawBody
      });

      if (res.ok) {
        await supabaseAdmin.from("webhook_outbox").delete().eq("id", row.id);
        sent++;
      } else {
        await supabaseAdmin.from("webhook_outbox").update({
          attempts: row.attempts + 1,
          next_attempt_at: new Date(Date.now() + backoff(row.attempts)).toISOString(),
          last_error: `HTTP ${res.status}`
        }).eq("id", row.id);
      }
    } catch (err) {
      await supabaseAdmin.from("webhook_outbox").update({
        attempts: row.attempts + 1,
        next_attempt_at: new Date(Date.now() + backoff(row.attempts)).toISOString(),
        last_error: String(err).slice(0, 300)
      }).eq("id", row.id);
    }
  }

  return { sent };
}

/** shared auth check */
function authorized(req) {
  const cronSecret = req.headers.get("x-cron-secret");
  const adminSecret = req.headers.get("x-admin-secret");
  return (
    (cronSecret && cronSecret === process.env.CRON_SECRET) ||
    (adminSecret && adminSecret === process.env.ADMIN_TOKEN)
  );
}

/** GET for Vercel Cron */
export async function GET(req) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await dispatchDue();
    return NextResponse.json(result);
  } catch (e) {
    console.error("Cron dispatch error:", e);
    return NextResponse.json({ error: "Dispatch failed" }, { status: 500 });
  }
}

/** POST for local/manual triggering */
export async function POST(req) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await dispatchDue();
    return NextResponse.json(result);
  } catch (e) {
    console.error("Manual dispatch error:", e);
    return NextResponse.json({ error: "Dispatch failed" }, { status: 500 });
  }
}
