// src/components/interview/WarmupFlow.js
"use client";
import { useState, useEffect, useRef } from "react";
import SectionCard from "@/components/SectionCard";
import GradientButton from "@/components/GradientButton";
import useLiveSTT from "@/hooks/useLiveSTT";

export default function WarmupFlow({ onComplete }) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [userResponse, setUserResponse] = useState("");
  const [warmupData, setWarmupData] = useState({});
  const [audioPlaying, setAudioPlaying] = useState(false);
  
  const { supported, listening, finalText, interimText, start, stop, setFinalText } = useLiveSTT();
  const audioRef = useRef(null);

  const warmupPhrases = [
    {
      interviewer: "Hello! Welcome to today's interview. I'm really excited to get to know you better. Before we dive into the formal questions, I'd love to hear - how has your day been so far?",
      followUp: "That sounds wonderful! I always find it interesting how our day can set the tone for conversations like these."
    },
    {
      interviewer: "I appreciate you taking the time to interview with us today. I know these can feel a bit formal, but I'd like to keep this as conversational as possible. Tell me, what's one thing you're genuinely excited about right now - it could be work-related or just something in your personal life?",
      followUp: "That's fantastic! It's great to see that enthusiasm - that kind of energy really comes through in conversations."
    },
    {
      interviewer: "Before we get into the specifics of the role, I'd love to know a bit about your background. Could you give me a brief overview of your journey and what led you to apply for this position?",
      followUp: "Thank you for sharing that. It's always interesting to hear about the different paths that bring people together."
    }
  ];

  const playInterviewerAudio = async (text) => {
    setAudioPlaying(true);
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.playbackRate.value = 0.8; // Even slower for warmup
        source.connect(audioContext.destination);
        
        source.onended = () => {
          setAudioPlaying(false);
        };
        
        source.start(0);
      }
    } catch (error) {
      console.error("Audio playback failed:", error);
      setAudioPlaying(false);
    }
  };

  useEffect(() => {
    // Play the first warmup phrase when component mounts
    if (currentPhase === 0) {
      setTimeout(() => {
        playInterviewerAudio(warmupPhrases[0].interviewer);
      }, 1000);
    }
  }, []);

  const startResponse = () => {
    setFinalText("");
    setUserResponse("");
    setIsListening(true);
    if (supported) start();
  };

  const finishResponse = () => {
    setIsListening(false);
    if (supported) stop();
    
    const response = (finalText + " " + interimText).trim() || userResponse;
    
    setWarmupData(prev => ({
      ...prev,
      [currentPhase]: response
    }));

    // Play follow-up response
    setTimeout(() => {
      playInterviewerAudio(warmupPhrases[currentPhase].followUp);
    }, 500);

    // Move to next phase or complete
    setTimeout(() => {
      if (currentPhase < warmupPhrases.length - 1) {
        setCurrentPhase(currentPhase + 1);
        setTimeout(() => {
          playInterviewerAudio(warmupPhrases[currentPhase + 1].interviewer);
        }, 2000);
      } else {
        setTimeout(() => {
          playInterviewerAudio("Perfect! Now I feel like we've gotten to know each other a bit better. Let's move into the main interview questions. Are you ready?");
        }, 2000);
        
        setTimeout(() => {
          onComplete(warmupData);
        }, 6000);
      }
    }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <SectionCard className="p-8 md:p-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Getting to Know You
          </h1>
          <p className="text-white/70 text-lg">
            Let's start with some casual conversation to help you feel comfortable
          </p>
        </div>

        <div className="space-y-8">
          {/* Interviewer Avatar and Speech */}
          <div className="flex items-start space-x-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-2xl">
              🎯
            </div>
            <div className="flex-1">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="font-semibold">AI Interviewer</span>
                  {audioPlaying && (
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-75" />
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-150" />
                    </div>
                  )}
                </div>
                <p className="text-white/90 leading-relaxed">
                  {warmupPhrases[currentPhase].interviewer}
                </p>
              </div>
            </div>
          </div>

          {/* User Response Area */}
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 min-h-[120px]">
              <div className="flex items-center space-x-2 mb-4">
                <span className="font-semibold">Your Response</span>
                {isListening && (
                  <div className="flex items-center space-x-2 text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs">Listening...</span>
                  </div>
                )}
              </div>
              
              {supported ? (
                <div className="space-y-3">
                  <div className="text-white/90 leading-relaxed">
                    {finalText}
                  </div>
                  {interimText && (
                    <div className="text-white/50 italic">
                      {interimText}
                    </div>
                  )}
                  {!finalText && !interimText && !isListening && (
                    <div className="text-white/40 italic">
                      Click "Start Speaking" when you're ready to respond...
                    </div>
                  )}
                </div>
              ) : (
                <textarea
                  value={userResponse}
                  onChange={(e) => setUserResponse(e.target.value)}
                  placeholder="Type your response here..."
                  className="w-full bg-transparent border-none outline-none text-white/90 placeholder-white/40 resize-none"
                  rows={3}
                />
              )}
            </div>

            {/* Controls */}
            <div className="flex justify-center space-x-4">
              {!isListening ? (
                <GradientButton 
                  onClick={startResponse}
                  disabled={audioPlaying}
                  className="px-8 py-3"
                >
                  {supported ? 'Start Speaking' : 'Submit Response'}
                </GradientButton>
              ) : (
                <GradientButton 
                  onClick={finishResponse}
                  className="px-8 py-3 bg-red-500 hover:bg-red-600"
                >
                  Finish Response
                </GradientButton>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="flex justify-center space-x-2">
            {warmupPhrases.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index <= currentPhase ? 'bg-cyan-400' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}