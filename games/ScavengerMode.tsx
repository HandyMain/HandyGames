
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Check, RotateCcw, Sparkles, X, SkipForward, Timer, Lightbulb, Zap, Trophy, ArrowRight } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { speak, getRandomItem } from '../utils';
import { Confetti } from '../components';

// --- Expanded Data Sets ---
const MISSIONS_EASY = [
  "Something Red", "Something Blue", "Something Green", "Something Yellow", 
  "A Spoon", "A Cup", "A Shoe", "A Sock", "A Book", "A Pillow", "A Ball", 
  "A Hat", "A Plate", "A Chair", "A Door", "A Window", "A Crayon", "A Toy"
];

const MISSIONS_MEDIUM = [
  "Something Round", "Something Square", "Something Soft", "Something Hard", 
  "Something Shiny", "A Fruit", "A Vegetable", "A Plant", "A Toy Car", 
  "A Key", "Something Plastic", "A Box", "Something Cold", "Something Fuzzy",
  "A Water Bottle", "A Remote Control", "A Toothbrush", "A Towel"
];

const MISSIONS_HARD = [
  "Something with numbers", "Something transparent", "Something made of wood", 
  "Something with a face", "Something that makes noise", "A pair of matching items",
  "Something rough", "Something sweet", "Something that gives light", "Something with wheels",
  "Something older than you", "Something written in ink", "Something that smells good"
];

export const ScavengerMode = ({ difficulty = 'easy', onUnlock }: { difficulty: 'easy' | 'medium' | 'hard', onUnlock?: (id: string) => void }) => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<number | null>(null);

  // Game State
  const [mission, setMission] = useState('');
  const [status, setStatus] = useState<'idle' | 'hunting' | 'scanning' | 'verifying' | 'success' | 'fail' | 'complete' | 'timeout'>('idle');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);

  // History Tracking (Session based)
  const [foundItems, setFoundItems] = useState<Set<string>>(new Set());

  // --- Initialization ---
  useEffect(() => {
    startCamera();
    return () => {
        stopCamera();
        if(timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Reset when difficulty changes
  useEffect(() => {
      setFoundItems(new Set());
      setScore(0);
      startMission(true); // True = reset
  }, [difficulty]);

  // --- Camera Logic ---
  const startCamera = async () => {
    try {
      // Try environment first (back camera)
      const ms = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(ms);
      if (videoRef.current) {
        videoRef.current.srcObject = ms;
        videoRef.current.play().catch(e => console.error("Video play failed", e));
      }
    } catch (e) {
      console.log("Environment camera failed, trying fallback...", e);
      try {
          // Fallback to any available camera
          const ms = await navigator.mediaDevices.getUserMedia({ video: true });
          setStream(ms);
          if (videoRef.current) {
            videoRef.current.srcObject = ms;
            videoRef.current.play().catch(e => console.error("Video play failed", e));
          }
      } catch (err) {
          console.error("Camera error:", err);
          setFeedback("I can't see! Please allow camera access in your browser settings.");
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const toggleTorch = () => {
      if (!stream) return;
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      if (capabilities.torch) {
          const newStatus = !torchOn;
          track.applyConstraints({
              advanced: [{ torch: newStatus }] as any
          }).catch(e => console.log("Torch error", e));
          setTorchOn(newStatus);
      } else {
          speak("Sorry, I can't turn on the light.");
      }
  };

  // --- Game Logic ---
  const getPool = () => {
      if (difficulty === 'hard') return MISSIONS_HARD;
      if (difficulty === 'medium') return MISSIONS_MEDIUM;
      return MISSIONS_EASY;
  };

  const startMission = useCallback((reset = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setHintUsed(false);

    const pool = getPool();
    // Filter out items we've already found
    const available = pool.filter(m => !foundItems.has(m) || reset); 

    // Check for Level Completion
    if (available.length === 0 && !reset) {
        setStatus('complete');
        speak("Mission Complete! You found everything!");
        return;
    }

    const newMission = getRandomItem(available);
    setMission(newMission);
    setStatus('hunting');
    setFeedback('');
    
    // Difficulty Settings
    let time = 0; // 0 = infinite
    if (difficulty === 'medium') time = 60;
    if (difficulty === 'hard') time = 30;

    setTimeLeft(time);

    if (time > 0) {
        timerRef.current = window.setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    handleTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }

    speak(`Find ${newMission}!`);
  }, [difficulty, foundItems]);

  const handleTimeout = () => {
      if(timerRef.current) clearInterval(timerRef.current);
      setStatus('timeout');
      speak("Time's up! Try finding something else.");
  };

  const skipMission = () => {
      // Penalty for skipping?
      speak("Skipping this one.");
      startMission();
  };

  const getHint = async () => {
      if (hintUsed) return;
      setHintUsed(true);
      speak("Let me think...");
      
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Give a simple 1-sentence hint for a child looking for: "${mission}". Example: "Check the kitchen drawer."`,
          });
          const hint = response.text || "Look around the room!";
          speak(hint);
      } catch (e) {
          speak("Look carefully around you!");
      }
  };

  const captureAndVerify = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setStatus('scanning');
    speak("Scanning...");

    // Capture frame
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Optimize image size
    const MAX_WIDTH = 800;
    const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        I asked a child to find: "${mission}".
        Difficulty Level: ${difficulty}.
        Look at the image.
        1. Did they find it? (Answer YES or NO first).
        2. If YES: Give a super excited compliment about the specific object you see (e.g., "Wow, that red truck is cool!").
        3. If NO: Gently explain what you see instead and encourage them (e.g., "I see a cat, but we need a shoe!").
        4. Strictness: ${difficulty === 'hard' ? 'Be strict.' : 'Be lenient.'}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
            { text: prompt }
          ]
        }
      });

      const text = response.text || "";
      setFeedback(text);
      setStatus('verifying'); // Brief pause to show scanning result

      setTimeout(() => {
        if (text.toLowerCase().includes("yes") || text.toLowerCase().includes("wow") || text.toLowerCase().includes("great") || text.toLowerCase().includes("found")) {
            setStatus('success');
            speak(text);
            
            // Score Calculation
            let points = 10;
            if (difficulty === 'medium') points = 20;
            if (difficulty === 'hard') points = 30;
            if (timeLeft > 0) points += Math.floor(timeLeft / 2); // Time bonus
            
            setScore(s => s + points);
            setFoundItems(prev => new Set(prev).add(mission)); // Mark as found
            if (onUnlock) onUnlock('scavenger');
        } else {
            setStatus('fail');
            speak(text);
        }
      }, 1500);

    } catch (e) {
      console.error(e);
      setStatus('fail');
      setFeedback("I couldn't quite see that. Try holding it steady!");
      speak("I couldn't quite see that. Try again!");
    }
  };

  const getTimeColor = () => {
      if (timeLeft > 20) return 'text-green-500';
      if (timeLeft > 10) return 'text-yellow-500';
      return 'text-red-500 animate-pulse';
  };

  // --- Render ---
  return (
    <div className="w-full max-w-2xl flex flex-col items-center h-[70vh]">
      {status === 'success' && <Confetti />}
      {status === 'complete' && <Confetti />}

      {/* Top HUD */}
      <div className="w-full flex justify-between items-center mb-4 px-2">
         <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
             <Trophy size={20} className="text-yellow-500 fill-yellow-500" />
             <span className="font-black text-gray-800">{score}</span>
         </div>

         {difficulty !== 'easy' && (
             <div className={`flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200 font-mono font-bold text-xl ${getTimeColor()}`}>
                 <Timer size={20} />
                 <span>{timeLeft}s</span>
             </div>
         )}
         
         <div className="bg-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-gray-400 border border-gray-200">
             {difficulty}
         </div>
      </div>

      {/* Mission Banner */}
      <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-lg w-full mb-4 z-10 text-center animate-in slide-in-from-top-4 relative border-l-8 border-orange-500">
        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-1">Target Object</p>
        <h2 className="text-2xl md:text-3xl font-black text-gray-800 leading-tight">
           {status === 'complete' ? "ALL FOUND!" : mission}
        </h2>
        
        {/* Skip Button */}
        {(status === 'hunting' || status === 'fail') && (
            <button 
                onClick={skipMission}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-gray-100 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
                title="Skip Item"
            >
                <SkipForward size={20} />
            </button>
        )}
      </div>

      {/* Camera Viewport */}
      {status === 'complete' ? (
          <div className="flex-1 w-full bg-gradient-to-br from-yellow-100 to-orange-100 rounded-[2rem] flex flex-col items-center justify-center p-8 text-center shadow-inner">
               <Trophy size={80} className="text-yellow-500 mb-6 animate-bounce" />
               <h2 className="text-3xl font-black text-orange-800 mb-2">Scavenger Master!</h2>
               <p className="text-orange-700 text-lg mb-8">You found every item in the {difficulty} list!</p>
               <button 
                  onClick={() => { setFoundItems(new Set()); startMission(true); }}
                  className="bg-orange-500 text-white px-8 py-4 rounded-full font-bold text-xl shadow-lg hover:bg-orange-600 transition-all flex items-center gap-2"
               >
                  Play Again <RotateCcw />
               </button>
          </div>
      ) : (
          <div className="relative flex-1 w-full bg-black rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white ring-4 ring-orange-100 group">
             <video 
                ref={videoRef}
                autoPlay 
                playsInline
                muted
                className={`w-full h-full object-cover transition-opacity duration-500 ${status === 'scanning' ? 'opacity-50' : 'opacity-100'}`}
             />
             
             {/* Hidden Canvas */}
             <canvas ref={canvasRef} className="hidden" />

             {/* UI Overlays */}
             {status === 'hunting' && (
                 <>
                    {/* Torch Toggle */}
                    <button 
                        onClick={toggleTorch}
                        className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur-md transition-all ${torchOn ? 'bg-yellow-400 text-yellow-900' : 'bg-black/30 text-white'}`}
                    >
                        <Zap size={20} className={torchOn ? 'fill-current' : ''} />
                    </button>

                    {/* Hint Button */}
                    <button 
                        onClick={getHint}
                        disabled={hintUsed}
                        className={`absolute top-4 left-4 p-3 rounded-full backdrop-blur-md transition-all flex items-center gap-2 ${hintUsed ? 'bg-gray-200/50 text-gray-500' : 'bg-blue-500/80 text-white animate-pulse'}`}
                    >
                        <Lightbulb size={20} className={!hintUsed ? 'fill-current' : ''} />
                        {!hintUsed && <span className="text-xs font-bold pr-1">Hint</span>}
                    </button>

                    {/* Reticle */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-64 h-64 border-2 border-white/50 rounded-3xl relative">
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-white"></div>
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-white"></div>
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-white"></div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-white"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/80 rounded-full"></div>
                        </div>
                    </div>
                 </>
             )}

             {/* Scanning Animation */}
             {status === 'scanning' && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                     <div className="w-full h-1 bg-blue-400 absolute top-0 animate-[scan_1.5s_ease-in-out_infinite] shadow-[0_0_20px_rgba(96,165,250,0.8)]"></div>
                     <Sparkles className="text-blue-300 w-16 h-16 animate-spin mb-4" />
                     <p className="text-white font-bold text-2xl drop-shadow-md">Analyzing...</p>
                 </div>
             )}

             {/* Result Overlay */}
             {(status === 'success' || status === 'fail' || status === 'timeout') && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
                    {status === 'success' && <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 animate-bounce"><Check className="text-white w-12 h-12" strokeWidth={4} /></div>}
                    {status === 'fail' && <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mb-6"><X className="text-white w-12 h-12" strokeWidth={4} /></div>}
                    {status === 'timeout' && <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center mb-6"><Timer className="text-white w-12 h-12" strokeWidth={4} /></div>}
                    
                    <h3 className={`text-3xl font-black mb-4 ${status === 'success' ? 'text-green-400' : 'text-white'}`}>
                        {status === 'success' ? "FOUND IT!" : status === 'timeout' ? "TIME UP!" : "TRY AGAIN"}
                    </h3>
                    
                    <p className="text-gray-200 text-xl font-medium leading-relaxed mb-8">
                        {status === 'timeout' ? "You ran out of time!" : feedback}
                    </p>
                    
                    <button 
                      onClick={() => startMission()}
                      className="bg-white text-gray-900 px-10 py-4 rounded-full font-bold text-xl hover:scale-105 transition-transform flex items-center gap-3 shadow-xl"
                    >
                      {status === 'success' ? "Next Mission" : "Try Another"} <ArrowRight size={24} />
                    </button>
                </div>
             )}
          </div>
      )}

      {/* Capture Button */}
      {status === 'hunting' && (
          <div className="mt-6 mb-2">
            <button 
                onClick={captureAndVerify}
                className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-full border-4 border-gray-200 p-1 shadow-xl hover:scale-105 active:scale-95 transition-all group"
            >
                <div className="w-full h-full bg-orange-500 rounded-full group-hover:bg-orange-600 flex items-center justify-center border-4 border-white">
                    <Camera className="text-white w-8 h-8 md:w-10 md:h-10" />
                </div>
            </button>
          </div>
      )}

      <style>{`
        @keyframes scan {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};
