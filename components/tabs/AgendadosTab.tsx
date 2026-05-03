import React from "react";
import { Calendar, ExternalLink, Trash2, Clock } from "lucide-react";
import { AgendadoItem } from "../../lib/types";

interface AgendadosTabProps {
  agendados: AgendadoItem[];
  setAgendados: (val: AgendadoItem[]) => void;
  goTab: (tab: string) => void;
}

export function AgendadosTab({ agendados, setAgendados, goTab }: AgendadosTabProps) {
  const removeAgendado = (id: number) => {
    const updated = agendados.filter(a => a.id !== id);
    setAgendados(updated);
    localStorage.setItem('pt_agendados', JSON.stringify(updated));
  };

  return (
    <div className="tab-page active">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-sky/10 p-2 rounded-lg text-sky"><Calendar /></div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Jogos Agendados</h2>
            <p className="text-xs text-[var(--sub)] font-bold">Acesse links de súmulas criadas anteriormente</p>
          </div>
        </div>

        {agendados.length === 0 ? (
          <div className="text-center py-20 bg-[var(--card)] border border-dashed border-[var(--border)] rounded-3xl">
             <div className="text-[var(--sub)] opacity-20 mb-4"><Calendar size={64} className="mx-auto" /></div>
             <p className="text-[var(--sub)] font-bold italic">Nenhum jogo agendado no momento.</p>
             <button className="btn btn-ghost btn-sm mt-4" onClick={() => goTab('tab-gerar')}>Gerar um Novo Link</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agendados.map(a => (
              <div key={a.id} className="bg-[var(--card)] border border-[var(--border)] p-4 rounded-2xl hover:border-sky/50 transition-all group shadow-sm">
                 <div className="flex justify-between items-start mb-3">
                   <div className="flex items-center gap-2 text-[0.6rem] font-black uppercase text-sky bg-sky/5 px-2 py-1 rounded">
                     <Clock size={12} /> {new Date(a.date).toLocaleDateString('pt-BR')}
                   </div>
                   <button className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1" onClick={() => removeAgendado(a.id)}>
                     <Trash2 size={16} />
                   </button>
                 </div>
                 <h3 className="font-bold text-slate-800 leading-tight mb-4">{a.title}</h3>
                 <a 
                   href={a.url} 
                   target="_blank" 
                   rel="noreferrer" 
                   className="btn btn-primary w-full justify-center text-xs font-black uppercase py-2"
                 >
                   Abrir Súmula <ExternalLink size={14} className="ml-2" />
                 </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
