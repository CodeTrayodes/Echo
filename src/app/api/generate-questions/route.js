// src/app/api/generate-questions/route.js
import { NextResponse } from "next/server";
import { getInterviewQuestions } from "@/lib/openai";

export async function POST(req) {
  try {
    const { jobDescription, role } = await req.json();
    const questions = await getInterviewQuestions(jobDescription, role);
    return NextResponse.json({ questions });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
  }
}
