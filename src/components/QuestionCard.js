"use client";
import { useEffect, useRef, useState } from "react";
import Timer from "./Timer";
import useRecorder from "@/hooks/useRecorder";
import useLiveSTT from "@/hooks/useLiveSTT";
import { speakTTS, stopTTS } from "@/lib/ttsController";

export default function QuestionCard({
  question,
  questionIndex,
  onSubmit,
  maxDuration = 180,
}) {
  const [mode, setMode] = useState("speak"); // 'speak' | 'write'
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [editableText, setEditableText] = useState("");
  const [hasStartedAnswering, setHasStartedAnswering] = useState(false);

  const { isRecording, audioURL, startRecording, stopRecording } =
    useRecorder();
  const {
    supported: liveOk,
    listening,
    finalText,
    interimText,
    start,
    stop,
    setFinalText,
  } = useLiveSTT();

  // Reset per question
  useEffect(() => {
    setFinalText("");
    setEditableText("");
    setHasStartedAnswering(false);
    setTimerRunning(false);
    stop();
    if (isRecording) stopRecording();
    // speak will run in the effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionIndex]);

  // Speak once per question (protected against Strict Mode / re-renders)
  useEffect(() => {
    if (!question) return;
    let cancelled = false;
    const key = `${questionIndex}:${question}`;
    (async () => {
      try {
        setTtsPlaying(true);
        await speakTTS(question, { key, rate: 0.9 }); // calm voice
      } catch (e) {
        console.error("TTS error:", e);
      } finally {
        if (!cancelled) setTtsPlaying(false);
      }
    })();
    return () => {
      cancelled = true;
      stopTTS();
    };
  }, [question, questionIndex]);

  async function startAnswer() {
    setHasStartedAnswering(true);
    setTimerRunning(true);
    if (mode === "speak") {
      startRecording();
      if (liveOk) start();
    }
  }

  async function finishAndSave(auto = false) {
    setTimerRunning(false);
    if (mode === "speak") {
      stopRecording();
      stop();
    }

    let text =
      mode === "write"
        ? (editableText || "").trim()
        : (finalText + " " + interimText).trim();

    // Fallback: if we recorded but have no text, call STT server-side
    if (!text && audioURL && mode === "speak") {
      try {
        const blob = await fetch(audioURL).then((r) => r.blob());
        const form = new FormData();
        form.append("file", blob, "answer.webm");
        const res = await fetch("/api/stt", { method: "POST", body: form });
        const data = await res.json();
        text = (data.text || "").trim();
      } catch (err) {
        console.error("Fallback STT failed:", err);
      }
    }

    onSubmit(text || "", { auto }); // ensure string
  }

  const disableAll = ttsPlaying; // lock UI while interviewer speaks
  const canStart = !disableAll && !hasStartedAnswering; // Start button enabled only after TTS
  const canSave =
    !disableAll &&
    hasStartedAnswering &&
    (mode === "write" || (mode === "speak" && listening));

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h2 className="text-lg font-medium leading-relaxed mb-2">
            {question}
          </h2>
          {ttsPlaying && (
            <div className="flex items-center gap-2 text-xs text-white/60">
              <span className="inline-block h-2 w-2 rounded-full bg-[#8b5cf6] animate-pulse" />
              <span>Interviewer speaking…</span>
            </div>
          )}
        </div>
        <Timer
          running={timerRunning}
          duration={maxDuration}
          onEnd={() => finishAndSave(true)}
        />
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-lg p-1 bg-white/5 border border-white/10 mb-6 w-fit">
        <button
          className={`px-3 py-1.5 text-xs rounded ${
            mode === "speak"
              ? "bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white font-medium"
              : "text-white/70"
          }`}
          onClick={() => setMode("speak")}
          disabled={disableAll || listening}
        >
          Speak
        </button>
        <button
          className={`px-3 py-1.5 text-xs rounded ${
            mode === "write"
              ? "bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white font-medium"
              : "text-white/70"
          }`}
          onClick={() => setMode("write")}
          disabled={disableAll || listening}
        >
          Type
        </button>
      </div>

      {/* Response area */}
      <div className="space-y-4">
        {mode === "speak" ? (
          <>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 min-h-[120px] relative">
              {listening && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-xs text-red-300 font-medium">
                    Recording
                  </span>
                </div>
              )}
              <div className="text-sm text-white/90 leading-relaxed">
                {finalText}
              </div>
              {interimText && (
                <div className="text-sm text-white/45 italic mt-1">
                  {interimText}
                </div>
              )}
              {!finalText && !interimText && (
                <div className="text-sm text-white/35 italic">
                  Your transcript will appear here as you speak…
                </div>
              )}
            </div>

            {!listening && (finalText || interimText) && (
              <textarea
                className="w-full rounded-lg bg-white/5 border border-white/10 p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/60 resize-none min-h-[80px]"
                placeholder="Edit your response before saving…"
                value={editableText || finalText + " " + interimText}
                onChange={(e) => setEditableText(e.target.value)}
              />
            )}
          </>
        ) : (
          <textarea
            className="w-full rounded-lg bg-white/5 border border-white/10 p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/60 min-h-[140px]"
            placeholder="Type your answer here…"
            value={editableText}
            onChange={(e) => setEditableText(e.target.value)}
          />
        )}

        {/* Controls */}
        <div className="flex gap-3">
          {!hasStartedAnswering ? (
            <button
              onClick={startAnswer}
              // If speaking, we fully disable click + show greyed style.
              disabled={!canStart}
              className={
                canStart
                  ? "btn-primary flex-1"
                  : "flex-1 rounded-xl px-5 py-3 font-semibold bg-white/10 text-white/50 cursor-not-allowed"
              }
              title={
                disableAll ? "Please wait for the question to finish." : ""
              }
            >
              {ttsPlaying ? "AI Speaking…" : "Start Your Answer (3 min)"}
            </button>
          ) : (
            <button
              onClick={() => finishAndSave(false)}
              disabled={!canSave}
              className={
                canSave
                  ? "btn-primary flex-1"
                  : "flex-1 rounded-xl px-5 py-3 font-semibold bg-white/10 text-white/50 cursor-not-allowed"
              }
              title={
                disableAll ? "Please wait for the question to finish." : ""
              }
            >
              Save & Continue
            </button>
          )}

          <button
            onClick={() => finishAndSave(false)}
            disabled={disableAll}
            className={
              disableAll
                ? "rounded-xl px-4 py-3 bg-white/10 text-white/50 cursor-not-allowed"
                : "btn-secondary"
            }
            title={disableAll ? "Please wait for the question to finish." : ""}
          >
            Skip
          </button>
        </div>

        <p className="text-xs text-white/45">
          • Buttons are disabled while the interviewer is speaking. • If time
          runs out, your response is saved automatically.
        </p>
      </div>
    </div>
  );
}
