"use client";
import { useState } from "react";
import QuestionCard from "@/components/QuestionCard";

export default function InterviewFlow({ questions, onComplete }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);

  const handleAnswerSubmit = (answer) => {
    const newAnswers = [...answers, (answer || "").trim()];
    setAnswers(newAnswers);
    
    if (newAnswers.length === questions.length) {
      onComplete(newAnswers);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-medium">Echo Interview</h1>
            <p className="text-xs text-white/50">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index < currentQuestionIndex
                    ? 'bg-green-400'
                    : index === currentQuestionIndex
                    ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2]'
                    : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="progress-container">
          <div
            className="progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current Question */}
      <QuestionCard
        question={questions[currentQuestionIndex]}
        questionIndex={currentQuestionIndex}
        onSubmit={handleAnswerSubmit}
      />

      {/* Tips */}
      <div className="card p-4">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-white/50">
            <div className="w-1.5 h-1.5 rounded-full bg-[#667eea]" />
            <span>Use the STAR method for behavioral questions</span>
          </div>
          <div className="flex items-center space-x-2 text-white/50">
            <div className="w-1.5 h-1.5 rounded-full bg-[#f093fb]" />
            <span>Take your time to think before answering</span>
          </div>
        </div>
      </div>
    </div>
  );
}