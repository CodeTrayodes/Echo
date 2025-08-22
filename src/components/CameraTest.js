// src/components/CameraTest.js - FIXED: Always render video, proper stream attachment
"use client";
import { useState, useRef, useEffect } from "react";

export default function CameraTest({ onSetupComplete }) {
  const [cameraStatus, setCameraStatus] = useState("idle");   // idle | testing | ready | error
  const [micStatus, setMicStatus] = useState("idle");
  const [isReady, setIsReady] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);

  const attachStreamToVideo = () => {
    if (!videoRef.current || !streamRef.current) return;
    const v = videoRef.current;
    v.srcObject = streamRef.current;
    // Ensure playback after metadata is ready (Safari/Chrome quirk)
    const playSafely = () => v.play().catch(() => {});
    if (v.readyState >= 2) playSafely();
    else v.onloadedmetadata = playSafely;
  };

  const testCamera = async () => {
    setCameraStatus("testing");
    try {
      // Request the front camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraStatus("ready");
      // If the video node already exists, attach now; if not, useEffect below will
      attachStreamToVideo();
    } catch (error) {
      console.error("Camera error:", error);
      setCameraStatus("error");
    }
  };

  const testMicrophone = async () => {
    setMicStatus("testing");
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      // Simple level warmup (optional)
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(micStream);
      source.connect(analyser);
      setMicStatus("ready");
      // Cleanup mic preview stream immediately (we're only testing permission/signal)
      micStream.getTracks().forEach(t => t.stop());
      audioCtx.close();
      audioCtxRef.current = null;
    } catch (error) {
      console.error("Microphone access failed:", error);
      setMicStatus("error");
    }
  };

  // When camera becomes "ready" and the <video> just mounted, attach the stream
  useEffect(() => {
    if (cameraStatus === "ready") attachStreamToVideo();
  }, [cameraStatus]);

  // Also re-attach if the video node changes (e.g., modal mount)
  useEffect(() => {
    attachStreamToVideo();
  }, [videoRef.current]);

  // Combined readiness
  useEffect(() => {
    setIsReady(cameraStatus === "ready" && micStatus === "ready");
  }, [cameraStatus, micStatus]);

  // Cleanup
  useEffect(() => {
    return () => {
      try { audioCtxRef.current?.close(); } catch {}
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const getStatusIcon = (status) => {
    const base = "inline-block h-2.5 w-2.5 rounded-full";
    if (status === "ready")   return <span className={`${base} bg-emerald-400`} />;
    if (status === "testing") return <span className={`${base} bg-amber-400 animate-pulse`} />;
    if (status === "error")   return <span className={`${base} bg-red-500`} />;
    return <span className={`${base} bg-white/20`} />;
  };

  return (
    <div className="card p-8">
      <div className="text-center mb-8">
        <h2 className="text-xl font-medium mb-2">Technical Setup</h2>
        <p className="text-sm text-white/60">Ensure your camera and microphone are working properly</p>
      </div>

      <div className="space-y-6">
        {/* Camera Test */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-white/2 border border-white/5">
          <div className="flex items-center space-x-3">
            {getStatusIcon(cameraStatus)}
            <div>
              <div className="text-sm font-medium">Camera</div>
              <div className="text-xs text-white/50">
                {cameraStatus === "idle" && "Click to test camera"}
                {cameraStatus === "testing" && "Testing camera..."}
                {cameraStatus === "ready" && "Camera working perfectly"}
                {cameraStatus === "error" && "Camera access denied"}
              </div>
            </div>
          </div>
          
          {cameraStatus === "idle" && (
            <button onClick={testCamera} className="btn-secondary text-xs">
              Test Camera
            </button>
          )}
        </div>

        {/* Microphone Test */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-white/2 border border-white/5">
          <div className="flex items-center space-x-3">
            {getStatusIcon(micStatus)}
            <div>
              <div className="text-sm font-medium">Microphone</div>
              <div className="text-xs text-white/50">
                {micStatus === "idle" && "Click to test microphone"}
                {micStatus === "testing" && "Testing microphone..."}
                {micStatus === "ready" && "Microphone working perfectly"}
                {micStatus === "error" && "Microphone access denied"}
              </div>
            </div>
          </div>
          
          {micStatus === "idle" && (
            <button onClick={testMicrophone} className="btn-secondary text-xs">
              Test Microphone
            </button>
          )}
        </div>

        {/* Camera Preview - FIXED: Always render when ready */}
        {cameraStatus === "ready" && (
          <div className="rounded-xl overflow-hidden bg-black/50 border border-white/10 relative">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 rounded-full px-2 py-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="text-xs text-red-300 font-medium">Live</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/60 to-transparent">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/90 font-medium">Camera preview</span>
                <span className="text-xs text-emerald-400">Looking good!</span>
              </div>
            </div>
          </div>
        )}

        {/* Interview Guidelines */}
        <div className="card p-4 bg-white/3">
          <h3 className="text-sm font-medium text-white mb-3">Interview Guidelines:</h3>
          <div className="space-y-2 text-xs text-white/60">
            <p>• Find a quiet, well-lit space</p>
            <p>• Look directly at the camera when speaking</p>
            <p>• Speak clearly and at a natural pace</p>
            <p>• Take your time to think before answering</p>
            <p>• You'll have up to 3 minutes per question</p>
          </div>
        </div>

        {/* Start Button */}
        <div className="pt-4">
          {isReady ? (
            <button onClick={onSetupComplete} className="btn-primary w-full text-center">
              Start 30-Minute Interview
            </button>
          ) : (
            <button disabled className="btn w-full bg-white/5 text-white/40 cursor-not-allowed">
              Complete camera and microphone setup to continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}