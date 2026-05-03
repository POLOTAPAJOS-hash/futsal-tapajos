import React from "react";
import { Home, Link as LinkIcon, FileText, Calendar, History, Settings, Zap } from "lucide-react";
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
          <div className="nav-section-label">Principal</div>
          <div className={`nav-item ${activeTab==='tab-home'?'active':''}`} onClick={()=>goTab('tab-home')}><Home className="nav-icon" size={18} /> Início</div>
          <div className={`nav-item ${activeTab==='tab-gerar'?'active':''}`} onClick={()=>goTab('tab-gerar')}><LinkIcon className="nav-icon" size={18} /> Gerar Súmula</div>
          <div className={`nav-item ${activeTab==='tab-sumula'?'active':''}`} onClick={()=>goTab('tab-sumula')}><FileText className="nav-icon" size={18} /> Preencher Súmula</div>
          
          <div className="nav-section-label">Arquivo</div>
          <div className={`nav-item ${activeTab==='tab-agendados'?'active':''}`} onClick={()=>goTab('tab-agendados')}><Calendar className="nav-icon" size={18} /> Jogos Agendados<span className="nav-badge">{agendados.length}</span></div>
          <div className={`nav-item ${activeTab==='tab-hist'?'active':''}`} onClick={()=>goTab('tab-hist')}><History className="nav-icon" size={18} /> Histórico<span className="nav-badge text-black/40">{historico.length}</span></div>

          <div className="mt-auto pt-4 border-t border-black/5">
            <div className={`nav-item ${activeTab==='tab-config'?'active':''}`} onClick={()=>goTab('tab-config')}><Settings className="nav-icon" size={18} /> Configurações</div>
          </div>
        </nav>
        <div className="sidebar-footer">FEFUSPA © 2026<br/>Versão 1.0.0</div>
      </aside>
    </>
  );
}
