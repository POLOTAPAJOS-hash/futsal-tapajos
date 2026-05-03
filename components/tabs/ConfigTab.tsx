import React from "react";
import { Settings, Save, Smartphone } from "lucide-react";
import { Config } from "../../lib/types";

interface ConfigTabProps {
  config: Config;
  setConfig: (val: Config) => void;
  handleLogout: () => void;
}

export function ConfigTab({ config, setConfig, handleLogout }: ConfigTabProps) {
  const saveConfig = () => {
    localStorage.setItem('pt_config', JSON.stringify(config));
    alert('Configurações salvas!');
  };

  return (
    <div className="tab-page active">
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-slate-200 p-2 rounded-lg text-slate-600"><Settings /></div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Configurações</h2>
            <p className="text-xs text-[var(--sub)] font-bold">Ajustes técnicos e preferências</p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase text-sky mb-4 tracking-widest">Geral</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[0.65rem] font-black uppercase text-[var(--sub)]">Seu Clube/Entidade</label>
                <input className="inp" value={config.clube} onChange={e=>setConfig({...config, clube: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[0.65rem] font-black uppercase text-[var(--sub)]">Cidade Padrão</label>
                <input className="inp" value={config.cidade} onChange={e=>setConfig({...config, cidade: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase text-sky mb-4 tracking-widest">Interface</h3>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-[var(--border)]">
               <div className="flex items-center gap-3">
                 <Smartphone size={20} className="text-[var(--sub)]" />
                 <div className="text-sm font-bold">Modo Mobile Otimizado</div>
               </div>
               <button 
                 className={`w-12 h-6 rounded-full transition-colors relative ${config.mobileMode ? 'bg-sky' : 'bg-slate-300'}`}
                 onClick={() => setConfig({...config, mobileMode: !config.mobileMode})}
               >
                 <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${config.mobileMode ? 'left-7' : 'left-1'}`} />
               </button>
            </div>
          </div>

          <div className="flex gap-4">
             <button className="btn btn-primary flex-1 py-3 font-black uppercase" onClick={saveConfig}>
               <Save size={18} className="mr-2" /> Salvar Tudo
             </button>
             <button className="btn btn-ghost border-red-500/20 text-red-500 hover:bg-red-500/10 flex-1 py-3 font-black uppercase" onClick={handleLogout}>
               Encerrar Sessão
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
