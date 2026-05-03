"use client";

import React from "react";
import { useSumulaState } from "../hooks/useSumulaState";
import { LoginForm } from "../components/LoginForm";
import { Sidebar } from "../components/Sidebar";
import { Topbar } from "../components/Topbar";
import { ImportModal } from "../components/ImportModal";

// Tabs
import { HomeTab } from "../components/tabs/HomeTab";
import { GerarTab } from "../components/tabs/GerarTab";
import { SumulaTab } from "../components/tabs/SumulaTab";
import { HistoryTab } from "../components/tabs/HistoryTab";
import { AgendadosTab } from "../components/tabs/AgendadosTab";
import { ConfigTab } from "../components/tabs/ConfigTab";

export default function App() {
  const state = useSumulaState();

  // Se não estiver montado ou carregando usuário, não renderiza nada (evita flicker)
  if (!state.isMounted || state.user === undefined) return null;

  // Mostra tela de login se não houver usuário autenticado
  if (state.user === null) {
    return (
      <LoginForm
        handleAuth={state.handleAuth}
        email={state.email}
        setEmail={state.setEmail}
        password={state.password}
        setPassword={state.setPassword}
        authError={state.authError}
        authMode={state.authMode}
        setAuthMode={state.setAuthMode}
        setAuthError={state.setAuthError}
      />
    );
  }

  // Helper para títulos dinâmicos do topo
  const getTabTitle = () => {
    const titles: Record<string, string> = {
      "tab-home": "Módulo Mesário",
      "tab-gerar": "Gerar Nova Súmula",
      "tab-sumula": "Preenchimento de Súmula",
      "tab-agendados": "Jogos Agendados",
      "tab-hist": "Histórico de Súmulas",
      "tab-config": "Configurações",
    };
    return titles[state.activeTab] || "FEFUSPA - Súmula Digital";
  };

  return (
    <div className="app-shell">
      {/* 1. MÓDULO: NAVEGAÇÃO LATERAL (SIDEBAR) */}
      <Sidebar
        sidebarOpen={state.sidebarOpen}
        setSidebarOpen={state.setSidebarOpen}
        activeTab={state.activeTab}
        goTab={state.goTab}
        agendados={state.agendados}
        historico={state.historico}
      />

      <div className="main-content">
        {/* 2. MÓDULO: BARRA SUPERIOR (TOPBAR) */}
        <Topbar
          setSidebarOpen={state.setSidebarOpen}
          getTabTitle={getTabTitle}
          user={state.user}
          handleLogout={state.handleLogout}
        />

        {/* 3. MÓDULOS DE CONTEÚDO (HTML DAS ABAS) */}
        <main className="flex-1 overflow-y-auto">
          {state.activeTab === "tab-home" && (
            <HomeTab
              user={state.user}
              goTab={state.goTab}
              historicoCount={state.historico.length}
            />
          )}

          {state.activeTab === "tab-gerar" && (
            <GerarTab
              gameData={state.gameData}
              setGameData={state.setGameData}
              config={state.config}
              gerarLink={state.gerarLink}
              gerarESalvarAgendado={state.gerarESalvarAgendado}
              generatedUrl={state.generatedUrl}
              copied={state.copied}
              copiarLink={state.copiarLink}
              abrirSumulaGerada={() => state.goTab("tab-sumula")}
              setImportModal={state.setImportModal}
            />
          )}

          {state.activeTab === "tab-sumula" && (
            <SumulaTab
              currentStep={state.currentStep}
              setCurrentStep={state.setCurrentStep}
              gameData={state.gameData}
              setGameData={state.setGameData}
              sumula={state.sumula}
              setSumula={state.setSumula}
              playersA={state.playersA}
              playersB={state.playersB}
              goalsA={state.goalsA}
              goalsB={state.goalsB}
              updatePlayer={state.updatePlayer}
              addGoal={state.addGoal}
              setImportModal={state.setImportModal}
            />
          )}

          {state.activeTab === "tab-agendados" && (
            <AgendadosTab
              agendados={state.agendados}
              setAgendados={state.setAgendados}
              goTab={state.goTab}
            />
          )}

          {state.activeTab === "tab-hist" && (
            <HistoryTab
              historico={state.historico}
              histSearch={state.histSearch}
              setHistSearch={state.setHistSearch}
            />
          )}

          {state.activeTab === "tab-config" && (
            <ConfigTab
              config={state.config}
              setConfig={state.setConfig}
              handleLogout={state.handleLogout}
            />
          )}
        </main>
      </div>

      {/* 4. MODAL GLOBAL DE IMPORTAÇÃO (JS + HTML) */}
      <ImportModal
        isOpen={state.importModal.isOpen}
        team={state.importModal.team}
        teamName={state.importModal.team === "a" ? state.gameData.teamA : state.gameData.teamB}
        onClose={() => state.setImportModal({ ...state.importModal, isOpen: false })}
        setTeam={(team) => state.setImportModal({ ...state.importModal, team })}
        importData={state.importData}
        setImportData={state.setImportData}
        handleFileUpload={state.handleFileUpload}
        colMap={state.colMap}
        setColMap={state.setColMap}
        importStatus={{ msg: "", type: "ok" }}
        doImportXlsx={state.doImportXlsx}
        fileInputRef={React.createRef()}
      />
    </div>
  );
}
