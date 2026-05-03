import React from "react";
import { Zap, Link as LinkIcon } from "lucide-react";
import { GameData, Config } from "../../lib/types";

interface GerarTabProps {
  gameData: GameData;
  setGameData: (val: GameData) => void;
  config: Config;
  gerarLink: () => void;
  gerarESalvarAgendado: () => void;
  generatedUrl: string;
  copied: boolean;
  copiarLink: () => void;
  abrirSumulaGerada: () => void;
  setImportModal: (val: { isOpen: boolean; team: "a" | "b" }) => void;
}

export function GerarTab({
  gameData,
  setGameData,
  gerarLink,
  gerarESalvarAgendado,
  generatedUrl,
  copied,
  copiarLink,
  abrirSumulaGerada,
  setImportModal,
}: GerarTabProps) {
  return (
    <div className="tab-page active">
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-sky/10 p-2 rounded-lg text-sky"><LinkIcon /></div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Gerador de Súmula</h2>
            <p className="text-xs text-[var(--sub)] font-bold">Crie links exclusivos para cada partida</p>
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xl">
          <div className="p-6 bg-white/5 border-b border-[var(--border)]">
             <h3 className="text-sm font-black uppercase text-sky tracking-widest mb-4 flex items-center gap-2">
               <Zap size={14} /> Dados da Partida
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[0.65rem] font-black uppercase text-[var(--sub)]">Competição</label>
                  <input className="inp" list="competitions-list" value={gameData.comp} onChange={e=>setGameData({...gameData, comp: e.target.value})} placeholder="Ex: Copa Tapajós 2026" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[0.65rem] font-black uppercase text-[var(--sub)]">Categoria</label>
                  <input className="inp" list="categorias-list" value={gameData.cat} onChange={e=>setGameData({...gameData, cat: e.target.value})} />
                </div>
             </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="flex flex-col gap-4">
                  <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
                    <label className="text-[0.7rem] font-black uppercase text-blue-400 block mb-2">Equipe A (Mandante)</label>
                    <input className="inp font-bold text-lg" value={gameData.teamA} onChange={e=>setGameData({...gameData, teamA: e.target.value})} placeholder="Nome da Equipe A" />
                    <button className="btn btn-ghost btn-sm mt-3 w-full" onClick={()=>setImportModal({isOpen:true, team:'a'})}>📥 Importar Excel</button>
                  </div>
                  <div className="p-4 bg-yellow-500/5 rounded-xl border border-yellow-500/10">
                    <label className="text-[0.7rem] font-black uppercase text-yellow-500 block mb-2">Equipe B (Visitante)</label>
                    <input className="inp font-bold text-lg" value={gameData.teamB} onChange={e=>setGameData({...gameData, teamB: e.target.value})} placeholder="Nome da Equipe B" />
                    <button className="btn btn-ghost btn-sm mt-3 w-full" onClick={()=>setImportModal({isOpen:true, team:'b'})}>📥 Importar Excel</button>
                  </div>
               </div>
               
               <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[0.65rem] font-black uppercase text-[var(--sub)]">Data</label>
                      <input type="date" className="inp" value={gameData.date} onChange={e=>setGameData({...gameData, date: e.target.value})} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[0.65rem] font-black uppercase text-[var(--sub)]">Hora</label>
                      <input type="time" className="inp" value={gameData.time} onChange={e=>setGameData({...gameData, time: e.target.value})} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[0.65rem] font-black uppercase text-[var(--sub)]">Ginásio / Local</label>
                    <input className="inp" value={gameData.gym} onChange={e=>setGameData({...gameData, gym: e.target.value})} placeholder="Ex: Arena Tapajós" />
                  </div>
               </div>
            </div>

            <div className="mt-8 flex flex-col md:flex-row gap-3">
               <button className="btn btn-primary flex-1 py-3 text-sm font-black uppercase" onClick={gerarESalvarAgendado}>
                 <Zap size={18} className="mr-2" /> Salvar nos Agendados
               </button>
               <button className="btn btn-ghost flex-1 py-3 text-sm font-black uppercase" onClick={gerarLink}>
                 <LinkIcon size={18} className="mr-2" /> Gerar Apenas Link
               </button>
            </div>
          </div>
        </div>

        {generatedUrl && (
          <div className="mt-6 p-6 bg-sky/5 border border-sky/20 rounded-2xl animate-in fade-in slide-in-from-bottom-4">
            <h4 className="text-sky text-xs font-black uppercase tracking-widest mb-3">Link da Súmula Gerado:</h4>
            <div className="flex gap-2">
              <input readOnly className="inp font-mono text-xs flex-1 bg-white/5" value={generatedUrl} />
              <button className={`btn ${copied ? 'bg-green-500' : 'btn-primary'} shrink-0`} onClick={copiarLink}>
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            <div className="mt-4 flex gap-3">
              <button className="btn btn-ghost btn-sm flex-1" onClick={abrirSumulaGerada}>🚀 Abrir agora</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
