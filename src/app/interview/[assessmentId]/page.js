// src/app/interview/[assessmentId]/page.js - Updated with setup flow
"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import BrandHeader from "@/components/BrandHeader";
import CameraTest from "@/components/CameraTest";
import InterviewFlow from "@/components/interview/InterviewFlow";
import SelfViewFloating from "@/components/SelfViewFloating";
import { supabase } from "../../../lib/supabase";

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState("setup"); // setup -> interview -> completed

  useEffect(() => {
    loadAssessment();
  }, [params.assessmentId]);

  const returnUrl =
    process.env.NEXT_PUBLIC_RETURN_URL || "https://pathaide.com/interview";

  function closeWindowSafely() {
    // Try to close (works if the tab was opened by script/window.open)
    window.close();

    // If still open after a tick, redirect as fallback
    setTimeout(() => {
      if (!document.hidden) {
        window.location.href = returnUrl;
      }
    }, 150);
  }

  const loadAssessment = async () => {
    try {
      const { data, error } = await supabase
        .from("assessments")
        .select("*")
        .eq("id", params.assessmentId)
        .single();

      if (error || !data) {
        console.error("Assessment fetch error:", error);
        throw new Error("Assessment not found or expired");
      }

      // Check if assessment is expired
      if (new Date(data.expires_at) < new Date()) {
        throw new Error("Assessment has expired");
      }

      // If already completed, show completion message
      if (data.status === "completed") {
        setCurrentStep("completed");
        setAssessment(data);
        setLoading(false);
        return;
      }

      setAssessment(data);
    } catch (err) {
      console.error("Load assessment error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupComplete = async () => {
    try {
      // Update status to in_progress when setup is complete
      const { error } = await supabase
        .from("assessments")
        .update({
          status: "in_progress",
          started_at: new Date().toISOString(),
        })
        .eq("id", params.assessmentId);

      if (error) {
        console.error("Status update error:", error);
      }

      setCurrentStep("interview");
    } catch (error) {
      console.error("Setup completion error:", error);
      setCurrentStep("interview"); // Continue anyway
    }
  };

  const handleInterviewComplete = async () => {
    try {
      // Mark assessment as completed
      const { error } = await supabase
        .from("assessments")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", params.assessmentId);

      if (error) {
        console.error("Completion update error:", error);
      }

      setCurrentStep("completed");
    } catch (error) {
      console.error("Failed to complete interview:", error);
      setCurrentStep("completed"); // Show completion anyway
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0f1a] via-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Loading your interview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0f1a] via-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-400 mb-4">
            Interview Unavailable
          </h1>
          <p className="text-white/70 mb-6">{error}</p>
          <button
            onClick={() => window.close()}
            className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <BrandHeader />
      {currentStep !== "setup" && <SelfViewFloating />}

      <main className="min-h-screen pt-12 bg-gradient-to-br from-[#0f0f1a] via-[#1a1a2e] to-[#16213e]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {currentStep === "setup" && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">
                  {assessment.role_name} Interview Setup
                </h1>
                <p className="text-white/60">
                  {assessment.company_name} • 30 minutes •{" "}
                  {assessment.questions.length} questions
                </p>
              </div>

              <CameraTest onSetupComplete={handleSetupComplete} />

              <div className="card p-6 text-center">
                <h3 className="font-medium text-white mb-3">What to expect:</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#ec4899] mx-auto flex items-center justify-center text-white text-xs font-bold">
                      1
                    </div>
                    <p className="text-white/70">
                      Introduction & background questions
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#ec4899] mx-auto flex items-center justify-center text-white text-xs font-bold">
                      2
                    </div>
                    <p className="text-white/70">
                      Behavioral & situational scenarios
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#ec4899] mx-auto flex items-center justify-center text-white text-xs font-bold">
                      3
                    </div>
                    <p className="text-white/70">
                      Role-specific technical questions
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === "interview" && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">
                  {assessment.role_name} Interview
                </h1>
                <p className="text-white/60">
                  {assessment.company_name} • 30-minute interview session
                </p>
              </div>

              <InterviewFlow
                assessmentId={params.assessmentId}
                questions={assessment.questions}
                onComplete={handleInterviewComplete}
              />
            </div>
          )}

          {currentStep === "completed" && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#ec4899] mx-auto flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  Interview Completed!
                </h1>
                <p className="text-white/70 mb-6">
                  Thank you for completing the {assessment.role_name} interview
                  at {assessment.company_name}. Your responses have been saved
                  and will be analyzed.
                </p>
              </div>

              <div className="card p-6 text-left max-w-md mx-auto">
                <h3 className="font-medium text-white mb-3">
                  What happens next:
                </h3>
                <div className="space-y-2 text-sm text-white/70">
                  <p>• Your responses are being analyzed by AI</p>
                  <p>• You'll receive detailed feedback within minutes</p>
                  <p>• Check your PathAIde dashboard for the full report</p>
                </div>
              </div>

              <button
                onClick={closeWindowSafely}
                className="rounded-xl px-6 py-3 font-semibold bg-white/10 hover:bg-white/15 transition-colors text-white"
              >
                Close Interview Window
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
