import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import crypto from "crypto";

export async function POST(req) {
  try {
    const { client_id, url, events } = await req.json();
    if (!client_id || !url) {
      return NextResponse.json({ error: "client_id and url required" }, { status: 400 });
    }

    const secret = crypto.randomBytes(32).toString("hex"); // show once

    const { data, error } = await supabaseAdmin
      .from("webhook_endpoints")
      .insert({
        client_id,
        url,
        events: Array.isArray(events) && events.length ? events : ["assessment.completed"],
        secret
      })
      .select("id, client_id, url, events, created_at")
      .single();

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "Failed to register endpoint" }, { status: 500 });
    }

    return NextResponse.json({ endpoint: data, secret });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to register endpoint" }, { status: 500 });
  }
}
