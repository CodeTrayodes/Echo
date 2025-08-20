// src/app/api/stt/route.js - Cost-effective STT
import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("file");

    if (!audioFile) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const response = await client.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1", // Most cost-effective STT model
    });

    return NextResponse.json({ text: response.text });
  } catch (err) {
    console.error("STT error:", err);
    return NextResponse.json({ error: "STT failed" }, { status: 500 });
  }
}