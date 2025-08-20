"use client";
import { useEffect, useRef, useState } from "react";
import Timer from "./Timer";
import useRecorder from "@/hooks/useRecorder";
import useLiveSTT from "@/hooks/useLiveSTT";

export default function QuestionCard({ question, questionIndex, onSubmit }) {
  const [mode, setMode] = useState("speak");
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [editableText, setEditableText] = useState("");
  const [hasStartedAnswering, setHasStartedAnswering] = useState(false);
  const [hasTTSPlayed, setHasTTSPlayed] = useState(false); // Fix double-speaking

  const { isRecording, audioURL, startRecording, stopRecording } = useRecorder();
  const { supported: liveOk, listening, finalText, interimText, start, stop, setFinalText } = useLiveSTT();

  const audioRef = useRef({ ctx: null, src: null });

  // Clear state when question changes
  useEffect(() => {
    setFinalText("");
    setEditableText("");
    setTimerRunning(false);
    setHasStartedAnswering(false);
    setHasTTSPlayed(false); // Reset TTS flag
    if (listening) stop();
    if (isRecording) stopRecording();
  }, [questionIndex]);

  // TTS for question - Fixed to prevent double-speaking
  useEffect(() => {
    if (!question || hasTTSPlayed) return;
    
    async function speak() {
      // Stop any existing audio
      try { 
        if (audioRef.current.src) {
          audioRef.current.src.stop();
        }
      } catch {}

      setTtsPlaying(true);
      setHasTTSPlayed(true); // Mark as played
      
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: question }),
        });
        
        const buf = await res.arrayBuffer();
        
        if (!audioRef.current.ctx) {
          audioRef.current.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const ctx = audioRef.current.ctx;
        const audioBuf = await ctx.decodeAudioData(buf);
        const src = ctx.createBufferSource();
        src.buffer = audioBuf;
        src.playbackRate.value = 1.0; // Normal pace (fixed from slow)
        src.connect(ctx.destination);
        
        src.onended = () => {
          setTtsPlaying(false);
          audioRef.current.src = null;
        };
        
        audioRef.current.src = src;
        src.start(0);
      } catch (error) {
        console.error("TTS error:", error);
        setTtsPlaying(false);
      }
    }
    
    speak();
  }, [question, questionIndex, hasTTSPlayed]);

  async function startAnswer() {
    setHasStartedAnswering(true);
    setTimerRunning(true);
    if (mode === "speak") {
      startRecording();
      if (liveOk) start();
    }
  }

  async function finishAndSave() {
    setTimerRunning(false);
    if (mode === "speak") { 
      stopRecording(); 
      stop(); 
    }

    let text = mode === "write" ? editableText.trim() : (finalText + " " + interimText).trim();

    if (!text && audioURL && mode === "speak") {
      const blob = await fetch(audioURL).then(r => r.blob());
      const form = new FormData(); 
      form.append("file", blob, "answer.webm");
      const res = await fetch("/api/stt", { method: "POST", body: form });
      const data = await res.json();
      text = data.text || "";
    }

    onSubmit(text);
  }

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h2 className="text-lg font-medium leading-relaxed mb-2">{question}</h2>
          {ttsPlaying && (
            <div className="flex items-center space-x-2 text-xs text-white/50">
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-[#667eea] rounded-full animate-pulse" />
                <div className="w-1 h-1 bg-[#667eea] rounded-full animate-pulse delay-75" />
                <div className="w-1 h-1 bg-[#667eea] rounded-full animate-pulse delay-150" />
              </div>
              <span>Speaking question...</span>
            </div>
          )}
        </div>
        <Timer running={timerRunning} duration={180} onEnd={finishAndSave} />
      </div>

      {/* Mode Toggle */}
      <div className="flex rounded-lg p-1 bg-white/3 border border-white/10 mb-6 w-fit">
        <button
          className={`px-3 py-1.5 text-xs rounded transition-all ${
            mode === "speak" 
              ? "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white font-medium" 
              : "text-white/60 hover:text-white"
          }`}
          onClick={() => setMode("speak")}
          disabled={ttsPlaying || listening}
        >
          Speak
        </button>
        <button
          className={`px-3 py-1.5 text-xs rounded transition-all ${
            mode === "write" 
              ? "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white font-medium" 
              : "text-white/60 hover:text-white"
          }`}
          onClick={() => setMode("write")}
          disabled={ttsPlaying || listening}
        >
          Type
        </button>
      </div>

      {/* Response Area */}
      <div className="space-y-4">
        {mode === "speak" ? (
          <>
            <div className="rounded-lg border border-white/10 bg-white/2 p-4 min-h-[120px] relative">
              {listening && (
                <div className="absolute top-3 right-3 flex items-center space-x-1.5">
                  <div className="status-dot status-live" />
                  <span className="text-xs text-red-400 font-medium">Recording</span>
                </div>
              )}
              
              <div className="text-sm text-white/90 leading-relaxed">
                {finalText}
              </div>
              {interimText && (
                <div className="text-sm text-white/40 italic mt-1">
                  {interimText}
                </div>
              )}
              {!finalText && !interimText && (
                <div className="text-sm text-white/30 italic">
                  Your response will appear here...
                </div>
              )}
            </div>
            
            {!listening && (finalText || interimText) && (
              <textarea
                className="input w-full min-h-[80px] text-sm resize-none"
                placeholder="Edit your response..."
                rows={3}
                value={editableText || (finalText + " " + interimText)}
                onChange={e => setEditableText(e.target.value)}
              />
            )}
          </>
        ) : (
          <textarea
            className="input w-full min-h-[120px] text-sm resize-none"
            placeholder="Type your answer here..."
            value={editableText}
            onChange={e => setEditableText(e.target.value)}
          />
        )}

        {/* Controls */}
        <div className="flex space-x-3">
          {!hasStartedAnswering ? (
            <button 
              onClick={startAnswer} 
              className="btn-primary flex-1"
              disabled={ttsPlaying}
            >
              {ttsPlaying ? 'Speaking...' : 'Start Answer'}
            </button>
          ) : mode === "speak" && listening ? (
            <button 
              onClick={finishAndSave} 
              className="btn flex-1 bg-gradient-to-r from-green-500 to-emerald-400 text-white"
            >
              Save Answer
            </button>
          ) : (
            <button 
              onClick={finishAndSave} 
              className="btn-primary flex-1"
            >
              Save Answer
            </button>
          )}

          <button
            onClick={finishAndSave}
            className="btn-secondary"
            disabled={ttsPlaying}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
