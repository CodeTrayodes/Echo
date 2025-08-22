// src/lib/openai.js - Enhanced question generation for 30-minute interview
import OpenAI from "openai";

const client = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export async function generateInterviewQuestions(jobDescription, roleName, companyName) {
  const prompt = `You are conducting a comprehensive 30-minute interview for a ${roleName} position at ${companyName}.

Job Description:
${jobDescription}

Generate exactly 12 professional interview questions in this specific order:

INTRODUCTION (2 questions - 4 minutes total):
1. A "tell me about yourself" type question
2. A "why this role/company" type question

BEHAVIORAL (3 questions - 9 minutes total):
3-5. Questions about past experiences using STAR method (Situation, Task, Action, Result)

SITUATIONAL (3 questions - 9 minutes total):
6-8. Hypothetical scenarios relevant to the role

ROLE-SPECIFIC (4 questions - 12 minutes total):
9-12. Technical/business questions directly related to the job description and required skills

Make each question:
- Conversational and natural
- Appropriate for the job level (Eg. Entry, Mid, Senior)
- Directly relevant to the role requirements
- 1-2 sentences maximum

Format as a numbered list:
1. [Introduction question]
2. [Introduction question]
3. [Behavioral question]
...
12. [Role-specific question]`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: prompt }],
    temperature: 0.7,
    max_tokens: 1200
  });

  const questionsText = response.choices[0].message.content;
  
  // Parse questions from numbered list
  const questions = questionsText
    .split('\n')
    .filter(line => /^\d+\./.test(line.trim()))
    .map(line => line.replace(/^\d+\.\s*/, '').trim())
    .filter(q => q.length > 10)
    .slice(0, 12); // Ensure exactly 12 questions

  if (questions.length !== 12) {
    throw new Error('Failed to generate exactly 12 questions');
  }

  return questions;
}

export async function generateAssessmentReport({ questions = [], responses = [], roleName, companyName }) {
  // Normalize answers in order (response_text by question_index)
  const answers = [];
  for (let i = 0; i < questions.length; i++) {
    const r = responses.find(x => x.question_index === i);
    answers.push((r?.response_text || "").trim());
  }

  const system = `You are an expert interview coach. Output ONLY JSON with this shape:
{
 "overall_score": number(0-100),
 "strengths": string[],
 "weaknesses": string[],
 "recommendations": string[],
 "detailed_feedback": {
   "summary": string,
   "per_question": [{"index": number, "q": string, "a": string, "feedback": string, "score": number(0-10)}]
 }
}
Keep it practical, specific, and kind. Score fairly for ${roleName} at ${companyName}.`;

  const user = `Evaluate the candidate.
Q&A:
${questions.map((q, i) => `Q${i+1}: ${q}\nA${i+1}: ${answers[i]}`).join("\n\n")}`;

  // Cheap + good JSON: gpt-5-nano
  const res = await client.chat.completions.create({
    model: "gpt-5-nano",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ]
  });

  const json = JSON.parse(res.choices?.[0]?.message?.content || "{}");

  // Minimal validation
  return {
    overall_score: Math.max(0, Math.min(100, Number(json.overall_score ?? 0))),
    strengths: Array.isArray(json.strengths) ? json.strengths : [],
    weaknesses: Array.isArray(json.weaknesses) ? json.weaknesses : [],
    recommendations: Array.isArray(json.recommendations) ? json.recommendations : [],
    detailed_feedback: json.detailed_feedback || {
      summary: "",
      per_question: questions.map((q, i) => ({
        index: i, q, a: answers[i] || "", feedback: "", score: 0
      }))
    }
  };
}