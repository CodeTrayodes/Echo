"use client";
import { useEffect, useMemo, useState } from "react";
import QuestionCard from "@/components/QuestionCard";
import { supabase } from "../../lib/supabase";

export default function InterviewFlow({
  assessmentId,
  questions = [],
  onComplete,
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(null); // ← null until hydrated
  const [responses, setResponses] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [interviewStartTime] = useState(new Date());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    loadExistingResponses(); /* eslint-disable-next-line */
  }, [assessmentId]);

  async function loadExistingResponses() {
    try {
      const { data, error } = await supabase
        .from("assessment_responses")
        .select("*")
        .eq("assessment_id", assessmentId)
        .order("question_index");

      if (!error && data) {
        setResponses(data);
        const idx = Math.min(data.length, questions.length); // clamp
        setIsCompleted(idx >= questions.length);
        setCurrentQuestionIndex(
          idx >= questions.length ? questions.length : idx
        );
      } else {
        setCurrentQuestionIndex(0);
      }
    } catch (e) {
      console.error("Failed to load existing responses:", e);
      setCurrentQuestionIndex(0);
    } finally {
      setHydrated(true);
    }
  }

  async function handleAnswerSubmit(answerText) {
    if (
      isCompleted ||
      currentQuestionIndex == null ||
      currentQuestionIndex >= questions.length
    )
      return;

    try {
      const response = {
        assessment_id: assessmentId,
        question_index: currentQuestionIndex,
        question_text: questions[currentQuestionIndex],
        response_text: (answerText || "").trim(),
        response_duration: Math.floor((new Date() - interviewStartTime) / 1000),
      };

      const { error } = await supabase
        .from("assessment_responses")
        .insert(response);
      if (error) throw error;

      const newResponses = [...responses, response];
      setResponses(newResponses);

      const nextIdx = currentQuestionIndex + 1;
      if (nextIdx >= questions.length) {
        setIsCompleted(true);
        setCurrentQuestionIndex(questions.length); // clamp
        onComplete();
      } else {
        setCurrentQuestionIndex(nextIdx);
      }
    } catch (e) {
      console.error("Failed to submit answer:", e);
      alert("Failed to save your answer. Please try again.");
    }
  }

  // Loading/hydrating state to avoid speaking Q1 by accident
  if (!hydrated || currentQuestionIndex == null) {
    return (
      <div className="card p-6 text-white/70">Preparing your interview…</div>
    );
  }

  if (isCompleted || currentQuestionIndex >= questions.length) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#ec4899] mx-auto flex items-center justify-center">
          <svg
            className="w-8 h-8 text-white"
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
        <h2 className="text-xl font-bold text-white">Interview Complete!</h2>
        <p className="text-white/70">Processing your responses...</p>
      </div>
    );
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // … keep your header/progress UI as-is …

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-lg font-medium text-white">
                30-Minute Interview
              </h2>
            </div>
            <p className="text-sm text-white/60">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>
        </div>
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Current Question */}
      <QuestionCard
        question={questions[currentQuestionIndex]}
        questionIndex={currentQuestionIndex}
        onSubmit={handleAnswerSubmit}
        maxDuration={180}
      />

      <div className="card p-4">
        <div className="grid md:grid-cols-2 gap-4 text-xs">
          <div className="flex items-center space-x-2 text-white/60">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Use specific examples from your experience</span>
          </div>
          <div className="flex items-center space-x-2 text-white/60">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span>Structure answers with situation, action, result</span>
          </div>
        </div>
      </div>
    </div>
  );
}
