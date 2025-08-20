import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const { text } = await req.json();

    const response = await client.audio.speech.create({
      model: "tts-1",
      voice: "alloy", // Professional British-sounding voice
      input: text,
      speed: 1.0, // Normal pace (fixed from slow)
    });

    const arrayBuffer = await response.arrayBuffer();
    return new NextResponse(arrayBuffer, {
      headers: { 
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=1800" // 30 min cache
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json({ error: "TTS failed" }, { status: 500 });
  }
}