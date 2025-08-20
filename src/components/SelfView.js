// src/components/SelfView.js
"use client";
import { useEffect, useRef, useState } from "react";

export default function SelfView({ className="" }) {
  const videoRef = useRef(null);
  const [ready, setReady] = useState(false);
  const streamRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setReady(true);
      } catch (e) {
        console.error("Camera error:", e);
      }
    })();
    return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  return (
    <div className={`rounded-xl overflow-hidden border border-white/10 bg-black/60 ${className}`}>
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        autoPlay
        playsInline
        muted
      />
      {!ready && (
        <div className="absolute inset-0 grid place-items-center text-white/70 text-sm">
          Allow camera to preview
        </div>
      )}
    </div>
  );
}
