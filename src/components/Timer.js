"use client";
import { useEffect, useState } from "react";

export default function Timer({ running = false, duration = 180, onEnd }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  
  useEffect(() => { 
    if (!running) return; 
    setTimeLeft(duration); 
  }, [running, duration]);

  useEffect(() => {
    if (!running) return;
    if (timeLeft <= 0) { 
      onEnd?.(); 
      return; 
    }
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [running, timeLeft, onEnd]);

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