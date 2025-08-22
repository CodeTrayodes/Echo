// src/app/api/v1/assessments/[assessmentId]/report/route.js
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateAssessmentReport } from '@/lib/openai';
import { createResponse, createErrorResponse, APIError } from '@/lib/utils';

export async function GET(request, context) {
  try {
    const { assessmentId } = await context.params;   // ← await params

    // 1) Fetch assessment (must be completed)
    const { data: assessment, error: assessmentError } = await supabaseAdmin
      .from('assessments')
      .select('*')
      .eq('id', assessmentId)
      .eq('status', 'completed')
      .single();

    if (assessmentError || !assessment) {
      throw new APIError('Assessment not found or not completed', 404, 'NOT_FOUND');
    }

    // 2) Return cached report if present
    const { data: existingReport } = await supabaseAdmin
      .from('assessment_reports')
      .select('*')
      .eq('assessment_id', assessmentId)
      .maybeSingle(); // avoids throw if none

    if (existingReport) {
      return createResponse({
        success: true,
        assessment_id: assessmentId,
        report: {
          overall_score: existingReport.overall_score,
          strengths: existingReport.strengths,
          weaknesses: existingReport.weaknesses,
          recommendations: existingReport.recommendations,
          detailed_feedback: existingReport.detailed_feedback,
          generated_at: existingReport.generated_at
        },
        assessment_info: {
          role_name: assessment.role_name,
          company_name: assessment.company_name,
          completed_at: assessment.completed_at
        }
      });
    }

    // 3) Pull responses (ordered)
    const { data: responses, error: responsesError } = await supabaseAdmin
      .from('assessment_responses')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('question_index', { ascending: true });

    if (responsesError) {
      throw new APIError('Failed to retrieve responses', 500, 'DATABASE_ERROR');
    }

    // 4) Generate report via LLM
    const reportData = await generateAssessmentReport({
      questions: assessment.questions,
      responses,
      roleName: assessment.role_name,
      companyName: assessment.company_name
    });

    // 5) Persist
    const { data: newReport, error: reportError } = await supabaseAdmin
      .from('assessment_reports')
      .insert({
        assessment_id: assessmentId,
        overall_score: reportData.overall_score,
        strengths: reportData.strengths,
        weaknesses: reportData.weaknesses,
        recommendations: reportData.recommendations,
        detailed_feedback: reportData
      })
      .select()
      .single();

    if (reportError) {
      throw new APIError('Failed to save report', 500, 'DATABASE_ERROR');
    }

    return createResponse({
      success: true,
      assessment_id: assessmentId,
      report: {
        overall_score: newReport.overall_score,
        strengths: newReport.strengths,
        weaknesses: newReport.weaknesses,
        recommendations: newReport.recommendations,
        detailed_feedback: newReport.detailed_feedback,
        generated_at: newReport.generated_at
      },
      assessment_info: {
        role_name: assessment.role_name,
        company_name: assessment.company_name,
        completed_at: assessment.completed_at
      }
    });
  } catch (error) {
    console.error('Get report error:', error);
    if (error instanceof APIError) {
      return createErrorResponse(error, error.statusCode);
    }
    return createErrorResponse(new APIError('Failed to generate report', 500, 'INTERNAL_ERROR'));
  }
}
