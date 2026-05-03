import React from "react";

interface ImportModalProps {
  isOpen: boolean;
  team: "a" | "b";
  teamName: string;
  onClose: () => void;
  setTeam: (team: "a" | "b") => void;
  importData: { headers: string[] } | null;
  setImportData: (val: { headers: string[] } | null) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  colMap: Record<string, string>;
  setColMap: (val: Record<string, string>) => void;
  importStatus: { msg: string; type: string };
  doImportXlsx: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export function ImportModal({
  isOpen,
  team,
  teamName,
  onClose,
  setTeam,
  importData,
  handleFileUpload,
  colMap,
  setColMap,
  importStatus,
  doImportXlsx,
  fileInputRef
}: ImportModalProps) {
  if (!isOpen) return null;

  return (
    <div className={`modal-backdrop open`}>
      <div className="modal">
        <div className="modal-header">
          <h2>📥 Importar Lista de Jogadores</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="team-selector" style={{ marginTop: 0, marginBottom: "1.1rem" }}>
            <label>Importar para:</label>
            <button className={`team-sel-btn ${team === "a" ? "active-a" : ""}`} onClick={() => setTeam("a")}>
              🔵 {teamName || "Equipe A"}
            </button>
            <button className={`team-sel-btn ${team === "b" ? "active-b" : ""}`} onClick={() => setTeam("b")}>
              🟡 {teamName || "Equipe B"}
            </button>
          </div>

          {!importData ? (
            <label className="drop-zone block">
              <input type="file" ref={fileInputRef} accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
              <div className="drop-icon">📄</div>
              <div className="drop-title">Selecione seu Excel/CSV</div>
              <div className="drop-sub">Colunas recomendadas: Número, Nome, Posição</div>
            </label>
          ) : (
            <>
              <div className="col-map" style={{ display: "block" }}>
                <div className="col-map-title text-xs font-black uppercase text-sky mb-4">🔧 Mapeamento de Colunas</div>
                <div className="flex flex-col gap-3 px-2">
                   {['num', 'name', 'pos'].map(field => (
                     <div key={field} className="flex items-center justify-between gap-4">
                        <span className="text-[0.7rem] font-black uppercase text-[var(--sub)]">{field==='num'?'Nº Camisa':field==='name'?'Nome':'Posição'}</span>
                        <select className="col-map-select flex-1 h-8 text-xs" value={colMap[field]} onChange={e => setColMap({ ...colMap, [field]: e.target.value })}>
                          <option value="">— não mapear —</option>
                          {importData.headers.map((h: string, i: number) => <option key={i} value={i}>{h}</option>)}
                        </select>
                     </div>
                   ))}
                </div>
              </div>
            </>
          )}

          {importStatus.msg && (
            <div className={`mt-4 p-2 rounded text-xs font-bold text-center ${importStatus.type === 'ok' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
              {importStatus.msg}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          {importData && (
            <button className="btn btn-primary" onClick={doImportXlsx}>✓ Importar Jogadores</button>
          )}
        </div>
      </div>
    </div>
  );
}
