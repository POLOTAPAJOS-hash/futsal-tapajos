import React from "react";
import { User } from "firebase/auth";
import { Zap, Smartphone, CheckCircle2 } from "lucide-react";

interface HomeTabProps {
  user: User | null;
  goTab: (tab: string) => void;
  historicoCount: number;
}

export function HomeTab({ user, goTab, historicoCount }: HomeTabProps) {
  return (
    <div className="tab-page active">
      <section className="home-hero">
        <div className="home-badge group">
          <Zap size={14} className="fill-sky text-sky group-hover:scale-110 transition-transform" />
          <span>Sistema Oficial FEFUSPA</span>
        </div>
        <h1 className="home-title">
          Súmula Digital<br/>
          <span className="text-sky">Módulo Mesário</span>
        </h1>
        <p className="home-subtitle">
          Bem-vindo, <strong>{user?.email?.split('@')[0]}</strong>. Organize partidas de futsal com agilidade, precisão e validade oficial.
        </p>

        <div className="home-stats">
          <div className="home-stat">
            <div className="home-stat-val">{historicoCount}</div>
            <div className="home-stat-label">Súmulas Registradas</div>
          </div>
          <div className="home-stat">
            <div className="home-stat-val">2x20</div>
            <div className="home-stat-label">Min. por Tempo</div>
          </div>
          <div className="home-stat">
            <div className="home-stat-val">100%</div>
            <div className="home-stat-label">Nuvem & Seguro</div>
          </div>
        </div>
      </section>

      <section className="p-6">
        <h3 className="section-title">Ações Rápidas</h3>
        <div className="quick-actions">
          <button className="q-btn q-primary" onClick={() => goTab('tab-gerar')}>
            <div className="q-icon"><Zap /></div>
            <div className="q-txt">
              <strong>Nova Partida</strong>
              <span>Gerar link de súmula</span>
            </div>
          </button>
          <button className="q-btn q-outline" onClick={() => goTab('tab-hist')}>
            <div className="q-icon"><CheckCircle2 /></div>
            <div className="q-txt">
              <strong>Histórico</strong>
              <span>Ver súmulas enviadas</span>
            </div>
          </button>
        </div>

        <h3 className="section-title mt-8">Funcionalidades</h3>
        <div className="features-grid">
          <div className="feature-card">
            <div className="f-icon"><Smartphone /></div>
            <div className="f-title">Modo Mobile</div>
            <div className="f-desc">Layout adaptado para tablets e smartphones facilitando o uso na beira da quadra.</div>
          </div>
          <div className="feature-card">
            <div className="f-icon"><Zap /></div>
            <div className="f-title">Registro Instantâneo</div>
            <div className="f-desc">Gols, cartões e substituições registrados em tempo real com cronômetro integrado.</div>
          </div>
        </div>
      </section>
    </div>
  );
}
