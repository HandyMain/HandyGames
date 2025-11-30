
import { useState, useEffect, useRef, useCallback } from 'react';
import { SpeechRecognition, SpeechRecognitionEvent } from './utils';

interface UseSpeechRecognitionProps {
  onResult?: (transcript: string) => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
  onStart?: () => void;
  continuous?: boolean;
  lang?: string;
  interimResults?: boolean;
}

export const useSpeechRecognition = ({ 
  onResult, 
  onEnd, 
  onError,
  onStart,
  continuous = false, 
  lang = 'en-US',
  interimResults = true
}: UseSpeechRecognitionProps = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      setIsSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = continuous;
      rec.interimResults = interimResults;
      rec.lang = lang;
      recognitionRef.current = rec;
    }
  }, [continuous, lang, interimResults]);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      // Abort previous instance if any to ensure clean start
      recognitionRef.current.abort(); 
      setTranscript('');
      recognitionRef.current.start();
    } catch (e) {
      console.error("Speech start error", e);
    }
  }, []);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
        recognitionRef.current.stop();
    } catch (e) {
        // Ignore stop errors
    }
  }, []);

  const abort = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.abort();
  }, []);

  useEffect(() => {
    const rec = recognitionRef.current;
    if (!rec) return;

    rec.onstart = () => {
        setIsListening(true);
        if (onStart) onStart();
    };
    
    rec.onend = () => {
      setIsListening(false);
      if (onEnd) onEnd();
    };
    
    rec.onerror = (event: any) => {
      setIsListening(false);
      if (onError) onError(event);
    };
    
    rec.onresult = (event: SpeechRecognitionEvent) => {
      if (!event.results || event.results.length === 0) return;

      const resultIndex = event.resultIndex || event.results.length - 1;
      const result = event.results[resultIndex];
      const current = result[0].transcript;
      
      setTranscript(current);
      
      if (onResult && result.isFinal) {
        onResult(current);
      }
    };

    return () => {
      // Cleanup callbacks to prevent stale state access if dependencies change
      rec.onstart = null;
      rec.onend = null;
      rec.onerror = null;
      rec.onresult = null;
    };
  }, [onResult, onEnd, onError, onStart]);

  return { isListening, transcript, start, stop, abort, isSupported, setTranscript };
};
