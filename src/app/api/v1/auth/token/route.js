import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { client_id, expires_in } = body; // optional expires_in like "7d", "90d"

    if (!client_id) {
      return NextResponse.json({ error: "client_id required" }, { status: 400 });
    }

    const token = jwt.sign(
      { client_id },
      process.env.JWT_SECRET,
      { expiresIn: expires_in || "30d" }
    );

    return NextResponse.json({ token });
  } catch (err) {
    console.error("Token generation error:", err);
    return NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
  }
}
