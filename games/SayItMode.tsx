

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Volume2, VolumeX, Mic, MicOff, ArrowRight } from 'lucide-react';
import { getRandomItem, speak, playSound } from '../utils';
import { Confetti, HintDisplay } from '../components';
import { LETTER_OBJECTS } from '../data';
import { useSpeechRecognition } from '../hooks';

export const SayItMode = ({ pool }: { pool: string[] }) => {
  const [current, setCurrent] = useState(getRandomItem(pool));
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [feedback, setFeedback] = useState<'none' | 'listening' | 'correct' | 'wrong'>('none');
  const [volume, setVolume] = useState(0); // For visualizer

  // Audio Context for Visualizer
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  // Ref to track muted state in callbacks
  const isMutedRef = useRef(isMuted);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  // Visualizer Functions
  const startVisualizer = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);
        
        source.connect(analyser);
        analyser.fftSize = 32;
        
        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;
        sourceRef.current = source;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const update = () => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for(let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const avg = sum / bufferLength;
            setVolume(avg); // 0 to 255
            rafRef.current = requestAnimationFrame(update);
        };
        update();
    } catch (e) {
        console.error("Audio visualizer error", e);
    }
  };

  const stopVisualizer = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (sourceRef.current) sourceRef.current.disconnect();
      if (audioContextRef.current) audioContextRef.current.close();
      setVolume(0);
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      stopVisualizer();
    };
  }, []);

  const getSpokenText = (item: string) => {
      const isNumber = !isNaN(Number(item));
      if (isNumber) return `The number is ${item}`;
      
      const lower = item.toLowerCase();
      const hint = LETTER_OBJECTS[lower];
      if (hint) {
          return `The letter is ${item}. ${item} is for ${hint.name}`;
      }
      return `The letter is ${item}`;
  };

  const nextCard = useCallback(() => {
    setIsAnimating(true);
    setFeedback('none');
    stopVisualizer();
    
    // We don't need to manually stop recognition here, handled by effect or usage
    
    setTimeout(() => {
      let next = getRandomItem(pool);
      if (pool.length > 1) {
        let attempts = 0;
        while (next === current && attempts < 10) {
            next = getRandomItem(pool);
            attempts++;
        }
      }
      setCurrent(next);
      setIsAnimating(false);
      if (!isMutedRef.current) speak(getSpokenText(next)); 
    }, 200);
  }, [pool, current]);

  const handleResult = (transcriptRaw: string) => {
      const transcript = transcriptRaw.toLowerCase().trim();
      const target = current.toLowerCase();

      const numberMap: {[key:string]: string} = {
        '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
        '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
        '10': 'ten', '11': 'eleven', '12': 'twelve', '13': 'thirteen', 
        '14': 'fourteen', '15': 'fifteen', '16': 'sixteen', '17': 'seventeen',
        '18': 'eighteen', '19': 'nineteen', '20': 'twenty'
      };
      
      const targetWord = numberMap[target] || target;
      
      if (transcript === target || transcript === targetWord || transcript.includes(targetWord)) {
        setFeedback('correct');
        playSound('success');
        speak("Correct! " + getSpokenText(current));
        stopVisualizer();
        stop(); // Stop listening
        setTimeout(() => {
          nextCard();
        }, 3000);
      } else {
        setFeedback('wrong');
        playSound('error');
        const failMessage = "Not quite. That was " + transcript + ". Try again!";
        speak(failMessage, () => {
             setTimeout(() => {
                 setFeedback('none'); 
                 stopVisualizer();
                 stop(); // Stop listening
             }, 300);
        });
      }
  };

  const { isListening, start, stop, isSupported } = useSpeechRecognition({
      interimResults: false,
      onStart: () => {
          setFeedback('listening');
          startVisualizer();
      },
      onEnd: () => {
          if (feedback === 'listening') {
               setFeedback('none');
               stopVisualizer();
          }
      },
      onError: () => {
          setFeedback('none');
          stopVisualizer();
      },
      onResult: handleResult
  });

  const handleMicClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSupported) {
      alert("Speech recognition is not supported in this browser. Try Chrome!");
      return;
    }
    
    if (isListening) {
      stop();
    } else {
      window.speechSynthesis.cancel();
      start();
    }
  };

  const toggleMute = () => {
      const newState = !isMuted;
      setIsMuted(newState);
      if (newState) window.speechSynthesis.cancel();
  }

  useEffect(() => {
      if (!isMuted) speak(getSpokenText(current));
  }, []); 

  // Visualizer scale
  const scale = 1 + (volume / 255) * 0.5;

  return (
    <div className="flex flex-col items-center w-full max-w-4xl relative">
      {feedback === 'correct' && <Confetti />}

      {/* Mute Control */}
      <div className="flex w-full justify-center mb-2 md:mb-4">
        <button
          onClick={toggleMute}
          className={`flex items-center gap-2 px-3 py-1 md:px-4 md:py-2 rounded-full font-bold shadow-sm transition-all text-xs md:text-sm border-2 ${
              isMuted ? 'bg-red-50 text-red-500 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'
          }`}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          {isMuted ? "Voice Off" : "Voice On"}
        </button>
      </div>
      
      {/* Feedback Banner */}
      <div className={`absolute -top-12 md:-top-16 transition-all duration-300 w-full flex justify-center z-30 ${feedback !== 'none' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
         {feedback === 'listening' && <div className="bg-blue-500 text-white px-4 py-1 md:px-6 md:py-2 rounded-full font-bold shadow-lg animate-pulse text-sm md:text-base">Say it loud!</div>}
         {feedback === 'correct' && <div className="bg-green-500 text-white px-4 py-1 md:px-6 md:py-2 rounded-full font-bold shadow-lg text-sm md:text-base">Awesome!</div>}
         {feedback === 'wrong' && <div className="bg-orange-400 text-white px-4 py-1 md:px-6 md:py-2 rounded-full font-bold shadow-lg text-sm md:text-base">Try Again!</div>}
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:gap-6 w-full items-stretch justify-center mb-4 md:mb-8 perspective-1000">
        {/* Main Letter Card */}
        <div 
            className={`flex-1 bg-white min-h-[250px] md:min-h-[350px] rounded-[2rem] md:rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center border-b-8 relative overflow-hidden transition-all duration-300 transform
            ${isAnimating ? 'scale-90 opacity-50 rotate-y-90' : 'scale-100 opacity-100 rotate-y-0'}
            ${feedback === 'listening' ? 'border-blue-400 ring-4 ring-blue-100' : 'border-blue-100'}
            ${feedback === 'correct' ? 'border-green-400 ring-4 ring-green-100' : ''}
            ${feedback === 'wrong' ? 'border-orange-400 ring-4 ring-orange-100' : ''}
            `}
            style={{ 
                transformStyle: 'preserve-3d',
                transform: feedback === 'listening' ? `scale(${scale})` : undefined
            }}
            onClick={() => { if (!isMuted) speak(getSpokenText(current)); }}
        >
            <span className="text-7xl md:text-9xl font-black text-blue-600 select-none leading-none mt-2 md:mt-0 filter drop-shadow-lg">
                {current}
            </span>
            
            {/* Volume Bar Visualizer */}
            {isListening && (
                <div className="absolute bottom-0 w-full flex justify-center gap-1 h-20 items-end pb-4 opacity-30">
                     {Array.from({length: 10}).map((_, i) => (
                         <div 
                            key={i} 
                            className="w-4 bg-blue-500 rounded-t-full transition-all duration-75"
                            style={{ height: `${Math.min(100, (volume / 255) * 100 * (Math.random() + 0.5))}%` }} 
                         />
                     ))}
                </div>
            )}

            {/* Mic Button on Card */}
            <button 
                onClick={handleMicClick}
                className={`absolute bottom-3 right-3 md:bottom-6 md:right-auto w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 shadow-xl z-20 border-4 border-white
                    ${isListening ? 'bg-red-500 text-white' : 'bg-gradient-to-br from-blue-400 to-indigo-600 text-white'}
                `}
            >
                {isListening ? <MicOff size={24} className="md:w-8 md:h-8" /> : <Mic size={24} className="md:w-8 md:h-8" />}
            </button>
        </div>

        {/* Visual Hint Card */}
        <div className={`flex-1 bg-gradient-to-br from-yellow-50 to-orange-50 min-h-[200px] md:min-h-[350px] rounded-[2rem] md:rounded-[3rem] shadow-[0_10px_30px_rgba(0,0,0,0.05)] flex items-center justify-center border-b-8 border-orange-100
             transition-all duration-300 transform ${isAnimating ? 'scale-90 opacity-50' : 'scale-100 opacity-100'}
        `}
        onClick={() => { if (!isMuted) speak(getSpokenText(current)); }}
        >
             <HintDisplay item={current} large={true} />
        </div>
      </div>

      <div className="flex gap-4 w-full max-w-md">
        <button 
          onClick={nextCard}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 md:py-4 rounded-2xl font-bold text-lg md:text-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          Next Card <ArrowRight />
        </button>
      </div>
    </div>
  );
};