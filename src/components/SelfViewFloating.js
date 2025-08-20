"use client";
import { useEffect, useRef, useState, useCallback } from "react";

export default function SelfViewFloating() {
  const streamRef = useRef(null);
  const [videoEl, setVideoEl] = useState(null);     // ← callback ref target
  const [hasStream, setHasStream] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState(false);

  // 1) Request camera once
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 },
          },
          audio: false,
        });
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        setHasStream(true);       // ← reactive flag so attach effect runs
        setError(false);
      } catch (e) {
        console.error("Camera error:", e);
        setError(true);
      }
    })();
    return () => {
      mounted = false;
      try { streamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
    };
  }, []);

  // 2) Attach stream whenever we have BOTH: a node and a stream
  const attach = useCallback(() => {
    if (!videoEl || !streamRef.current) return;
    const v = videoEl;
    const s = streamRef.current;

    if (v.srcObject !== s) v.srcObject = s;

    const playSafely = () => {
      v.play()
        .then(() => setCameraReady(true))
        .catch(err => {
          // Autoplay shouldn’t be blocked because muted=true, but retry once.
          setTimeout(() => v.play().catch(() => {}), 120);
        });
    };

    if (v.readyState >= 2) playSafely();
    else v.onloadedmetadata = playSafely;

    // cleanup handler to avoid leaking the listener if node remounts
    return () => { v.onloadedmetadata = null; };
  }, [videoEl, hasStream]);

  useEffect(() => {
    const cleanup = attach();
    return cleanup;
  }, [attach]);

  if (!isVisible) return null;

  const boxSize = isMinimized ? "w-32 h-20" : "w-48 h-32";

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 transition-transform duration-300 ${
        isMinimized ? "scale-75" : "scale-100"
      }`}
    >
      <div className="rounded-lg overflow-hidden shadow-xl border border-white/10 bg-black/60 backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-black/30">
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/60" />
            <span className="text-xs text-white/80 font-medium">You</span>
            {cameraReady && !error && (
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
                <span className="text-[11px] text-red-300">Live</span>
              </span>
            )}
          </div>
          <div className="flex items-center">
            <button
              onClick={() => setIsMinimized(v => !v)}
              className="p-1 rounded hover:bg-white/10 transition-colors"
              title={isMinimized ? "Restore" : "Minimize"}
            >
              <svg className="w-3 h-3 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 rounded hover:bg-white/10 transition-colors"
              title="Hide"
            >
              <svg className="w-3 h-3 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Video (always rendered) */}
        <div className={`relative ${boxSize} bg-black/70`}>
          <video
            ref={node => setVideoEl(node)}     // ← callback ref (reactive)
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {error && (
            <div className="absolute inset-0 grid place-items-center">
              <p className="text-xs text-white/70">Camera unavailable</p>
            </div>
          )}
          {!cameraReady && !error && (
            <div className="absolute inset-0 grid place-items-center">
              <div className="w-4 h-4 border-2 border-white/25 border-t-white/70 rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {!isMinimized && (
        <button
          onClick={() => setIsVisible(false)}
          className="mt-2 text-xs text-white/45 hover:text-white/80 transition-colors block ml-auto"
        >
          Hide preview
        </button>
      )}
    </div>
  );
}
