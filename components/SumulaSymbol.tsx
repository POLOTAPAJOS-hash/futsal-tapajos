import React from "react";

export function SumulaSymbol() {
  return (
    <div className="flex flex-col items-center pt-8 pb-4 bg-white border-b-2 border-slate-200 mb-6 rounded-t-xl">
      <div className="w-28 h-32 relative mb-3">
        <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-md">
          {/* Shield Shape */}
          <path d="M5,10 Q5,0 15,0 L85,0 Q95,0 95,10 L95,80 Q95,120 50,120 Q5,120 5,80 Z" fill="#1e3a8a" />
          {/* Red Background */}
          <path d="M8,40 L92,40 L92,80 Q92,115 50,115 Q8,115 8,80 Z" fill="#dc2626" />
          {/* White Stripe */}
          <rect x="40" y="40" width="20" height="75" fill="#ffffff" />
          {/* FEFUSPA Text */}
          <text x="50" y="28" fill="#ffffff" fontSize="16" textAnchor="middle" style={{fontFamily: 'sans-serif', fontWeight: 900}}>FEFUSPA</text>
          {/* Blue Star */}
          <path d="M50,55 L53,63 L61,63 L55,68 L57,76 L50,71 L43,76 L45,68 L39,63 L47,63 Z" fill="#1e3a8a" />
          {/* Date */}
          <text x="50" y="108" fill="#1e3a8a" fontSize="8" textAnchor="middle" style={{fontFamily: 'sans-serif', fontWeight: 900}}>05 04 88</text>
        </svg>
      </div>
      <h1 className="text-xl font-black text-slate-900 text-center uppercase tracking-tighter">
        Federação de Futebol de Salão do Pará
      </h1>
      <div className="flex items-center gap-2 mt-1">
        <div className="h-[2px] w-6 bg-slate-300"></div>
        <p className="text-[0.65rem] text-slate-500 font-bold uppercase tracking-widest">Súmula Eletrônica Oficial</p>
        <div className="h-[2px] w-6 bg-slate-300"></div>
      </div>
    </div>
  );
}
