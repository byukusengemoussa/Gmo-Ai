
import React, { useEffect, useState } from 'react';

interface RobotVisualizerProps {
  isActive: boolean;
  isSpeaking: boolean;
  isListening: boolean;
}

const RobotVisualizer: React.FC<RobotVisualizerProps> = ({ isActive, isSpeaking, isListening }) => {
  const [pulseScale, setPulseScale] = useState(1);

  useEffect(() => {
    let interval: number;
    if (isActive) {
      interval = window.setInterval(() => {
        setPulseScale(prev => (prev === 1 ? 1.05 : 1));
      }, 800);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      {/* Outer Glows */}
      <div 
        className={`absolute inset-0 rounded-full blur-3xl transition-opacity duration-500 bg-blue-500/20 ${isActive ? 'opacity-100' : 'opacity-0'}`}
      />
      
      {/* Pulse Rings */}
      {isSpeaking && (
        <div className="absolute inset-0 animate-ping rounded-full bg-blue-400/10 border border-blue-400/20" />
      )}
      
      {/* Robot Core */}
      <div 
        className={`relative z-10 w-48 h-48 rounded-full bg-slate-900 border-4 transition-all duration-500 flex flex-col items-center justify-center shadow-2xl ${
          isActive ? 'border-blue-500 scale-105' : 'border-slate-700 scale-100 opacity-60'
        }`}
        style={{ transform: `scale(${isActive ? pulseScale : 1})` }}
      >
        {/* Robot Face/Eyes */}
        <div className="flex gap-8 mb-4">
          <div className={`w-3 h-6 rounded-full transition-all duration-300 ${
            isSpeaking ? 'bg-blue-400 h-8 shadow-[0_0_15px_rgba(96,165,250,0.8)]' : 'bg-slate-600 h-6'
          }`} />
          <div className={`w-3 h-6 rounded-full transition-all duration-300 ${
            isSpeaking ? 'bg-blue-400 h-8 shadow-[0_0_15px_rgba(96,165,250,0.8)]' : 'bg-slate-600 h-6'
          }`} />
        </div>
        
        {/* Voice Visualization Bars */}
        <div className="flex items-end gap-1 h-8">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-1 rounded-full bg-blue-500 transition-all duration-150 ${
                isListening || isSpeaking ? 'opacity-100' : 'opacity-20'
              }`}
              style={{
                height: isSpeaking || isListening 
                  ? `${Math.random() * 100 + 20}%` 
                  : '10%'
              }}
            />
          ))}
        </div>
      </div>

      {/* Connection Indicator */}
      {isActive && (
        <div className="absolute top-0 right-0 p-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        </div>
      )}
    </div>
  );
};

export default RobotVisualizer;
