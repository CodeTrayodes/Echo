"use client";
import { useEffect, useRef, useState } from "react";

export default function useLiveSTT() {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");

  const recRef = useRef(null);
  const keepAliveRef = useRef(false);
  const bufferRef = useRef("");

  useEffect(() => {
    const SpeechRecognition = typeof window !== "undefined" && 
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    
    if (!SpeechRecognition) return;
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US"; // US English for better accuracy

    recRef.current = recognition;
    setSupported(true);

    recognition.onresult = (event) => {
      let interim = "";
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          bufferRef.current += transcript + " ";
        } else {
          interim += transcript;
        }
      }
      
      setFinalText(bufferRef.current.trim());
      setInterimText(interim);
    };

    recognition.onend = () => {
      setListening(false);
      if (keepAliveRef.current) {
        try {
          recognition.start();
          setListening(true);
        } catch (error) {
          console.error("Failed to restart recognition:", error);
        }
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setListening(false);
    };

    return () => {
      keepAliveRef.current = false;
      try {
        recognition.stop();
      } catch (error) {
        console.error("Error stopping recognition:", error);
      }
    };
  }, []);

  const start = () => {
    if (!recRef.current) return;
    
    keepAliveRef.current = true;
    bufferRef.current = "";
    setFinalText("");
    setInterimText("");
    
    try {
      recRef.current.start();
      setListening(true);
    } catch (error) {
      console.error("Failed to start recognition:", error);
    }
  };

  const stop = () => {
    keepAliveRef.current = false;
    if (recRef.current) {
      try {
        recRef.current.stop();
      } catch (error) {
        console.error("Error stopping recognition:", error);
      }
    }
    setListening(false);
  };

  return { 
    supported, 
    listening, 
    finalText, 
    interimText, 
    start, 
    stop, 
    setFinalText 
  };
}