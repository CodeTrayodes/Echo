// src/components/interview/SetupFlow.js
"use client";
import { useState, useEffect, useRef } from "react";
import SectionCard from "@/components/SectionCard";
import GradientButton from "@/components/GradientButton";
import { CheckCircle, Camera, Mic, Volume2, AlertCircle } from "lucide-react";

export default function SetupFlow({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [permissions, setPermissions] = useState({
    camera: false,
    microphone: false,
    audio: false
  });
  const [isReady, setIsReady] = useState(false);
  const [testingAudio, setTestingAudio] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const steps = [
    {
      title: "Welcome to Your Mock Interview",
      subtitle: "Let's set up your interview environment for the best experience",
      icon: "👋"
    },
    {
      title: "Camera Setup",
      subtitle: "We'll use your camera to create a realistic interview atmosphere",
      icon: "📹"
    },
    {
      title: "Microphone Test",
      subtitle: "Test your microphone to ensure clear audio capture",
      icon: "🎤"
    },
    {
      title: "Audio Check",
      subtitle: "Listen to our AI interviewer to adjust your volume",
      icon: "🔊"
    }
  ];

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 }, 
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setPermissions(prev => ({ ...prev, camera: true }));
    } catch (error) {
      console.error("Camera permission denied:", error);
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      // Test microphone by creating a simple audio context
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      
      setPermissions(prev => ({ ...prev, microphone: true }));
      
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());
      audioContext.close();
    } catch (error) {
      console.error("Microphone permission denied:", error);
    }
  };

  const testAudioPlayback = async () => {
    setTestingAudio(true);
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: "Hello! This is your AI interviewer. Can you hear me clearly? I'll be guiding you through today's interview." 
        }),
      });
      
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.playbackRate.value = 0.85; // Slower, more human pace
        source.connect(audioContext.destination);
        
        source.onended = () => {
          setTestingAudio(false);
          setPermissions(prev => ({ ...prev, audio: true }));
        };
        
        source.start(0);
      }
    } catch (error) {
      console.error("Audio test failed:", error);
      setTestingAudio(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsReady(true);
    }
  };

  const startInterview = () => {
    onComplete({
      permissions,
      setupTime: new Date().toISOString()
    });
  };

  useEffect(() => {
    const allPermissionsGranted = Object.values(permissions).every(Boolean);
    setIsReady(allPermissionsGranted && currentStep === steps.length - 1);
  }, [permissions, currentStep]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center text-2xl
              ${index <= currentStep 
                ? 'bg-gradient-to-r from-indigo-500 to-cyan-400 text-white' 
                : 'bg-white/10 text-white/40'
              }
            `}>
              {index < currentStep ? <CheckCircle className="w-6 h-6" /> : step.icon}
            </div>
            {index < steps.length - 1 && (
              <div className={`
                w-16 h-1 mx-4
                ${index < currentStep ? 'bg-gradient-to-r from-indigo-500 to-cyan-400' : 'bg-white/10'}
              `} />
            )}
          </div>
        ))}
      </div>

      <SectionCard className="p-8 md:p-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {steps[currentStep].title}
          </h1>
          <p className="text-white/70 text-lg">
            {steps[currentStep].subtitle}
          </p>
        </div>

        {/* Step Content */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="flex items-start space-x-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-2xl">🎯</div>
                  <div>
                    <h3 className="font-semibold mb-1">Realistic Experience</h3>
                    <p className="text-sm text-white/70">Our AI interviewer creates an authentic interview atmosphere</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-2xl">🔒</div>
                  <div>
                    <h3 className="font-semibold mb-1">Privacy First</h3>
                    <p className="text-sm text-white/70">Your video stays on your device. We only process audio for feedback</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-2xl">⚡</div>
                  <div>
                    <h3 className="font-semibold mb-1">Instant Feedback</h3>
                    <p className="text-sm text-white/70">Get detailed analysis and improvement suggestions immediately</p>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <div className={`
                  flex items-center space-x-3 p-4 rounded-xl border
                  ${permissions.camera 
                    ? 'bg-green-500/10 border-green-400/40 text-green-300' 
                    : 'bg-white/5 border-white/10'
                  }
                `}>
                  <Camera className="w-5 h-5" />
                  <span className="font-medium">
                    {permissions.camera ? 'Camera Connected' : 'Camera Access Required'}
                  </span>
                  {permissions.camera && <CheckCircle className="w-5 h-5 text-green-400" />}
                </div>
                
                {!permissions.camera && (
                  <button
                    onClick={requestCameraPermission}
                    className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 font-semibold hover:opacity-90"
                  >
                    Enable Camera
                  </button>
                )}

                <div className="text-sm text-white/60 space-y-2">
                  <p>• Position yourself in good lighting</p>
                  <p>• Ensure your face is clearly visible</p>
                  <p>• Minimize background distractions</p>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className={`
                  flex items-center space-x-3 p-4 rounded-xl border
                  ${permissions.microphone 
                    ? 'bg-green-500/10 border-green-400/40 text-green-300' 
                    : 'bg-white/5 border-white/10'
                  }
                `}>
                  <Mic className="w-5 h-5" />
                  <span className="font-medium">
                    {permissions.microphone ? 'Microphone Connected' : 'Microphone Access Required'}
                  </span>
                  {permissions.microphone && <CheckCircle className="w-5 h-5 text-green-400" />}
                </div>
                
                {!permissions.microphone && (
                  <button
                    onClick={requestMicrophonePermission}
                    className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 font-semibold hover:opacity-90"
                  >
                    Enable Microphone
                  </button>
                )}

                <div className="text-sm text-white/60 space-y-2">
                  <p>• Speak clearly and at normal volume</p>
                  <p>• Minimize background noise</p>
                  <p>• Use headphones if possible to prevent echo</p>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className={`
                  flex items-center space-x-3 p-4 rounded-xl border
                  ${permissions.audio 
                    ? 'bg-green-500/10 border-green-400/40 text-green-300' 
                    : 'bg-white/5 border-white/10'
                  }
                `}>
                  <Volume2 className="w-5 h-5" />
                  <span className="font-medium">
                    {permissions.audio ? 'Audio Test Complete' : 'Test Audio Playback'}
                  </span>
                  {permissions.audio && <CheckCircle className="w-5 h-5 text-green-400" />}
                </div>
                
                {!permissions.audio && (
                  <button
                    onClick={testAudioPlayback}
                    disabled={testingAudio}
                    className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 font-semibold hover:opacity-90 disabled:opacity-50"
                  >
                    {testingAudio ? 'Playing Audio...' : 'Test Audio'}
                  </button>
                )}

                <div className="text-sm text-white/60 space-y-2">
                  <p>• Adjust your volume for comfortable listening</p>
                  <p>• Our AI interviewer speaks at a natural pace</p>
                  <p>• You can ask for questions to be repeated</p>
                </div>
              </div>
            )}
          </div>

          {/* Video Preview */}
          <div className="relative">
            <div className="aspect-video rounded-2xl overflow-hidden bg-black/60 border border-white/10">
              {permissions.camera ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-white/40">
                    <Camera className="w-16 h-16 mx-auto mb-4" />
                    <p>Camera preview will appear here</p>
                  </div>
                </div>
              )}
            </div>
            
            {permissions.camera && (
              <div className="absolute top-4 right-4 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span>LIVE</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-6 py-3 rounded-xl border border-white/20 text-white/70 hover:text-white hover:border-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {isReady ? (
            <GradientButton onClick={startInterview} className="px-8 py-3">
              Start Interview →
            </GradientButton>
          ) : (
            <button
              onClick={nextStep}
              disabled={
                (currentStep === 1 && !permissions.camera) ||
                (currentStep === 2 && !permissions.microphone) ||
                (currentStep === 3 && !permissions.audio)
              }
              className="px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
            </button>
          )}
        </div>
      </SectionCard>
    </div>
  );
}