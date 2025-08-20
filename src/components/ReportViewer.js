// src/components/ReportViewer.js
"use client";
import { useEffect, useState } from "react";

export default function ReportViewer({ questions, answers }) {
  const [report, setReport] = useState(null);

  useEffect(() => {
    async function fetchReport() {
      const res = await fetch("/api/submit-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qaBundle: { questions, answers } }),
      });
      const data = await res.json();
      setReport(data.report);
    }
    fetchReport();
  }, [questions, answers]);

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-gray-500 animate-pulse">⏳ Generating your report...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-card p-6 space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Your Interview Report</h2>
      <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
        {report}
      </div>
    </div>
  );
}
