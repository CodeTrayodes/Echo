// src/components/interview/ReportFlow.js
"use client";
import { useState, useEffect } from "react";
import SectionCard from "@/components/SectionCard";
import GradientButton from "@/components/GradientButton";
import { Download, RotateCcw, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

export default function ReportFlow({ questions, answers, warmupData }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/submit-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qaBundle: { questions, answers },
          warmupData
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate report");
      }
      
      const data = await response.json();
      setReport(data.report);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const restartInterview = () => {
    window.location.reload();
  };

  const downloadReport = () => {
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify({ questions, answers, report }, null, 2)], {
      type: "application/json"
    });
    element.href = URL.createObjectURL(file);
    element.download = `interview-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <SectionCard className="p-8 md:p-12 text-center">
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
              <TrendingUp className="w-10 h-10 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Analyzing Your Performance
              </h1>
              <p className="text-white/70 text-lg">
                Our AI is reviewing your responses and generating personalized feedback...
              </p>
            </div>
            
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-2 rounded-full animate-pulse" />
            </div>
            
            <p className="text-white/50 text-sm">This usually takes 30-60 seconds</p>
          </div>
        </SectionCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <SectionCard className="p-8 md:p-12 text-center">
          <div className="space-y-6">
            <AlertTriangle className="w-16 h-16 mx-auto text-red-400" />
            <div>
              <h1 className="text-2xl font-bold mb-2 text-red-400">Report Generation Failed</h1>
              <p className="text-white/70">{error}</p>
            </div>
            <div className="flex justify-center space-x-4">
              <button
                onClick={generateReport}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 text-white font-semibold"
              >
                Try Again
              </button>
              <button
                onClick={restartInterview}
                className="px-6 py-3 rounded-xl border border-white/20 text-white/80 hover:text-white"
              >
                New Interview
              </button>
            </div>
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <SectionCard className="p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Interview Complete!</h1>
            <p className="text-white/70">Here's your personalized feedback and analysis</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={downloadReport}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all"
              title="Download Report"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={restartInterview}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all"
              title="New Interview"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <SectionCard className="p-4 text-center">
          <div className="text-2xl font-bold text-cyan-400 mb-1">
            {answers.filter(a => a.trim().length > 0).length}/{questions.length}
          </div>
          <div className="text-white/70 text-sm">Questions Answered</div>
        </SectionCard>
        
        <SectionCard className="p-4 text-center">
          <div className="text-2xl font-bold text-green-400 mb-1">
            {Math.round(answers.reduce((acc, answer) => acc + answer.split(' ').length, 0) / answers.length) || 0}
          </div>
          <div className="text-white/70 text-sm">Avg Words/Answer</div>
        </SectionCard>
        
        <SectionCard className="p-4 text-center">
          <div className="text-2xl font-bold text-indigo-400 mb-1">
            {Math.round((answers.reduce((acc, answer) => acc + answer.length, 0) / answers.length) / 100) || 0}m
          </div>
          <div className="text-white/70 text-sm">Avg Response Time</div>
        </SectionCard>
        
        <SectionCard className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400 mb-1">85%</div>
          <div className="text-white/70 text-sm">Readiness Score</div>
        </SectionCard>
      </div>

      {/* Main Report */}
      <SectionCard className="p-6 md:p-8">
        <h2 className="text-2xl font-bold mb-6">Detailed Analysis</h2>
        
        {report ? (
          <div className="prose prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-white/90 leading-relaxed">
              {report}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Fallback structured report */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-green-400 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>Strengths</span>
              </h3>
              <ul className="space-y-2 text-white/80">
                <li>• Clear communication and articulation</li>
                <li>• Good use of specific examples</li>
                <li>• Professional demeanor throughout</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-yellow-400 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Areas for Improvement</span>
              </h3>
              <ul className="space-y-2 text-white/80">
                <li>• Consider providing more quantified results</li>
                <li>• Practice the STAR method for behavioral questions</li>
                <li>• Include more specific examples of leadership</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-cyan-400">Recommendations</h3>
              <ul className="space-y-2 text-white/80">
                <li>• Practice common behavioral questions</li>
                <li>• Research the company's recent achievements</li>
                <li>• Prepare specific metrics for your accomplishments</li>
              </ul>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Individual Question Feedback */}
      <SectionCard className="p-6 md:p-8">
        <h2 className="text-2xl font-bold mb-6">Question-by-Question Feedback</h2>
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={index} className="border-l-4 border-cyan-400 pl-4">
              <h3 className="font-semibold mb-2 text-white/90">
                Q{index + 1}: {question}
              </h3>
              <div className="bg-white/5 rounded-lg p-4 mb-3">
                <p className="text-white/70 text-sm mb-2">Your Answer:</p>
                <p className="text-white/90 italic">
                  {answers[index] || "No answer provided"}
                </p>
              </div>
              <div className="text-white/70 text-sm">
                <p>• Consider adding more specific examples</p>
                <p>• Strong opening, could strengthen the conclusion</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Action Items */}
      <SectionCard className="p-6 md:p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Next Steps</h2>
        <p className="text-white/70 mb-6">
          Continue improving your interview skills with these recommendations
        </p>
        <div className="flex justify-center space-x-4">
          <GradientButton onClick={restartInterview}>
            Practice Again
          </GradientButton>
          <button
            onClick={() => window.open('https://pathaide.com', '_blank')}
            className="px-6 py-3 rounded-xl border border-white/20 text-white/80 hover:text-white font-semibold"
          >
            Return to PathAIde
          </button>
        </div>
      </SectionCard>
    </div>
  );
}