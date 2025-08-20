// src/app/interview/page.js - Main Interview Page
"use client";
import { useState, useEffect } from "react";
import BrandHeader from "@/components/BrandHeader";
import InterviewFlow from "@/components/interview/InterviewFlow";
import SelfViewFloating from "@/components/SelfViewFloating";

export default function InterviewPage() {
  const [interviewData, setInterviewData] = useState({
    questions: [],
    answers: [],
    startTime: null
  });

  const sampleQuestions = [
    "Tell me about yourself and what brings you to this role.",
    "Why are you interested in this position and our company?",
    "Describe a challenging project you've worked on recently.",
    "How do you handle working under pressure and tight deadlines?",
    "Where do you see yourself in 5 years?"
  ];

  useEffect(() => {
    setInterviewData(prev => ({
      ...prev,
      questions: sampleQuestions,
      startTime: new Date().toISOString()
    }));
  }, []);

  const handleInterviewComplete = (answers) => {
    setInterviewData(prev => ({
      ...prev,
      answers
    }));
    // Redirect to results or show completion
    console.log("Interview completed:", { questions: interviewData.questions, answers });
  };

  return (
    <>
      <BrandHeader />
      <SelfViewFloating />
      
      <main className="min-h-screen pt-12 bg-gradient-to-br from-[#0f0f1a] via-[#1a1a2e] to-[#16213e]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <InterviewFlow 
            questions={interviewData.questions}
            onComplete={handleInterviewComplete}
          />
        </div>
      </main>
    </>
  );
}