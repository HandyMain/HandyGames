
import React, { useState, useRef, useEffect } from 'react';
import { Palette, Trash2, Sparkles, Eraser, RotateCcw, Check } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { speak } from '../utils';
import { Confetti } from '../components';

export const DrawingMode = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(5);
  const [status, setStatus] = useState<'idle' | 'guessing' | 'success' | 'error'>('idle');
  const [guess, setGuess] = useState('');

  const colors = [
    { name: 'Black', val: '#000000' },
    { name: 'Red', val: '#EF4444' },
    { name: 'Blue', val: '#3B82F6' },
    { name: 'Green', val: '#22C55E' },
    { name: 'Yellow', val: '#EAB308' },
    { name: 'Purple', val: '#A855F7' },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  const getCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = (event as React.MouseEvent).clientX;
      clientY = (event as React.MouseEvent).clientY;
    }

    // Scale coordinates based on displayed size vs actual canvas size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling on touch
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.closePath();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setStatus('idle');
      setGuess('');
    }
  };

  const handleGuess = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setStatus('guessing');
    setGuess('');
    
    try {
      // Get Base64 image
      const base64Data = canvas.toDataURL('image/png').split(',')[1];

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/png',
                data: base64Data
              }
            },
            {
              text: "Look at this drawing by a child. What is it? Answer with just the name of the object in one or two words. If it's just scribbles, say 'A masterpiece!'."
            }
          ]
        }
      });

      const text = response.text || "I'm not sure!";
      setGuess(text);
      setStatus('success');
      speak(`Is it... ${text}?`);

    } catch (error) {
      console.error(error);
      setStatus('error');
      speak("Uh oh, I couldn't see that clearly. Try again!");
    }
  };

  return (
    <div className="w-full max-w-2xl flex flex-col items-center">
      {status === 'success' && <Confetti />}
      
      <div className="bg-white p-4 rounded-3xl shadow-xl w-full mb-6">
        <div className="flex flex-col items-center gap-4">
            
            {/* Header / Result */}
            <div className="w-full flex justify-between items-center px-2">
                <h2 className="text-xl md:text-2xl font-bold text-purple-900 flex items-center gap-2">
                    <Palette className="text-purple-500" /> Magic Draw
                </h2>
                {status === 'guessing' && <div className="text-blue-500 font-bold animate-pulse text-sm md:text-base">Looking...</div>}
                {status === 'success' && <div className="text-green-600 font-bold text-lg md:text-xl">{guess}</div>}
            </div>

            {/* Canvas */}
            <div className="relative border-4 border-dashed border-purple-200 rounded-2xl overflow-hidden touch-none shadow-inner bg-white w-full max-w-[350px] aspect-square">
                <canvas
                    ref={canvasRef}
                    width={350}
                    height={350}
                    className="cursor-crosshair bg-white w-full h-full"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-2 md:gap-3 justify-center w-full">
                {colors.map(c => (
                    <button
                        key={c.name}
                        onClick={() => { setColor(c.val); setLineWidth(5); }}
                        className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 shadow-sm transition-transform hover:scale-110 ${color === c.val && lineWidth === 5 ? 'scale-125 ring-2 ring-offset-2 ring-purple-300' : 'border-gray-200'}`}
                        style={{ backgroundColor: c.val }}
                        aria-label={c.name}
                    />
                ))}
                <button 
                    onClick={() => { setColor('#FFFFFF'); setLineWidth(20); }}
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center text-gray-600 transition-all ${color === '#FFFFFF' ? 'ring-2 ring-offset-2 ring-purple-300 bg-gray-200' : ''}`}
                    title="Eraser"
                >
                    <Eraser size={20} />
                </button>
            </div>
            
            <div className="flex gap-4 w-full pt-2">
                <button 
                    onClick={clearCanvas}
                    className="flex-1 bg-red-100 text-red-600 py-3 rounded-xl font-bold hover:bg-red-200 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                >
                    <Trash2 size={20} /> Clear
                </button>
                <button 
                    onClick={handleGuess}
                    disabled={status === 'guessing'}
                    className="flex-[2] bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm md:text-base"
                >
                    {status === 'guessing' ? <RotateCcw className="animate-spin" /> : <Sparkles />} 
                    Guess!
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
