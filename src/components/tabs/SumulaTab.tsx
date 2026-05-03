import React from "react";
import { Zap, ChevronRight, ChevronLeft } from "lucide-react";
import { SumulaSymbol } from "../SumulaSymbol";
import { GameData, Sumula, Player, Goal } from "../../lib/types";

interface SumulaTabProps {
  currentStep: number;
  setCurrentStep: (val: number) => void;
  gameData: GameData;
  setGameData: (val: GameData) => void;
  sumula: Sumula;
  setSumula: (val: Sumula) => void;
  playersA: Player[];
  playersB: Player[];
  goalsA: Goal[];
  goalsB: Goal[];
  updatePlayer: (team: 'a'|'b', id: number, updates: Partial<Player>) => void;
  addGoal: (team: 'a'|'b') => void;
  setImportModal: (val: { isOpen: boolean; team: "a" | "b" }) => void;
}

export function SumulaTab({
  currentStep,
  setCurrentStep,
  gameData,
  setGameData,
  sumula,
  playersA,
  playersB,
  goalsA,
  goalsB,
  updatePlayer,
  addGoal,
  setImportModal,
}: SumulaTabProps) {
  const steps = [
    "Identificação",
    "Escalações",
    "Substituições",
    "Gols e Faltas",
    "Arbitragem",
    "Finalizar",
  ];

  return (
    <div className="tab-page active">
      <div className="sumula-wrap bg-slate-100 min-h-screen p-2 sm:p-6 text-slate-800">
        <SumulaSymbol />

        {/* Status Bar */}
        <div className="bg-slate-900 text-white p-4 rounded-xl mb-6 flex justify-between items-center shadow-lg border-b-4 border-sky/30">
           <div className="flex flex-col">
              <span className="text-[0.6rem] font-black uppercase text-sky/70 tracking-widest">Partida em Andamento</span>
              <div className="text-sm font-black uppercase">{gameData.teamA || 'Equipe A'} vs {gameData.teamB || 'Equipe B'}</div>
           </div>
           <div className="text-2xl font-black tabular-nums bg-white/10 px-3 py-1 rounded-lg">
             {sumula.scoreA} : {sumula.scoreB}
           </div>
        </div>

        {/* Stepper */}
        <div className="flex gap-1 mb-8 overflow-x-auto pb-2 scrollbar-none">
          {steps.map((s, idx) => (
            <button 
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`flex-1 min-w-[120px] p-3 rounded-lg text-left transition-all ${
                currentStep === idx 
                  ? 'bg-sky text-white shadow-md scale-105 z-10' 
                  : currentStep > idx ? 'bg-green-500/10 text-green-700 border border-green-500/20' : 'bg-white text-slate-400 border border-slate-200'
              }`}
            >
              <div className="text-[0.6rem] font-bold uppercase mb-1">Passo {idx + 1}</div>
              <div className="text-xs font-black uppercase tracking-tight truncate">{s}</div>
            </button>
          ))}
        </div>

        {/* Step Content Wrapper */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[400px]">
           {currentStep === 0 && (
             <div className="p-6 animate-in fade-in slide-in-from-right-4">
                <h3 className="text-lg font-black uppercase text-slate-900 mb-6 border-b pb-4">📋 Identificação Básica</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="flex flex-col gap-1">
                      <label className="text-[0.7rem] font-black uppercase text-slate-500">Competição Oficial</label>
                      <input className="inp-sumula" value={gameData.comp} onChange={e=>setGameData({...gameData, comp: e.target.value})} />
                   </div>
                   <div className="flex flex-col gap-1">
                      <label className="text-[0.7rem] font-black uppercase text-slate-500">Cidade / UF</label>
                      <input className="inp-sumula" value={gameData.city} onChange={e=>setGameData({...gameData, city: e.target.value})} />
                   </div>
                   <div className="flex flex-col gap-1">
                      <label className="text-[0.7rem] font-black uppercase text-slate-500">Local / Ginásio</label>
                      <input className="inp-sumula" value={gameData.gym} onChange={e=>setGameData({...gameData, gym: e.target.value})} />
                   </div>
                   <div className="flex flex-col gap-1">
                      <label className="text-[0.7rem] font-black uppercase text-slate-500">Data do Jogo</label>
                      <input type="date" className="inp-sumula" value={gameData.date} onChange={e=>setGameData({...gameData, date: e.target.value})} />
                   </div>
                </div>
                
                <div className="mt-8 flex justify-end">
                   <button className="btn btn-primary px-8" onClick={()=>setCurrentStep(1)}>Próximo Passo <ChevronRight size={18} /></button>
                </div>
             </div>
           )}

           {currentStep === 1 && (
             <div className="p-0 animate-in fade-in slide-in-from-right-4">
                <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                   {/* Equipe A */}
                   <div className="flex-1 p-6">
                      <div className="flex justify-between items-center mb-6">
                         <h3 className="text-sm font-black uppercase text-sky">🔵 {gameData.teamA || 'EQUIPE A'}</h3>
                         <button className="text-[0.6rem] font-bold uppercase bg-slate-100 px-2 py-1 rounded hover:bg-slate-200" onClick={() => setImportModal({ isOpen: true, team: 'a' })}>Importar Excel</button>
                      </div>
                      <div className="player-header">
                        <span>Nº</span>
                        <span>Nome do Jogador</span>
                        <span>Pos</span>
                        <span>Am</span>
                        <span>Vm</span>
                        <span></span>
                      </div>
                      <div className="flex flex-col">
                        {playersA.map((p, idx) => (
                          <div key={idx} className="player-row">
                            <input 
                              className="inp-cell" 
                              placeholder="00" 
                              value={p.num} 
                              onChange={(e) => updatePlayer('a', p.id, { num: e.target.value })}
                            />
                            <input 
                              className="inp-name-cell" 
                              placeholder="Nome do Atleta" 
                              value={p.name} 
                              onChange={(e) => updatePlayer('a', p.id, { name: e.target.value })}
                            />
                            <span className="text-[0.65rem] font-black text-center">{p.role || '-'}</span>
                            <button 
                              type="button"
                              onClick={() => updatePlayer('a', p.id, { y: !p.y })}
                              className={`card-tog yellow ${p.y ? 'on' : ''}`}
                            >Y</button>
                            <button 
                              type="button"
                              onClick={() => updatePlayer('a', p.id, { r: !p.r })}
                              className={`card-tog red ${p.r ? 'on' : ''}`}
                            >R</button>
                          </div>
                        ))}
                      </div>
                   </div>

                   {/* Equipe B */}
                   <div className="flex-1 p-6">
                      <div className="flex justify-between items-center mb-6">
                         <h3 className="text-sm font-black uppercase text-yellow-600">🟡 {gameData.teamB || 'EQUIPE B'}</h3>
                         <button className="text-[0.6rem] font-bold uppercase bg-slate-100 px-2 py-1 rounded hover:bg-slate-200" onClick={() => setImportModal({ isOpen: true, team: 'b' })}>Importar Excel</button>
                      </div>
                      <div className="player-header">
                        <span>Nº</span>
                        <span>Nome do Jogador</span>
                        <span>Pos</span>
                        <span>Am</span>
                        <span>Vm</span>
                        <span></span>
                      </div>
                      <div className="flex flex-col">
                        {playersB.map((p, idx) => (
                          <div key={idx} className="player-row">
                            <input 
                              className="inp-cell" 
                              placeholder="00" 
                              value={p.num} 
                              onChange={(e) => updatePlayer('b', p.id, { num: e.target.value })}
                            />
                            <input 
                              className="inp-name-cell" 
                              placeholder="Nome do Atleta" 
                              value={p.name} 
                              onChange={(e) => updatePlayer('b', p.id, { name: e.target.value })}
                            />
                            <span className="text-[0.65rem] font-black text-center">{p.role || '-'}</span>
                            <button 
                              type="button"
                              onClick={() => updatePlayer('b', p.id, { y: !p.y })}
                              className={`card-tog yellow ${p.y ? 'on' : ''}`}
                            >Y</button>
                            <button 
                              type="button"
                              onClick={() => updatePlayer('b', p.id, { r: !p.r })}
                              className={`card-tog red ${p.r ? 'on' : ''}`}
                            >R</button>
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
                <div className="p-6 border-t flex justify-between">
                   <button className="btn btn-ghost" onClick={()=>setCurrentStep(0)}><ChevronLeft size={18} /> Anterior</button>
                   <button className="btn btn-primary px-8" onClick={()=>setCurrentStep(3)}>Prosseguir <ChevronRight size={18} /></button>
                </div>
             </div>
           )}

           {currentStep === 3 && (
             <div className="p-6 animate-in fade-in slide-in-from-right-4">
                <div className="flex flex-col md:flex-row gap-8">
                   <div className="flex-1">
                      <div className="bg-sky/5 p-4 rounded-xl border border-sky/10 mb-6">
                        <div className="flex justify-between items-center">
                           <h4 className="text-xs font-black uppercase text-sky">Gols {gameData.teamA || 'Equipe A'}</h4>
                           <button className="btn btn-primary btn-sm" onClick={() => addGoal('a')}>+ Registrar</button>
                        </div>
                        <div className="mt-4 space-y-2">
                          {goalsA.length === 0 ? <p className="text-[0.65rem] italic text-slate-400">Nenhum gol registrado.</p> : goalsA.map(g => (
                            <div key={g.id} className="goal-entry">
                               <div className="goal-min">{g.min}&apos;</div>
                               <div className="text-xs font-bold text-slate-700 flex-1">Nº {g.playerNum}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                   </div>
                   <div className="flex-1">
                      <div className="bg-yellow-500/5 p-4 rounded-xl border border-yellow-500/10 mb-6">
                        <div className="flex justify-between items-center">
                           <h4 className="text-xs font-black uppercase text-yellow-600">Gols {gameData.teamB || 'Equipe B'}</h4>
                           <button className="btn btn-primary btn-sm bg-yellow-500 hover:bg-yellow-600 border-none" onClick={() => addGoal('b')}>+ Registrar</button>
                        </div>
                        <div className="mt-4 space-y-2">
                          {goalsB.length === 0 ? <p className="text-[0.65rem] italic text-slate-400">Nenhum gol registrado.</p> : goalsB.map(g => (
                            <div key={g.id} className="goal-entry">
                               <div className="goal-min">{g.min}&apos;</div>
                               <div className="text-xs font-bold text-slate-700 flex-1">Nº {g.playerNum}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                   </div>
                </div>
                <div className="mt-8 flex justify-between border-t pt-6">
                   <button className="btn btn-ghost" onClick={()=>setCurrentStep(1)}><ChevronLeft size={18} /> Equipes</button>
                   <button className="btn btn-primary px-8" onClick={()=>setCurrentStep(4)}>Arbitragem <ChevronRight size={18} /></button>
                </div>
             </div>
           )}

           {(currentStep === 2 || currentStep === 4 || currentStep === 5) && (
             <div className="p-12 text-center">
                <div className="text-slate-300 mb-4"><Zap size={48} className="mx-auto opacity-20" /></div>
                <h4 className="text-slate-500 font-bold uppercase tracking-tight">Módulo em Desenvolvimento</h4>
                <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">Esta seção será liberada na próxima atualização. Use as abas de Identificação e Gols para testar.</p>
                <button className="btn btn-ghost mt-6 font-black uppercase text-[0.65rem]" onClick={()=>setCurrentStep(0)}>Voltar ao Início</button>
             </div>
           )}
        </div>
      </div>

      <style jsx>{`
        .inp-sumula {
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 14px;
          font-weight: 700;
          color: #1e293b;
          outline: none;
          transition: all 0.2s;
        }
        .inp-sumula:focus {
          border-color: #0ea5e9;
          background: white;
          box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1);
        }
      `}</style>
    </div>
  );
}
