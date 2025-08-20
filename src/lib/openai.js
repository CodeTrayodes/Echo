import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getInterviewQuestions(jobDescription, role) {
  const prompt = `You are an experienced recruiter preparing interview questions for a ${role} position.

Job Description: ${jobDescription}

Generate 8-10 realistic, thoughtful interview questions that would be asked in a real interview. Include:
- 2-3 behavioral questions (using STAR method)
- 2-3 situational questions
- 2-3 role-specific technical/competency questions
- 1-2 company culture fit questions

Make questions conversational and realistic. Avoid overly complex or theoretical questions.

Format as a simple list, one question per line.`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: prompt }],
    temperature: 0.7,
    max_tokens: 800
  });

  return response.choices[0].message.content;
}

export async function getInterviewReport(interviewData) {
  const prompt = `You are an expert interview coach analyzing a mock interview session. Provide comprehensive, actionable feedback.

INTERVIEW DATA:
${JSON.stringify(interviewData, null, 2)}

Provide a detailed analysis including:

## OVERALL ASSESSMENT
- Interview readiness score (1-100) with justification
- Top 3 strengths demonstrated
- Top 3 areas needing improvement

## DETAILED FEEDBACK
- Communication style and clarity
- Use of examples and storytelling
- Technical competency demonstration
- Cultural fit indicators

## QUESTION-BY-QUESTION ANALYSIS
- Brief feedback on each response
- Missed opportunities
- Strong moments

## IMPROVEMENT RECOMMENDATIONS
- Specific practice areas
- Example frameworks to use (STAR, etc.)
- Suggested talking points for next interviews

## NEXT STEPS
- Immediate action items
- Long-term skill development
- Resources or practice areas

Be encouraging but honest. Focus on specific, actionable improvements. Write in a professional but warm tone.`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: prompt }],
    temperature: 0.3,
    max_tokens: 1500
  });

  return response.choices[0].message.content;
}