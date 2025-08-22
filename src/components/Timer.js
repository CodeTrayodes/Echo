// src/components/Timer.js - FIXED: Accurate timing
"use client";
import { useEffect, useState, useRef } from "react";

export default function Timer({ running = false, duration = 180, onEnd }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  // Reset timer when running starts
  useEffect(() => {
    if (running) {
      setTimeLeft(duration);
      startTimeRef.current = Date.now();
    }
  }, [running, duration]);

  // FIXED: Use actual time elapsed instead of simple countdown
  useEffect(() => {
    if (!running) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, duration - elapsed);
      
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        onEnd?.();
      }
    }, 100); // Update every 100ms for smooth countdown

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running, duration, onEnd]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isLow = timeLeft <= 30;

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${
      isLow 
        ? "bg-red-500/10 border-red-400/40 text-red-300" 
        : "bg-white/5 border-white/10 text-white/70"
    }`}>
      <div className={`w-2 h-2 rounded-full ${isLow ? "bg-red-400" : "bg-white/40"}`} />
      <span>{minutes}:{seconds.toString().padStart(2, "0")}</span>
    </div>
  );
}