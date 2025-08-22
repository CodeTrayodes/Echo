import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const { text, speed } = await req.json();

    // Preferred: cheaper + great quality
    const tryModel = async (voice) => client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice,                 // "nova" preferred; falls back to "alloy"
      input: text,
      speed: typeof speed === "number" ? speed : 1, // a touch slower, human pace
      format: "mp3",
    });

    let response;
    try {
      response = await tryModel("nova");   // friendly “nova” voice
    } catch (e) {
      console.warn("TTS with 'nova' failed, falling back to 'alloy':", e?.message);
      response = await tryModel("alloy");  // safe fallback
    }

    const arrayBuffer = await response.arrayBuffer();
    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=1800"
      }
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json({ error: "TTS failed" }, { status: 500 });
  }
}
