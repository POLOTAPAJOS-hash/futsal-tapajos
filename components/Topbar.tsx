import React from "react";
import { Zap } from "lucide-react";
import { User } from "firebase/auth";

interface TopbarProps {
  setSidebarOpen: (val: boolean) => void;
  getTabTitle: () => string;
  user: User | null | undefined;
  handleLogout: () => void;
}

export function Topbar({ setSidebarOpen, getTabTitle, user, handleLogout }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="flex items-center gap-4">
        <button className="hamburger" onClick={() => setSidebarOpen(true)}>
          <div /> <div /> <div />
        </button>
        <h2 className="topbar-title">{getTabTitle()}</h2>
      </div>
      <div className="topbar-right">
        <div className="topbar-badge">
          <Zap size={14} className="text-sky animate-pulse" />
          <span>Módulo Mesário On-line</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="user-pill">
             <span className="text-[var(--sub)] font-bold">{user?.email?.split('@')[0]}</span>
             <button onClick={handleLogout} className="text-red-500 hover:text-red-700 text-[0.7rem] font-black uppercase">Sair</button>
          </div>
        </div>
      </div>
    </header>
  );
}
