// src/app/api/v1/assessments/user/[userId]/route.js
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createResponse, createErrorResponse, APIError } from '@/lib/utils';

export async function GET(request, { params }) {
  try {
    const { userId } = params;
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    const status = url.searchParams.get('status'); // Filter by status if provided
    
    let query = supabaseAdmin
      .from('assessments')
      .select(`
        id,
        company_name,
        role_name,
        status,
        created_at,
        completed_at,
        assessment_reports!inner(overall_score)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: assessments, error, count } = await query;
    
    if (error) {
      throw new APIError('Failed to retrieve assessments', 500, 'DATABASE_ERROR');
    }
    
    // Transform data for API response
    const transformedAssessments = assessments.map(assessment => ({
      assessment_id: assessment.id,
      company_name: assessment.company_name,
      role_name: assessment.role_name,
      status: assessment.status,
      overall_score: assessment.assessment_reports?.[0]?.overall_score || null,
      created_at: assessment.created_at,
      completed_at: assessment.completed_at,
      report_available: !!assessment.assessment_reports?.[0]
    }));
    
    return createResponse({
      success: true,
      assessments: transformedAssessments,
      pagination: {
        total: count,
        limit,
        offset,
        has_more: (offset + limit) < count
      }
    });
    
  } catch (error) {
    console.error('Get user assessments error:', error);
    
    if (error instanceof APIError) {
      return createErrorResponse(error, error.statusCode);
    }
    
    return createErrorResponse(
      new APIError('Failed to retrieve assessments', 500, 'INTERNAL_ERROR')
    );
  }
}