// src/app/api/v1/assessments/create/route.js - UPDATED to use admin client
import { supabaseAdmin } from '@/lib/supabase-admin'; // Changed this line
import { generateInterviewQuestions } from '@/lib/openai';
import { createResponse, createErrorResponse, validateRequestBody, APIError } from '@/lib/utils';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    validateRequestBody(body, ['user_id', 'company_name', 'job_description', 'role_name']);
    
    const { user_id, company_name, job_description, role_name } = body;
    
    // Generate interview questions
    const questions = await generateInterviewQuestions(job_description, role_name, company_name);
    
    // Create assessment record using admin client
    const { data: assessment, error } = await supabaseAdmin
      .from('assessments')
      .insert({
        user_id,
        company_name,
        job_description,
        role_name,
        questions,
        status: 'created'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Database error:', error);
      throw new APIError('Failed to create assessment', 500, 'DATABASE_ERROR');
    }
    
    // Generate interview URL
    const interviewUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/interview/${assessment.id}`;
    
    return createResponse({
      success: true,
      assessment_id: assessment.id,
      interview_url: interviewUrl,
      questions_generated: questions.length,
      expires_at: assessment.expires_at,
      estimated_duration: '15-20 minutes'
    }, 201);
    
  } catch (error) {
    console.error('Create assessment error:', error);
    
    if (error instanceof APIError) {
      return createErrorResponse(error, error.statusCode);
    }
    
    return createErrorResponse(
      new APIError('Failed to create assessment', 500, 'INTERNAL_ERROR')
    );
  }
}

export async function OPTIONS() {
  return createResponse({}, 200);
}