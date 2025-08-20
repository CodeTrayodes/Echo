/ src/app/api/submit-interview/route.js (Updated)
import { NextResponse } from "next/server";
import { getInterviewReport } from "@/lib/openai";

export async function POST(req) {
  try {
    const { qaBundle, warmupData } = await req.json();
    
    const fullData = {
      warmupResponses: warmupData,
      interviewQuestionsAndAnswers: qaBundle
    };
    
    const report = await getInterviewReport(fullData);
    
    return NextResponse.json({ 
      report,
      timestamp: new Date().toISOString(),
      summary: {
        questionsAnswered: qaBundle.answers.filter(a => a.trim().length > 0).length,
        totalQuestions: qaBundle.questions.length,
        averageResponseLength: Math.round(
          qaBundle.answers.reduce((acc, answer) => acc + answer.split(' ').length, 0) / qaBundle.answers.length
        )
      }
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate interview report" }, 
      { status: 500 }
    );
  }
}