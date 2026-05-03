import React from "react";
import { History, Search } from "lucide-react";
import { HistoricoItem } from "../../lib/types";

interface HistoryTabProps {
  historico: HistoricoItem[];
  histSearch: string;
  setHistSearch: (val: string) => void;
}

export function HistoryTab({ historico, histSearch, setHistSearch }: HistoryTabProps) {
  return (
     <div className="tab-page active">
       <div className="p-6">
         <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-sky/10 p-2 rounded-lg text-sky"><History /></div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">Histórico de Súmulas</h2>
                <p className="text-xs text-[var(--sub)] font-bold">Registro de todas as partidas enviadas</p>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sub)]" size={16} />
              <input 
                className="inp pl-10 w-full md:w-64" 
                placeholder="Buscar equipe ou comp..." 
                value={histSearch}
                onChange={e => setHistSearch(e.target.value)}
              />
            </div>
         </div>

         <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-x-auto shadow-xl">
           <table className="w-full text-left text-sm">
             <thead>
               <tr className="bg-white/5 border-b border-[var(--border)]">
                 <th className="p-4 font-black uppercase text-[0.65rem] tracking-widest text-[var(--sub)]">Partida</th>
                 <th className="p-4 font-black uppercase text-[0.65rem] tracking-widest text-[var(--sub)]">Resultado</th>
                 <th className="p-4 font-black uppercase text-[0.65rem] tracking-widest text-[var(--sub)]">Data</th>
                 <th className="p-4 font-black uppercase text-[0.65rem] tracking-widest text-[var(--sub)]">Status</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-[var(--border)]">
               {historico.length === 0 ? (
                 <tr><td colSpan={4} className="p-12 text-center text-[var(--sub)] font-bold italic">Nenhum registro encontrado.</td></tr>
               ) : (
                 historico.filter(h => 
                   (h.teamA + h.teamB + h.comp).toLowerCase().includes(histSearch.toLowerCase())
                 ).map(h => (
                   <tr key={h.id} className="hover:bg-white/[0.02] transition-colors">
                     <td className="p-4">
                       <div className="font-bold">{h.teamA} vs {h.teamB}</div>
                       <div className="text-[0.65rem] text-[var(--sub)] font-bold uppercase">{h.comp}</div>
                     </td>
                     <td className="p-4">
                       <div className="font-black text-lg text-sky">{h.golsA} × {h.golsB}</div>
                     </td>
                     <td className="p-4">
                        <div className="text-xs font-mono">{new Date(h.data).toLocaleDateString('pt-BR')}</div>
                     </td>
                     <td className="p-4">
                        <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[0.6rem] font-black uppercase rounded border border-green-500/20">Enviada ✓</span>
                     </td>
                   </tr>
                 ))
               )}
             </tbody>
           </table>
         </div>
       </div>
     </div>
  );
}
