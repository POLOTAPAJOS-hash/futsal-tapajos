import React from "react";
import { Home, Link as LinkIcon, Calendar, History, Settings, Zap } from "lucide-react";
import { AgendadoItem, HistoricoItem } from "../lib/types";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (val: boolean) => void;
  activeTab: string;
  goTab: (tab: string) => void;
  agendados: AgendadoItem[];
  historico: HistoricoItem[];
}

export function Sidebar({ 
  sidebarOpen, 
  setSidebarOpen, 
  activeTab, 
  goTab, 
  agendados, 
  historico 
}: SidebarProps) {
  return (
    <>
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} 
        onClick={() => setSidebarOpen(false)}
      ></div>
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">FE</div>
          <div className="flex flex-col">
            <div className="brand-name">FEFUSPA</div>
          </div>
          <button className="lg:hidden p-2 text-[var(--sub)]" onClick={() => setSidebarOpen(false)}>
             <Zap size={20} className="rotate-45" /> 
          </button>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">Sistema</div>
          <div className={`nav-item ${activeTab==='tab-home'?'active':''}`} onClick={()=>goTab('tab-home')}>
            <Home className="nav-icon" size={18} /> Início / Painel
          </div>
          
          <div className="nav-section-label">Operação de Jogo</div>
          <div className={`nav-item ${activeTab==='tab-gerar'?'active':''}`} onClick={()=>goTab('tab-gerar')}>
            <LinkIcon className="nav-icon" size={18} /> Gerar Links
          </div>
          <div className={`nav-item ${activeTab==='tab-sumula'?'active':''}`} onClick={()=>goTab('tab-sumula')}>
            <Zap className="nav-icon" size={18} /> Súmula Digital
          </div>
          
          <div className="nav-section-label">Arquivos Digitais</div>
          <div className={`nav-item ${activeTab==='tab-agendados'?'active':''}`} onClick={()=>goTab('tab-agendados')}>
            <Calendar className="nav-icon" size={18} /> Jogos Agendados
            {agendados.length > 0 && <span className="nav-badge">{agendados.length}</span>}
          </div>
          <div className={`nav-item ${activeTab==='tab-hist'?'active':''}`} onClick={()=>goTab('tab-hist')}>
            <History className="nav-icon" size={18} /> Histórico de Súmulas
            {historico.length > 0 && <span className="nav-badge-alt">{historico.length}</span>}
          </div>

          <div className="mt-8 border-t border-slate-100 pt-4">
            <div className={`nav-item ${activeTab==='tab-config'?'active':''}`} onClick={()=>goTab('tab-config')}>
              <Settings className="nav-icon" size={18} /> Configurações
            </div>
          </div>
        </nav>
        <div className="sidebar-footer">FEFUSPA © 2026<br/>Versão 1.0.0</div>
      </aside>
    </>
  );
}
