'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';

export default function App() {
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('tab-home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Config
  const [config, setConfig] = useState({
    clube: 'FEFUSPA', cidade: 'Santarém', estado: 'PA', ginasio: '',
    comp: '', cat: 'Adulto / Masculino', temp: '', nextNum: 1
  });

  // Game data from generator
  const [gameData, setGameData] = useState({
    comp: '', cat: 'Adulto / Masculino', num: '01', group: 'A', fase: '',
    teamA: '', teamB: '', gym: '', city: '', date: '', time: '20:00',
    rosterA: '', rosterB: '',
    techA: '', auxA: '', prepA: '', massA: '', medA: '', supA: '',
    techB: '', auxB: '', prepB: '', massB: '', medB: '', supB: ''
  });

  const [generatedUrl, setGeneratedUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const [teamShields, setTeamShields] = useState({ a: '', b: '' });

  const [cardModal, setCardModal] = useState<{isOpen: boolean, team: 'a'|'b', pId: number, type: 'y'|'r'} | null>(null);
  const [cardTime, setCardTime] = useState({ min: '', period: '1º Per.' });

  // Sumula Data
  const [sumula, setSumula] = useState({
    p1i: '', p1f: '', p2i: '', p2f: '', pei: '', pef: '',
    techA: '', techB: '',
    scoreA: 0, scoreB: 0,
    arb1: '', arb2: '', arb3: '', arb4: '', arb5: '', arb6: ''
  });

  type Player = { 
    id: number; num: string; name: string; 
    y: boolean; yMin?: string; yPer?: string; 
    r: boolean; rMin?: string; rPer?: string; 
    role: string; 
  };
  type Goal = { id: number; name: string; period: string; min: string; };

  const [playersA, setPlayersA] = useState<Player[]>([]);
  const [playersB, setPlayersB] = useState<Player[]>([]);
  const [goalsA, setGoalsA] = useState<Goal[]>([]);
  const [goalsB, setGoalsB] = useState<Goal[]>([]);
  
  type Sub = { id: number; in: string; out: string; period: string; min: string; };
  const [subsA, setSubsA] = useState<Sub[]>([]);
  const [subsB, setSubsB] = useState<Sub[]>([]);

  const [faultsA1, setFaultsA1] = useState(0);
  const [faultsA2, setFaultsA2] = useState(0);
  const [faultsB1, setFaultsB1] = useState(0);
  const [faultsB2, setFaultsB2] = useState(0);

  // Histórico & Agendados
  const [historico, setHistorico] = useState<any[]>([]);
  const [histSearch, setHistSearch] = useState('');
  const [agendados, setAgendados] = useState<any[]>([]);

  // Import Modal
  const [importModal, setImportModal] = useState<{isOpen: boolean, team: 'a'|'b'}>({isOpen: false, team: 'a'});
  const [importData, setImportData] = useState<{headers: string[], rows: any[][]}|null>(null);
  const [colMap, setColMap] = useState({num: '', name: '', pos: ''});
  const [importStatus, setImportStatus] = useState({msg: '', type: ''});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ----- SUMULA INIT -----
  const initSumulaInitialData = React.useCallback((rA?: string, rB?: string) => {
    let freshA = Array.from({length: 5}).map((_,i) => ({ id: i, num: '', name: '', y: false, r: false, role: i===0?'G':'' }));
    let freshB = Array.from({length: 5}).map((_,i) => ({ id: i+100, num: '', name: '', y: false, r: false, role: i===0?'G':'' }));
    
    if (rA) {
      const names = rA.split('\n').map(n => n.trim()).filter(Boolean);
      if (names.length > 0) {
        freshA = names.map((line, i) => {
          let num = ''; let name = line;
          const match = line.match(/^(\d{1,3})\s*[-\.]?\s+(.*)$/);
          if (match) { num = match[1]; name = match[2]; }
          return { id: i, num, name, y: false, r: false, role: i===0?'G':'' };
        });
      }
    }
    if (rB) {
      const names = rB.split('\n').map(n => n.trim()).filter(Boolean);
      if (names.length > 0) {
        freshB = names.map((line, i) => {
          let num = ''; let name = line;
          const match = line.match(/^(\d{1,3})\s*[-\.]?\s+(.*)$/);
          if (match) { num = match[1]; name = match[2]; }
          return { id: i+100, num, name, y: false, r: false, role: i===0?'G':'' };
        });
      }
    }

    setPlayersA(freshA); setPlayersB(freshB);
    setGoalsA([]); setGoalsB([]);
    setFaultsA1(0); setFaultsA2(0); setFaultsB1(0); setFaultsB2(0);
    setSumula(s => ({ ...s, scoreA: 0, scoreB: 0 }));
    setCurrentStep(0);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line
    setIsMounted(true);
    const savedConfig = localStorage.getItem('pt_config');
    if (savedConfig) setConfig(JSON.parse(savedConfig));
    const savedHist = localStorage.getItem('pt_historico');
    if (savedHist) setHistorico(JSON.parse(savedHist));
    const savedAgendados = localStorage.getItem('pt_agendados');
    if (savedAgendados) setAgendados(JSON.parse(savedAgendados));

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('sumula') === '1') {
        setGameData({
          comp: params.get('comp') || '',
          cat: params.get('cat') || 'Adulto / Masculino',
          num: params.get('num') || '01',
          group: params.get('group') || 'A',
          fase: params.get('fase') || '',
          teamA: params.get('teamA') || 'EQUIPE A',
          teamB: params.get('teamB') || 'EQUIPE B',
          gym: params.get('gym') || '',
          city: params.get('city') || '',
          date: params.get('date') || '',
          time: params.get('time') || '20:00',
          rosterA: params.get('rosterA') || '',
          rosterB: params.get('rosterB') || '',
          techA: params.get('techA') || '',
          auxA: params.get('auxA') || '',
          prepA: params.get('prepA') || '',
          massA: params.get('massA') || '',
          medA: params.get('medA') || '',
          supA: params.get('supA') || '',
          techB: params.get('techB') || '',
          auxB: params.get('auxB') || '',
          prepB: params.get('prepB') || '',
          massB: params.get('massB') || '',
          medB: params.get('medB') || '',
          supB: params.get('supB') || '',
        });
        initSumulaInitialData(params.get('rosterA') || '', params.get('rosterB') || '');
        setActiveTab('tab-sumula');
      } else if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        if (parsed.nextNum) {
          setGameData(prev => ({ ...prev, num: String(parsed.nextNum).padStart(2, '0') }));
        }
      }
    }
  // eslint-disable-next-line
  }, [initSumulaInitialData]);

  const goTab = (id: string) => {
    setActiveTab(id);
    setSidebarOpen(false);
    window.scrollTo(0, 0);
  };

  const getTabTitle = () => {
    const titles: Record<string, string> = {
      'tab-home': 'Início', 'tab-gerar': 'Gerar Súmula', 'tab-sumula': 'Preencher Súmula',
      'tab-agendados': 'Jogos Agendados', 'tab-hist': 'Histórico', 'tab-config': 'Configurações', 'tab-success': 'Súmula Registrada'
    };
    return titles[activeTab] || 'Súmula Digital';
  };

  // ----- GENERATOR ------
  const advanceGameNum = () => {
    setGameData(prev => {
      const currentNum = parseInt(prev.num || '0');
      if (!isNaN(currentNum)) {
        const nextNumVal = currentNum + 1;
        const nextNumStr = String(nextNumVal).padStart(2, '0');
        
        setConfig(c => {
          const newConf = { ...c, nextNum: nextNumVal };
          localStorage.setItem('pt_config', JSON.stringify(newConf));
          return newConf;
        });
        
        return { ...prev, num: nextNumStr };
      }
      return prev;
    });
  };

  const gerarLink = () => {
    const params = new URLSearchParams(gameData as Record<string, string>).toString();
    const base = window.location.href.split('?')[0].replace(/#.*/, '');
    setGeneratedUrl(base + '?sumula=1&' + params);
  };
  const gerarESalvarAgendado = () => {
    const params = new URLSearchParams(gameData as Record<string, string>).toString();
    const base = window.location.href.split('?')[0].replace(/#.*/, '');
    const url = base + '?sumula=1&' + params;
    setGeneratedUrl(url);

    const nomeJogo = `${gameData.teamA || 'Equipe A'} vs ${gameData.teamB || 'Equipe B'} - ${gameData.comp || 'Amistoso'}`;
    const newAgendados = [{ id: Date.now(), title: nomeJogo, url: url, date: gameData.date || new Date().toISOString().slice(0, 10) }, ...agendados];
    setAgendados(newAgendados);
    localStorage.setItem('pt_agendados', JSON.stringify(newAgendados));
    alert('Súmula gerada e salva nos agendados!');
    advanceGameNum();
    goTab('tab-agendados');
  };
  const copiarLink = () => {
    navigator.clipboard.writeText(generatedUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  const abrirSumulaGerada = () => {
    initSumulaInitialData(gameData.rosterA, gameData.rosterB);
    goTab('tab-sumula');
  };

  const salvarAgendado = () => {
    if (!generatedUrl) return;
    const nomeJogo = `${gameData.teamA || 'Equipe A'} vs ${gameData.teamB || 'Equipe B'} - ${gameData.comp || 'Amistoso'}`;
    const newAgendados = [{ id: Date.now(), title: nomeJogo, url: generatedUrl, date: gameData.date || new Date().toISOString().slice(0, 10) }, ...agendados];
    setAgendados(newAgendados);
    localStorage.setItem('pt_agendados', JSON.stringify(newAgendados));
    alert('Link da súmula foi agendado!');
    advanceGameNum();
  };
  const openDemoSumula = () => {
    setGameData({
      comp: 'Supercopa de Futsal', cat: 'Adulto / Masculino', num: '02', group: 'B', fase: '1ª Fase - Grupo B',
      teamA: 'FEFUSPA', teamB: 'ASECSJJ', gym: 'Arena Tapajós', city: 'Santarém - PA',
      date: new Date().toISOString().split('T')[0], time: '20:00',
      rosterA: '', rosterB: ''
    });
    initSumulaInitialData();
    goTab('tab-sumula');
  };

  const addPlayer = (team: 'a'|'b') => {
    const list = team === 'a' ? playersA : playersB;
    const setList = team === 'a' ? setPlayersA : setPlayersB;
    setList([...list, { id: Date.now() + Math.random(), num: '', name: '', y: false, r: false, role: '' }]);
  };
  const updatePlayer = (team: 'a'|'b', id: number, field: string, val: any) => {
    const setList = team === 'a' ? setPlayersA : setPlayersB;
    setList(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
  };

  const handleCardClick = (team: 'a'|'b', p: Player, type: 'y'|'r') => {
    const isCurrentlyOn = type === 'y' ? p.y : p.r;
    if (isCurrentlyOn) {
      const setList = team === 'a' ? setPlayersA : setPlayersB;
      setList(prev => prev.map(x => {
        if (x.id !== p.id) return x;
        if (type === 'y') return { ...x, y: false, yMin: '', yPer: '' };
        return { ...x, r: false, rMin: '', rPer: '' };
      }));
    } else {
      setCardModal({ isOpen: true, team, pId: p.id, type });
      setCardTime({ min: '', period: '1º Per.' });
    }
  };

  const saveCardTime = () => {
    if (!cardModal) return;
    const setList = cardModal.team === 'a' ? setPlayersA : setPlayersB;
    setList(prev => prev.map(x => {
      if (x.id !== cardModal.pId) return x;
      if (cardModal.type === 'y') {
        return { ...x, y: true, yMin: cardTime.min, yPer: cardTime.period };
      } else {
        return { ...x, r: true, rMin: cardTime.min, rPer: cardTime.period };
      }
    }));
    setCardModal(null);
  };

  const handleTimeChange = (val: string) => {
    let v = val.replace(/[^\d:]/g, '');
    const parts = v.split(':');
    if (parts.length > 2) {
      return parts.slice(0, 2).join(':');
    }
    if (parts.length === 2) {
      return parts[0].substring(0, 2) + ':' + parts[1].substring(0, 2);
    }
    if (v.length > 2 && !v.includes(':')) {
      return v.substring(0, 2) + ':' + v.substring(2, 4);
    }
    return v;
  };

  const addGoal = (team: 'a'|'b') => {
    if(team === 'a') {
      setGoalsA([...goalsA, { id: Date.now(), name: '', period: '1º Per.', min: '' }]);
      setSumula(s => ({...s, scoreA: s.scoreA + 1}));
    } else {
      setGoalsB([...goalsB, { id: Date.now(), name: '', period: '1º Per.', min: '' }]);
      setSumula(s => ({...s, scoreB: s.scoreB + 1}));
    }
  };
  const removeGoal = (team: 'a'|'b', id: number) => {
    if(team === 'a') {
      setGoalsA(goalsA.filter(g => g.id !== id));
      setSumula(s => ({...s, scoreA: Math.max(0, s.scoreA - 1)}));
    } else {
      setGoalsB(goalsB.filter(g => g.id !== id));
      setSumula(s => ({...s, scoreB: Math.max(0, s.scoreB - 1)}));
    }
  };

  const addSub = (team: 'a'|'b') => {
    const newSub = { id: Date.now(), in: '', out: '', period: '1º Per.', min: '' };
    if(team === 'a') setSubsA([...subsA, newSub]);
    else setSubsB([...subsB, newSub]);
  };
  const removeSub = (team: 'a'|'b', id: number) => {
    if(team === 'a') setSubsA(subsA.filter(s => s.id !== id));
    else setSubsB(subsB.filter(s => s.id !== id));
  };

  // ----- FINALIZAR ------
  const submitSumula = () => {
    const reg = {
      id: Date.now(),
      data: gameData.date || new Date().toISOString().slice(0,10),
      teamA: gameData.teamA || 'Equipe A',
      teamB: gameData.teamB || 'Equipe B',
      golsA: sumula.scoreA, golsB: sumula.scoreB,
      comp: gameData.comp || '—', gym: gameData.gym || '—',
      status: 'Registrada', arb: sumula.arb1 || '—'
    };
    const newHist = [reg, ...historico];
    setHistorico(newHist);
    localStorage.setItem('pt_historico', JSON.stringify(newHist));
    advanceGameNum();
    goTab('tab-success');
  };

  // ----- IMPORT XLSX ------
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(!file) return;
    setImportStatus({msg: 'Lendo arquivo...', type: ''});
    
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv') {
      const reader = new FileReader();
      reader.onload = ev => {
        const text = ev.target?.result as string;
        const sep = text.includes(';') ? ';' : ',';
        const rows = text.trim().split('\n').map(r => r.split(sep).map(c => c.replace(/^["']|["']$/g, '').trim()));
        processParsed(file.name, rows);
      };
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = new Uint8Array(ev.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' });
          processParsed(file.name, rows);
        } catch (err: any) {
          setImportStatus({msg: 'Erro: ' + err.message, type: 'err'});
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const processParsed = (name: string, rows: any[][]) => {
    if(!rows || rows.length < 2) { setImportStatus({msg: 'Arquivo vazio ou sem registros', type: 'err'}); return; }
    const headers = rows[0].map((h, i) => h ? String(h).trim() : `Col ${i+1}`);
    const dataRows = rows.slice(1).filter(r => r.some(c => !!c));
    setImportData({headers, rows: dataRows});
    
    // auto detect
    let nm='', n='', p='';
    headers.forEach((h,i) => {
      const hl = h.toLowerCase();
      if(hl.includes('nome')||hl.includes('atleta')||hl.includes('jogador')) nm = i.toString();
      if(hl.includes('num')||hl.includes('nº')||hl.includes('#')||hl.includes('camisa')) n = i.toString();
      if(hl.includes('pos')) p = i.toString();
    });
    setColMap({num: n, name: nm, pos: p});
    setImportStatus({msg: `${dataRows.length} linhas encontradas.`, type: 'ok'});
  };

  const doImportXlsx = () => {
    if(!colMap.name) { setImportStatus({msg: 'Selecione a coluna de Nome', type: 'err'}); return; }
    const posMap: Record<string, string> = { 'gol': 'G', 'goleiro': 'G', 'capitão': 'C', 'cap': 'C', 'g/c': 'G/C' };
    
    const newPlayers = importData!.rows.map((r,i) => {
      const name = String(r[parseInt(colMap.name)] || '').trim();
      const num = colMap.num ? String(r[parseInt(colMap.num)] || '').trim() : '';
      const rawPos = colMap.pos ? String(r[parseInt(colMap.pos)] || '').trim().toLowerCase() : '';
      return { id: Date.now() + i, num, name, y: false, r: false, role: posMap[rawPos] || '' };
    }).filter(p => p.name);

    if (activeTab === 'tab-gerar') {
      const rosterText = newPlayers.map(p => {
        let line = p.name;
        if (p.num) line = p.num + ' - ' + line;
        return line;
      }).join('\n');
      if (importModal.team === 'a') {
        setGameData(prev => ({ ...prev, rosterA: rosterText }));
      } else {
        setGameData(prev => ({ ...prev, rosterB: rosterText }));
      }
    } else {
      if(importModal.team === 'a') setPlayersA(newPlayers);
      else setPlayersB(newPlayers);
    }

    setImportStatus({msg: `${newPlayers.length} jogadores importados!`, type: 'ok'});
    setTimeout(() => {
      setImportModal({...importModal, isOpen: false});
      setImportData(null);
      if(fileInputRef.current) fileInputRef.current.value = '';
    }, 1500);
  };

  const handleShieldUpload = (team: 'a'|'b', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setTeamShields(prev => ({ ...prev, [team]: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // ----- RENDER -----
  if (!isMounted) return null;

  const categoriasMenu = [
    ...Array.from({length: 14}, (_, i) => { const n = i+7; return `Sub-${n < 10 ? '0'+n : n}`; }),
    'Adulto / Masculino',
    'Adulto / Feminino'
  ];

  return (
    <div className="app-shell">
      <datalist id="categorias-list">
        {categoriasMenu.map(c => <option key={c} value={c} />)}
      </datalist>

      <datalist id="fases-list">
        <option value="Fase Classificatória" />
        <option value="Fase Eliminatória" />
        <option value="Fase Final" />
      </datalist>

      {/* SIDEBAR OVERLAY */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* IMPORT MODAL */}
      <div className={`modal-backdrop ${importModal.isOpen ? 'open' : ''}`}>
        <div className="modal">
          <div className="modal-header">
            <h2>📥 Importar Lista de Jogadores</h2>
            <button className="modal-close" onClick={() => setImportModal({...importModal, isOpen: false})}>✕</button>
          </div>
          <div className="modal-body">
            <div className="team-selector" style={{marginTop:0, marginBottom:'1.1rem'}}>
              <label>Importar para:</label>
              <button className={`team-sel-btn ${importModal.team === 'a' ? 'active-a' : ''}`} onClick={() => setImportModal({...importModal, team:'a'})}>🔵 {gameData.teamA || 'Equipe A'}</button>
              <button className={`team-sel-btn ${importModal.team === 'b' ? 'active-b' : ''}`} onClick={() => setImportModal({...importModal, team:'b'})}>🟡 {gameData.teamB || 'Equipe B'}</button>
            </div>
            
            {!importData ? (
              <label className="drop-zone block">
                <input type="file" ref={fileInputRef} accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
                <div className="drop-icon">📄</div>
                <div className="drop-title">Clique para selecionar seu Excel/CSV</div>
                <div className="drop-sub">Colunas recomendadas: Número, Nome, Posição</div>
                <div className="drop-formats">
                  <span className="drop-fmt">XLSX</span><span className="drop-fmt">CSV</span>
                </div>
              </label>
            ) : (
              <>
                <div className="col-map" style={{display:'block'}}>
                  <div className="col-map-title">🔧 Mapeamento de Colunas</div>
                  <div className="col-map-row">
                    <span className="col-map-label">Nº Camisa</span><span className="col-map-arrow">→</span>
                    <select className="col-map-select" value={colMap.num} onChange={e=>setColMap({...colMap, num:e.target.value})}>
                      <option value="">— não mapear —</option>
                      {importData.headers.map((h,i)=><option key={i} value={i}>{h}</option>)}
                    </select>
                  </div>
                  <div className="col-map-row">
                    <span className="col-map-label">Nome do Jogador</span><span className="col-map-arrow">→</span>
                    <select className="col-map-select" value={colMap.name} onChange={e=>setColMap({...colMap, name:e.target.value})}>
                      <option value="">— não mapear —</option>
                      {importData.headers.map((h,i)=><option key={i} value={i}>{h}</option>)}
                    </select>
                  </div>
                  <div className="col-map-row">
                    <span className="col-map-label">Posição</span><span className="col-map-arrow">→</span>
                    <select className="col-map-select" value={colMap.pos} onChange={e=>setColMap({...colMap, pos:e.target.value})}>
                      <option value="">— não mapear —</option>
                      {importData.headers.map((h,i)=><option key={i} value={i}>{h}</option>)}
                    </select>
                  </div>
                </div>
                <div className="preview-wrap" style={{display:'block'}}>
                  <div className="preview-header">
                    <h4>Prévia dos dados</h4>
                  </div>
                  <div className="preview-table-wrap">
                    <table className="preview-table">
                      <thead><tr>{importData.headers.map((h,i)=><th key={i}>{h}</th>)}</tr></thead>
                      <tbody>
                        {importData.rows.slice(0,4).map((r, i) => (
                          <tr key={i}>{importData.headers.map((_,ci)=><td key={ci}>{r[ci]}</td>)}</tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
            
            {importStatus.msg && <div className={`import-status ${importStatus.type} !block`}>{importStatus.msg}</div>}
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setImportModal({...importModal, isOpen: false})}>Cancelar</button>
            {importData && <button className="btn btn-ghost btn-sm" onClick={() => { setImportData(null); setImportStatus({msg:'', type:''}); if(fileInputRef.current) fileInputRef.current.value = ''; }}>🗑 Limpar</button>}
            {importData && <button className="btn btn-primary" onClick={doImportXlsx}>✓ Importar Jogadores</button>}
          </div>
        </div>
      </div>

      {/* CARD MODAL */}
      {cardModal && (
        <div className={`modal-backdrop ${cardModal.isOpen ? 'open' : ''}`}>
          <div className="modal" style={{maxWidth: '300px'}}>
            <div className="modal-header">
              <h2>Registrar Cartão {cardModal.type === 'y' ? 'Amarelo' : 'Vermelho'}</h2>
              <button className="modal-close" onClick={() => setCardModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group flex flex-col gap-2">
                <label>Período</label>
                <select className="inp" value={cardTime.period} onChange={e=>setCardTime({...cardTime, period: e.target.value})}>
                  <option>1º Per.</option>
                  <option>2º Per.</option>
                  <option>Prorrog.</option>
                </select>
                <label>Tempo (min:seg)</label>
                <input className="inp" value={cardTime.min} maxLength={5} inputMode="numeric" onChange={e=>setCardTime({...cardTime, min: handleTimeChange(e.target.value)})} placeholder="Ex: 05:30" />
              </div>
            </div>
            <div className="modal-footer">
               <button className="btn btn-ghost" onClick={() => setCardModal(null)}>Cancelar</button>
               <button className="btn btn-primary" onClick={saveCardTime}>✓ Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">FE</div>
          <div className="brand-text">
            <div className="brand-name">FEFUSPA</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">Principal</div>
          <div className={`nav-item ${activeTab==='tab-home'?'active':''}`} onClick={()=>goTab('tab-home')}><span className="nav-icon">🏠</span> Início</div>
          <div className={`nav-item ${activeTab==='tab-gerar'?'active':''}`} onClick={()=>goTab('tab-gerar')}><span className="nav-icon">🔗</span> Gerar Súmula</div>
          <div className={`nav-item ${activeTab==='tab-sumula'?'active':''}`} onClick={()=>goTab('tab-sumula')}><span className="nav-icon">📋</span> Preencher Súmula</div>
          <div className="nav-section-label">Gestão</div>
          <div className={`nav-item ${activeTab==='tab-agendados'?'active':''}`} onClick={()=>goTab('tab-agendados')}><span className="nav-icon">📅</span> Jogos Agendados<span className="nav-badge">{agendados.length}</span></div>
          <div className={`nav-item ${activeTab==='tab-hist'?'active':''}`} onClick={()=>goTab('tab-hist')}><span className="nav-icon">📁</span> Histórico<span className="nav-badge">{historico.length}</span></div>
          <div className={`nav-item ${activeTab==='tab-config'?'active':''}`} onClick={()=>goTab('tab-config')}><span className="nav-icon">⚙️</span> Configurações</div>
        </nav>
        <div className="sidebar-footer">FEFUSPA © 2024<br/>Versão 1.0.0</div>
      </aside>

      <div className="main-content">
        <div className="topbar">
          <div style={{display:'flex', alignItems:'center', gap:'.75rem'}}>
            <div className="hamburger" onClick={() => setSidebarOpen(true)}>
              <span/><span/><span/>
            </div>
            <span className="topbar-title">{getTabTitle()}</span>
          </div>
          <div className="topbar-right"><div className="topbar-badge">Sistema Online</div></div>
        </div>

        {/* TAB HOME */}
        <div className={`tab-page ${activeTab === 'tab-home' ? 'active' : ''}`}>
          <div className="home-hero">
            <div className="home-badge">☆ Sistema Digital FEFUSPA</div>
            <h1 className="home-title">SÚMULA<br/><em>DIGITAL</em><br/><span>FEFUSPA</span></h1>
            <p className="home-sub">Gerencie súmulas de futsal online, gere links exclusivos por partida e registre tudo de forma digital — sem papel, sem complicação.</p>
            <div className="home-actions">
              <button className="btn btn-primary" onClick={() => goTab('tab-gerar')}>⚡ Gerar Link de Súmula</button>
              <button className="btn btn-ghost" onClick={openDemoSumula}>👁 Ver Demonstração</button>
            </div>
          </div>
          <div className="home-stats">
            <div className="home-stat"><div className="home-stat-num">100%</div><div className="home-stat-lbl">Digital</div></div>
            <div className="home-stat"><div className="home-stat-num">CBFS</div><div className="home-stat-lbl">Padrão oficial</div></div>
            <div className="home-stat"><div className="home-stat-num">2 min</div><div className="home-stat-lbl">Para gerar</div></div>
            <div className="home-stat"><div className="home-stat-num">PDF</div><div className="home-stat-lbl">Exportação</div></div>
          </div>
          <div className="features-section">
            <div className="section-head"><h2>Funcionalidades</h2></div>
            <div className="features-grid">
              <div className="feat-card"><div className="feat-icon">🔗</div><div className="feat-title">Link Único por Jogo</div><div className="feat-desc">URL exclusiva com dados pré-preenchidos para facilitar o trabalho da mesa.</div></div>
              <div className="feat-card"><div className="feat-icon">📋</div><div className="feat-title">Padrão CBFS</div><div className="feat-desc">Todos os campos seguem o modelo oficial da confederação.</div></div>
              <div className="feat-card"><div className="feat-icon">⚽</div><div className="feat-title">Gols em Tempo Real</div><div className="feat-desc">Registre gols com autor, período e minuto instantaneamente.</div></div>
              <div className="feat-card"><div className="feat-icon">📱</div><div className="feat-title">Mobile First</div><div className="feat-desc">Interface adaptada para tablets e celulares.</div></div>
            </div>
          </div>
          <div style={{padding:'0 2.5rem'}}><div className="section-head"><h2>Ações Rápidas</h2></div></div>
          <div className="quick-actions">
             <div className="quick-card" onClick={() => goTab('tab-gerar')}><div className="quick-card-icon">🔗</div><div className="quick-card-title">Gerar Link de Súmula</div><div className="quick-card-desc">Crie um link fácil para o mesário preencher na hora.</div></div>
             <div className="quick-card" onClick={openDemoSumula}><div className="quick-card-icon">📝</div><div className="quick-card-title">Preencher Súmula Demo</div><div className="quick-card-desc">Faça um test-drive em uma súmula já pronta.</div></div>
             <div className="quick-card" onClick={() => goTab('tab-hist')}><div className="quick-card-icon">📁</div><div className="quick-card-title">Ver Histórico</div><div className="quick-card-desc">Exporte ou acesse todas as súmulas processadas.</div></div>
             <div className="quick-card" onClick={() => goTab('tab-config')}><div className="quick-card-icon">⚙️</div><div className="quick-card-title">Configurações</div><div className="quick-card-desc">Ajuste regras padrão, clube ou preferências do sistema.</div></div>
          </div>
        </div>

        {/* TAB GERAR */}
        <div className={`tab-page ${activeTab === 'tab-gerar' ? 'active' : ''}`}>
          <div className="gen-body">
            <div className="page-heading">
              <h1>Gerar Link de Súmula</h1>
              <p>Preencha os dados da partida para criar o link exclusivo de preenchimento.</p>
            </div>
            
            <div className="form-card">
              <div className="form-card-title">🏆 Competição</div>
              <div className="form-row border-b border-white/5 pb-4 mb-4">
                <div className="form-group"><label>Competição</label><input className="inp" value={gameData.comp} onChange={e=>setGameData({...gameData,comp:e.target.value})} placeholder="Ex.: Supercopa de Futsal" /></div>
                <div className="form-group"><label>Categoria</label>
                  <input list="categorias-list" className="inp" value={gameData.cat} onChange={e=>setGameData({...gameData,cat:e.target.value})} placeholder="Selecione ou digite..." />
                </div>
              </div>
              <div className="form-row cols3">
                <div className="form-group"><label>Nº do Jogo</label><input className="inp" value={gameData.num} onChange={e=>setGameData({...gameData,num:e.target.value})}/></div>
                <div className="form-group"><label>Grupo</label><input list="categorias-list" className="inp" value={gameData.group} onChange={e=>setGameData({...gameData,group:e.target.value})} placeholder="Selecione ou digite..." /></div>
                <div className="form-group"><label>Fase</label><input list="fases-list" className="inp" value={gameData.fase} onChange={e=>setGameData({...gameData,fase:e.target.value})} placeholder="Selecione ou digite..." /></div>
              </div>
            </div>

            <div className="form-card">
              <div className="form-card-title">⚽ Equipes</div>
              <div className="form-row">
                <div className="form-group"><label>Equipe A (Casa)</label><input className="inp" value={gameData.teamA} onChange={e=>setGameData({...gameData,teamA:e.target.value})} /></div>
                <div className="form-group"><label>Equipe B (Visitante)</label><input className="inp" value={gameData.teamB} onChange={e=>setGameData({...gameData,teamB:e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'4px'}}>
                    <label style={{marginBottom:0}}>Escalação {gameData.teamA || 'Equipe A'} (Opcional)</label>
                    <button type="button" className="btn-import btn-sm" style={{padding:'2px 8px', fontSize:'0.7rem', height:'auto'}} onClick={() => setImportModal({isOpen: true, team:'a'})}>📥 XLXS</button>
                  </div>
                  <textarea className="inp" style={{minHeight:'100px', resize: 'vertical'}} placeholder="Cole os nomes dos jogadores...&#10;(Um jogador por linha)" value={gameData.rosterA} onChange={e=>setGameData({...gameData,rosterA:e.target.value})} />
                </div>
                <div className="form-group">
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'4px'}}>
                    <label style={{marginBottom:0}}>Escalação {gameData.teamB || 'Equipe B'} (Opcional)</label>
                    <button type="button" className="btn-import btn-sm" style={{padding:'2px 8px', fontSize:'0.7rem', height:'auto'}} onClick={() => setImportModal({isOpen: true, team:'b'})}>📥 XLXS</button>
                  </div>
                  <textarea className="inp" style={{minHeight:'100px', resize: 'vertical'}} placeholder="Cole os nomes dos jogadores...&#10;(Um jogador por linha)" value={gameData.rosterB} onChange={e=>setGameData({...gameData,rosterB:e.target.value})} />
                </div>
              </div>
              <div className="sec-title mt-4 text-white/50 text-[0.8rem] uppercase tracking-wider font-bold mb-2">👔 Comissão Técnica (Opcional)</div>
              <div className="form-row">
                <div className="form-group flex flex-col gap-2">
                  <input className="inp" placeholder="Técnico" value={gameData.techA} onChange={e=>setGameData({...gameData,techA:e.target.value})} />
                  <input className="inp" placeholder="Aux. Técnico" value={gameData.auxA} onChange={e=>setGameData({...gameData,auxA:e.target.value})} />
                  <input className="inp" placeholder="Prep. Físico" value={gameData.prepA} onChange={e=>setGameData({...gameData,prepA:e.target.value})} />
                  <input className="inp" placeholder="Massagista/ Atendente" value={gameData.massA} onChange={e=>setGameData({...gameData,massA:e.target.value})} />
                  <input className="inp" placeholder="Méd./ Fisioterapeuta" value={gameData.medA} onChange={e=>setGameData({...gameData,medA:e.target.value})} />
                  <input className="inp" placeholder="Supervisor" value={gameData.supA} onChange={e=>setGameData({...gameData,supA:e.target.value})} />
                </div>
                <div className="form-group flex flex-col gap-2">
                  <input className="inp" placeholder="Técnico" value={gameData.techB} onChange={e=>setGameData({...gameData,techB:e.target.value})} />
                  <input className="inp" placeholder="Aux. Técnico" value={gameData.auxB} onChange={e=>setGameData({...gameData,auxB:e.target.value})} />
                  <input className="inp" placeholder="Prep. Físico" value={gameData.prepB} onChange={e=>setGameData({...gameData,prepB:e.target.value})} />
                  <input className="inp" placeholder="Massagista/ Atendente" value={gameData.massB} onChange={e=>setGameData({...gameData,massB:e.target.value})} />
                  <input className="inp" placeholder="Méd./ Fisioterapeuta" value={gameData.medB} onChange={e=>setGameData({...gameData,medB:e.target.value})} />
                  <input className="inp" placeholder="Supervisor" value={gameData.supB} onChange={e=>setGameData({...gameData,supB:e.target.value})} />
                </div>
              </div>
            </div>

            <div className="form-card">
              <div className="form-card-title">📍 Local e Data</div>
              <div className="form-row">
                <div className="form-group"><label>Ginásio</label><input className="inp" value={gameData.gym} onChange={e=>setGameData({...gameData,gym:e.target.value})} /></div>
                <div className="form-group"><label>Cidade / UF</label><input className="inp" value={gameData.city} onChange={e=>setGameData({...gameData,city:e.target.value})} /></div>
              </div>
              <div className="form-row mt-4">
                <div className="form-group"><label>Data</label><input className="inp" type="date" value={gameData.date} onChange={e=>setGameData({...gameData,date:e.target.value})} /></div>
                <div className="form-group"><label>Horário</label><input className="inp" type="time" value={gameData.time} onChange={e=>setGameData({...gameData,time:e.target.value})} /></div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',fontSize:'.95rem',padding:'.85rem'}} onClick={gerarLink}>
                ⚡ Gerar Link de Súmula
              </button>
              <button className="btn btn-ghost" style={{width:'100%',justifyContent:'center',fontSize:'.95rem',padding:'.85rem', borderColor:'var(--border)'}} onClick={gerarESalvarAgendado}>
                📅 Salvar nos Jogos Agendados
              </button>
            </div>

            {generatedUrl && (
              <div className="mt-4">
                <div className="link-box">
                  <span className="link-url">{generatedUrl}</span>
                  <button className="btn-copy" onClick={copiarLink}>{copied ? '✓ Copiado' : 'Copiar'}</button>
                </div>
                <div style={{marginTop:'.75rem',display:'flex',gap:'.75rem',flexWrap:'wrap'}}>
                  <button className="btn btn-ghost" style={{flex:1,justifyContent:'center'}} onClick={abrirSumulaGerada}>Abrir Súmula →</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TAB PREENCHER SUMULA */}
        <div className={`tab-page ${activeTab === 'tab-sumula' ? 'active' : ''}`}>
           <div className="sumula-wrap">
             <div className="game-bar">
               <div className="game-teams-disp">
                 <label className="cursor-pointer flex items-center justify-center bg-white/5 border border-white/10 hover:border-sky rounded-lg w-12 h-12 overflow-hidden shrink-0 transition-colors" title="Adicionar Escudo Equipe A">
                   <input type="file" accept="image/*" className="hidden" onChange={e => handleShieldUpload('a', e)} />
                   {teamShields.a ? <img src={teamShields.a} className="w-full h-full object-contain" alt="Escudo A" /> : <span className="text-xl opacity-50">+</span>}
                 </label>
                 <input 
                   className="team-disp-name bg-transparent border-b border-white/10 hover:border-white/30 focus:border-sky outline-none text-center w-[120px] sm:w-[160px] transition-colors"
                   value={gameData.teamA}
                   onChange={e => setGameData({...gameData, teamA: e.target.value})}
                   placeholder="EQUIPE A"
                 />
                 <div className="score-disp">{sumula.scoreA} × {sumula.scoreB}</div>
                 <input 
                   className="team-disp-name bg-transparent border-b border-white/10 hover:border-white/30 focus:border-sky outline-none text-center w-[120px] sm:w-[160px] transition-colors"
                   value={gameData.teamB}
                   onChange={e => setGameData({...gameData, teamB: e.target.value})}
                   placeholder="EQUIPE B"
                 />
                 <label className="cursor-pointer flex items-center justify-center bg-white/5 border border-white/10 hover:border-sky rounded-lg w-12 h-12 overflow-hidden shrink-0 transition-colors" title="Adicionar Escudo Equipe B">
                   <input type="file" accept="image/*" className="hidden" onChange={e => handleShieldUpload('b', e)} />
                   {teamShields.b ? <img src={teamShields.b} className="w-full h-full object-contain" alt="Escudo B" /> : <span className="text-xl opacity-50">+</span>}
                 </label>
               </div>
               <div className="game-meta-right">
                 <span>{gameData.comp || '—'}</span>
                 <span>{gameData.date ? new Date(gameData.date).toLocaleDateString('pt-BR') : '—'} • {gameData.time || '—'}</span>
               </div>
             </div>

             <div className="step-tabs">
               {['Identificação', 'Escalações', 'Substituições', 'Gols e Faltas', 'Arbitragem', 'Finalizar'].map((s, i) => (
                 <div key={i} className={`step-tab ${currentStep === i ? 'active' : currentStep > i ? 'done' : ''}`} onClick={() => setCurrentStep(i)}>
                    <span className="step-num">{i+1}</span>{s}
                 </div>
               ))}
             </div>

             {/* Sâmula Steps */}
             {currentStep === 0 && (
               <div className="step-content active">
                 <div className="sec-title">📋 Identificação do Jogo</div>
                 <div className="info-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                   <div className="form-group"><label>Competição</label><input className="inp" value={gameData.comp} onChange={(e)=>setGameData({...gameData,comp:e.target.value})} /></div>
                   <div className="form-group">
                     <label>Categoria</label>
                     <input list="categorias-list" className="inp" value={gameData.cat} onChange={e=>setGameData({...gameData,cat:e.target.value})} placeholder="Selecione ou digite..." />
                   </div>
                   <div className="form-group"><label>Nº Jogo</label><input className="inp" value={gameData.num} onChange={e=>setGameData({...gameData,num:e.target.value})} /></div>
                   <div className="form-group"><label>Grupo</label><input list="categorias-list" className="inp" value={gameData.group} onChange={e=>setGameData({...gameData,group:e.target.value})} placeholder="Selecione ou digite..." /></div>
                   <div className="form-group"><label>Fase</label><input list="fases-list" className="inp" value={gameData.fase} onChange={e=>setGameData({...gameData,fase:e.target.value})} placeholder="Selecione ou digite..." /></div>
                   <div className="form-group"><label>Equipe A (Casa)</label><input className="inp" value={gameData.teamA} onChange={e=>setGameData({...gameData,teamA:e.target.value})} /></div>
                   <div className="form-group"><label>Equipe B (Visitante)</label><input className="inp" value={gameData.teamB} onChange={e=>setGameData({...gameData,teamB:e.target.value})} /></div>
                   <div className="form-group"><label>Ginásio</label><input className="inp" value={gameData.gym} onChange={e=>setGameData({...gameData,gym:e.target.value})} /></div>
                   <div className="form-group"><label>Cidade / UF</label><input className="inp" value={gameData.city} onChange={e=>setGameData({...gameData,city:e.target.value})} /></div>
                   <div className="form-group"><label>Data</label><input className="inp" type="date" value={gameData.date} onChange={e=>setGameData({...gameData,date:e.target.value})} /></div>
                   <div className="form-group"><label>Horário</label><input className="inp" type="time" value={gameData.time} onChange={e=>setGameData({...gameData,time:e.target.value})} /></div>
                 </div>
                 <div className="sec-title">⏱ Horários dos Períodos</div>
                 <div className="periods-grid">
                   <div className="period-box">
                     <label>1º Período</label>
                     <div className="period-time-row">Início<input className="inp-cell inp" type="time" value={sumula.p1i} onChange={e=>setSumula({...sumula,p1i:e.target.value})} />Fim<input className="inp-cell inp" type="time" value={sumula.p1f} onChange={e=>setSumula({...sumula,p1f:e.target.value})} /></div>
                   </div>
                   <div className="period-box">
                     <label>2º Período</label>
                     <div className="period-time-row">Início<input className="inp-cell inp" type="time" value={sumula.p2i} onChange={e=>setSumula({...sumula,p2i:e.target.value})} />Fim<input className="inp-cell inp" type="time" value={sumula.p2f} onChange={e=>setSumula({...sumula,p2f:e.target.value})} /></div>
                   </div>
                   <div className="period-box">
                     <label>Prorrogação</label>
                     <div className="period-time-row">Início<input className="inp-cell inp" type="time" value={sumula.pei} onChange={e=>setSumula({...sumula,pei:e.target.value})} />Fim<input className="inp-cell inp" type="time" value={sumula.pef} onChange={e=>setSumula({...sumula,pef:e.target.value})} /></div>
                   </div>
                 </div>
                 <div className="step-nav"><div/><button className="btn btn-primary" onClick={()=>setCurrentStep(1)}>Próximo: Escalações →</button></div>
               </div>
             )}

             {currentStep === 1 && (
                <div className="step-content active">
                  <div className="sec-title">👕 Escalações</div>
                  <div className="teams-grid">
                    {/* Team A */}
                    <div className="team-panel">
                       <div className="team-panel-head">
                         <div>
                           <div className="team-panel-name">{gameData.teamA || 'EQUIPE A'}</div>
                         </div>
                         <span className="tag tag-a">Casa</span>
                       </div>
                       <div className="import-bar">
                         <span className="import-bar-label">Importar planilha com a lista</span>
                         <button className="btn-import" onClick={()=>{setImportModal({isOpen:true,team:'a'})}}>📥 XLXS</button>
                       </div>
                       <div className="player-header"><span>Nº</span><span>Nome</span><span>A</span><span>V</span><span>Pos</span></div>
                       {playersA.map(p => (
                         <div className="player-row" key={p.id}>
                           <input className="inp-cell" maxLength={3} value={p.num} onChange={e=>updatePlayer('a',p.id,'num', e.target.value)} />
                           <input className="inp-name-cell" value={p.name} onChange={e=>updatePlayer('a',p.id,'name', e.target.value)} />
                           <div className={`card-tog yellow ${p.y?'on':''}`} onClick={()=>handleCardClick('a',p, 'y')} title={p.yMin ? `${p.yMin}' ${p.yPer}` : ''}>A</div>
                           <div className={`card-tog red ${p.r?'on':''}`} onClick={()=>handleCardClick('a',p, 'r')} title={p.rMin ? `${p.rMin}' ${p.rPer}` : ''}>V</div>
                           <select className="inp-cell" style={{padding:'0', fontSize:'0.75rem'}} value={p.role} onChange={e=>updatePlayer('a',p.id,'role',e.target.value)}>
                             <option value="">—</option><option value="G">G</option><option value="C">C</option><option value="G/C">G/C</option>
                           </select>
                           <button className="text-red/50 hover:text-red hover:bg-red/10 rounded w-full h-full flex items-center justify-center font-bold" onClick={()=>setPlayersA(playersA.filter(x=>x.id!==p.id))}>✕</button>
                         </div>
                       ))}
                       <button className="add-row-btn" onClick={()=>addPlayer('a')}>+ Jogador</button>

                       <div className="mt-4 border-t border-white/10 pt-2">
                         <div className="text-[0.75rem] text-sub font-bold uppercase mb-2">Comissão Técnica</div>
                         <div className="flex flex-col gap-1">
                           <div className="flex items-center gap-2"><span className="text-[0.7rem] w-20 text-right">Técnico:</span><input className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[0.75rem] flex-1" value={gameData.techA} onChange={e=>setGameData({...gameData,techA:e.target.value})} /></div>
                           <div className="flex items-center gap-2"><span className="text-[0.7rem] w-20 text-right">Aux. Técnico:</span><input className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[0.75rem] flex-1" value={gameData.auxA} onChange={e=>setGameData({...gameData,auxA:e.target.value})} /></div>
                           <div className="flex items-center gap-2"><span className="text-[0.7rem] w-20 text-right">Prep. Físico:</span><input className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[0.75rem] flex-1" value={gameData.prepA} onChange={e=>setGameData({...gameData,prepA:e.target.value})} /></div>
                           <div className="flex items-center gap-2"><span className="text-[0.7rem] w-20 text-right">Massagista:</span><input className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[0.75rem] flex-1" value={gameData.massA} onChange={e=>setGameData({...gameData,massA:e.target.value})} /></div>
                           <div className="flex items-center gap-2"><span className="text-[0.7rem] w-20 text-right">Méd/Fisio:</span><input className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[0.75rem] flex-1" value={gameData.medA} onChange={e=>setGameData({...gameData,medA:e.target.value})} /></div>
                           <div className="flex items-center gap-2"><span className="text-[0.7rem] w-20 text-right">Supervisor:</span><input className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[0.75rem] flex-1" value={gameData.supA} onChange={e=>setGameData({...gameData,supA:e.target.value})} /></div>
                         </div>
                       </div>
                    </div>
                    {/* Team B */}
                    <div className="team-panel">
                       <div className="team-panel-head">
                         <div>
                           <div className="team-panel-name">{gameData.teamB || 'EQUIPE B'}</div>
                         </div>
                         <span className="tag tag-b">Visitante</span>
                       </div>
                       <div className="import-bar">
                         <span className="import-bar-label">Importar planilha com a lista</span>
                         <button className="btn-import" onClick={()=>{setImportModal({isOpen:true,team:'b'})}}>📥 XLXS</button>
                       </div>
                       <div className="player-header"><span>Nº</span><span>Nome</span><span>A</span><span>V</span><span>Pos</span></div>
                       {playersB.map(p => (
                         <div className="player-row" key={p.id}>
                           <input className="inp-cell" maxLength={3} value={p.num} onChange={e=>updatePlayer('b',p.id,'num', e.target.value)} />
                           <input className="inp-name-cell" value={p.name} onChange={e=>updatePlayer('b',p.id,'name', e.target.value)} />
                           <div className={`card-tog yellow ${p.y?'on':''}`} onClick={()=>handleCardClick('b',p, 'y')} title={p.yMin ? `${p.yMin}' ${p.yPer}` : ''}>A</div>
                           <div className={`card-tog red ${p.r?'on':''}`} onClick={()=>handleCardClick('b',p, 'r')} title={p.rMin ? `${p.rMin}' ${p.rPer}` : ''}>V</div>
                           <select className="inp-cell" style={{padding:'0', fontSize:'0.75rem'}} value={p.role} onChange={e=>updatePlayer('b',p.id,'role',e.target.value)}>
                             <option value="">—</option><option value="G">G</option><option value="C">C</option><option value="G/C">G/C</option>
                           </select>
                           <button className="text-red/50 hover:text-red hover:bg-red/10 rounded w-full h-full flex items-center justify-center font-bold" onClick={()=>setPlayersB(playersB.filter(x=>x.id!==p.id))}>✕</button>
                         </div>
                       ))}
                       <button className="add-row-btn" onClick={()=>addPlayer('b')}>+ Jogador</button>

                       <div className="mt-4 border-t border-white/10 pt-2">
                         <div className="text-[0.75rem] text-sub font-bold uppercase mb-2">Comissão Técnica</div>
                         <div className="flex flex-col gap-1">
                           <div className="flex items-center gap-2"><span className="text-[0.7rem] w-20 text-right">Técnico:</span><input className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[0.75rem] flex-1" value={gameData.techB} onChange={e=>setGameData({...gameData,techB:e.target.value})} /></div>
                           <div className="flex items-center gap-2"><span className="text-[0.7rem] w-20 text-right">Aux. Técnico:</span><input className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[0.75rem] flex-1" value={gameData.auxB} onChange={e=>setGameData({...gameData,auxB:e.target.value})} /></div>
                           <div className="flex items-center gap-2"><span className="text-[0.7rem] w-20 text-right">Prep. Físico:</span><input className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[0.75rem] flex-1" value={gameData.prepB} onChange={e=>setGameData({...gameData,prepB:e.target.value})} /></div>
                           <div className="flex items-center gap-2"><span className="text-[0.7rem] w-20 text-right">Massagista:</span><input className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[0.75rem] flex-1" value={gameData.massB} onChange={e=>setGameData({...gameData,massB:e.target.value})} /></div>
                           <div className="flex items-center gap-2"><span className="text-[0.7rem] w-20 text-right">Méd/Fisio:</span><input className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[0.75rem] flex-1" value={gameData.medB} onChange={e=>setGameData({...gameData,medB:e.target.value})} /></div>
                           <div className="flex items-center gap-2"><span className="text-[0.7rem] w-20 text-right">Supervisor:</span><input className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[0.75rem] flex-1" value={gameData.supB} onChange={e=>setGameData({...gameData,supB:e.target.value})} /></div>
                         </div>
                       </div>
                    </div>
                  </div>
                  <div className="step-nav">
                    <button className="btn btn-ghost" onClick={()=>setCurrentStep(0)}>← Anterior</button>
                    <button className="btn btn-primary" onClick={()=>setCurrentStep(2)}>Próximo: Substituições →</button>
                  </div>
                </div>
             )}

             {currentStep === 2 && (
                <div className="step-content active">
                  <div className="sec-title">🔄 Substituições</div>
                  <div className="goals-grid" style={{gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)'}}>
                    <div>
                      <div className="goals-label" style={{color:'var(--sky)'}}>{gameData.teamA||'EQUIPE A'}</div>
                      <div className="text-[0.7rem] text-white/50 mb-2 flex gap-1">
                         <span className="w-[80px]">Período</span><span className="w-[60px]">Tempo</span><span className="w-[60px]">Sai (Nº)</span><span className="w-[60px]">Entra(Nº)</span>
                      </div>
                      {subsA.map(s => (
                        <div className="goal-entry" key={s.id}>
                          <select className="bg-transparent border border-white/10 text-white rounded outline-none" style={{width:'80px', padding:'0.2rem'}} value={s.period} onChange={e=>setSubsA(subsA.map(x=>x.id===s.id?{...x,period:e.target.value}:x))}>
                            <option style={{color:'black'}}>1ºP</option><option style={{color:'black'}}>2ºP</option><option style={{color:'black'}}>Pro</option>
                          </select>
                          <input className="goal-min" style={{width:'60px'}} value={s.min} maxLength={5} inputMode="numeric" onChange={e=>setSubsA(subsA.map(x=>x.id===s.id?{...x,min:handleTimeChange(e.target.value)}:x))} placeholder="00:00" />
                          <input className="goal-min" style={{width:'60px'}} value={s.out} maxLength={3} inputMode="numeric" onChange={e=>setSubsA(subsA.map(x=>x.id===s.id?{...x,out:e.target.value}:x))} placeholder="Sai" />
                          <input className="goal-min" style={{width:'60px'}} value={s.in} maxLength={3} inputMode="numeric" onChange={e=>setSubsA(subsA.map(x=>x.id===s.id?{...x,in:e.target.value}:x))} placeholder="Ent" />
                          <span className="goal-del" onClick={()=>removeSub('a', s.id)}>✕</span>
                        </div>
                      ))}
                      <button className="add-goal-btn" onClick={()=>addSub('a')}>+ Registrar Substituição</button>
                    </div>
                    <div>
                      <div className="goals-label" style={{color:'var(--yellow)'}}>{gameData.teamB||'EQUIPE B'}</div>
                      <div className="text-[0.7rem] text-white/50 mb-2 flex gap-1">
                         <span className="w-[80px]">Período</span><span className="w-[60px]">Tempo</span><span className="w-[60px]">Sai (Nº)</span><span className="w-[60px]">Entra(Nº)</span>
                      </div>
                      {subsB.map(s => (
                        <div className="goal-entry" key={s.id}>
                          <select className="bg-transparent border border-white/10 text-white rounded outline-none" style={{width:'80px', padding:'0.2rem'}} value={s.period} onChange={e=>setSubsB(subsB.map(x=>x.id===s.id?{...x,period:e.target.value}:x))}>
                            <option style={{color:'black'}}>1ºP</option><option style={{color:'black'}}>2ºP</option><option style={{color:'black'}}>Pro</option>
                          </select>
                          <input className="goal-min" style={{width:'60px'}} value={s.min} maxLength={5} inputMode="numeric" onChange={e=>setSubsB(subsB.map(x=>x.id===s.id?{...x,min:handleTimeChange(e.target.value)}:x))} placeholder="00:00" />
                          <input className="goal-min" style={{width:'60px'}} value={s.out} maxLength={3} inputMode="numeric" onChange={e=>setSubsB(subsB.map(x=>x.id===s.id?{...x,out:e.target.value}:x))} placeholder="Sai" />
                          <input className="goal-min" style={{width:'60px'}} value={s.in} maxLength={3} inputMode="numeric" onChange={e=>setSubsB(subsB.map(x=>x.id===s.id?{...x,in:e.target.value}:x))} placeholder="Ent" />
                          <span className="goal-del" onClick={()=>removeSub('b', s.id)}>✕</span>
                        </div>
                      ))}
                      <button className="add-goal-btn" onClick={()=>addSub('b')}>+ Registrar Substituição</button>
                    </div>
                  </div>
                  <div className="step-nav">
                    <button className="btn btn-ghost" onClick={()=>setCurrentStep(1)}>← Anterior</button>
                    <button className="btn btn-primary" onClick={()=>setCurrentStep(3)}>Próximo: Gols e Faltas →</button>
                  </div>
                </div>
             )}

             {currentStep === 3 && (
               <div className="step-content active">
                 <div className="sec-title">⚽ Registro de Gols</div>
                 <div className="goals-grid">
                   <div>
                     <div className="goals-label" style={{color:'var(--sky)'}}>{gameData.teamA||'EQUIPE A'}</div>
                     {goalsA.map(g => (
                       <div className="goal-entry" key={g.id}>
                         <span style={{fontSize:'0.9rem'}}>⚽</span>
                         <select 
                           style={{ flex: 1, background: 'transparent', color: 'white', border: 'none', outline: 'none' }}
                           value={g.name} 
                           onChange={e=>setGoalsA(goalsA.map(x=>x.id===g.id?{...x,name:e.target.value}:x))}
                         >
                           <option value="" style={{color:'black'}}>👤 Selecionar Atleta...</option>
                           {playersA.map(p => (
                             <option key={p.id} value={p.num ? `${p.num} - ${p.name}` : p.name} style={{color:'black'}}>
                               {p.num ? `${p.num} - ` : ''}{p.name}
                             </option>
                           ))}
                           <option value="Gol Contra" style={{color:'black'}}>Gol Contra</option>
                         </select>
                         <select value={g.period} onChange={e=>setGoalsA(goalsA.map(x=>x.id===g.id?{...x,period:e.target.value}:x))}>
                           <option>1º Per.</option><option>2º Per.</option><option>Prorrog.</option>
                         </select>
                         <input className="goal-min" value={g.min} maxLength={5} inputMode="numeric" onChange={e=>setGoalsA(goalsA.map(x=>x.id===g.id?{...x,min:handleTimeChange(e.target.value)}:x))} placeholder="min:seg" />
                         <span className="goal-del" onClick={()=>removeGoal('a', g.id)}>✕</span>
                       </div>
                     ))}
                     <button className="add-goal-btn" onClick={()=>addGoal('a')}>+ Registrar Gol ({sumula.scoreA})</button>
                   </div>
                   <div>
                     <div className="goals-label" style={{color:'var(--yellow)'}}>{gameData.teamB||'EQUIPE B'}</div>
                     {goalsB.map(g => (
                       <div className="goal-entry" key={g.id}>
                         <span style={{fontSize:'0.9rem'}}>⚽</span>
                         <select 
                           style={{ flex: 1, background: 'transparent', color: 'white', border: 'none', outline: 'none' }}
                           value={g.name} 
                           onChange={e=>setGoalsB(goalsB.map(x=>x.id===g.id?{...x,name:e.target.value}:x))}
                         >
                           <option value="" style={{color:'black'}}>👤 Selecionar Atleta...</option>
                           {playersB.map(p => (
                             <option key={p.id} value={p.num ? `${p.num} - ${p.name}` : p.name} style={{color:'black'}}>
                               {p.num ? `${p.num} - ` : ''}{p.name}
                             </option>
                           ))}
                           <option value="Gol Contra" style={{color:'black'}}>Gol Contra</option>
                         </select>
                         <select value={g.period} onChange={e=>setGoalsB(goalsB.map(x=>x.id===g.id?{...x,period:e.target.value}:x))}>
                           <option>1º Per.</option><option>2º Per.</option><option>Prorrog.</option>
                         </select>
                         <input className="goal-min" value={g.min} maxLength={5} inputMode="numeric" onChange={e=>setGoalsB(goalsB.map(x=>x.id===g.id?{...x,min:handleTimeChange(e.target.value)}:x))} placeholder="min:seg" />
                         <span className="goal-del" onClick={()=>removeGoal('b', g.id)}>✕</span>
                       </div>
                     ))}
                     <button className="add-goal-btn" onClick={()=>addGoal('b')}>+ Registrar Gol ({sumula.scoreB})</button>
                   </div>
                 </div>
                 
                 <div className="sec-title mt-8">⛔ Faltas Acumuladas</div>
                 <div className="teams-grid">
                   <div className="team-panel" style={{padding:'1rem'}}>
                     <div style={{fontSize:'.72rem',color:'var(--sub)',marginBottom:'.45rem'}}>1º Período — {gameData.teamA}</div>
                     <div className="faults-display">
                       {[1,2,3,4,5,6,7,8].map(n => <button key={n} className={`fault-btn ${faultsA1>=n ? (n>=6?'crit':'on'):''}`} onClick={()=>setFaultsA1(n === faultsA1 ? n-1 : n)}>{n}</button>)}
                     </div>
                     <div style={{fontSize:'.72rem',color:'var(--sub)',margin:'.75rem 0 .45rem'}}>2º Período — {gameData.teamA}</div>
                     <div className="faults-display">
                       {[1,2,3,4,5,6,7,8].map(n => <button key={n} className={`fault-btn ${faultsA2>=n ? (n>=6?'crit':'on'):''}`} onClick={()=>setFaultsA2(n === faultsA2 ? n-1 : n)}>{n}</button>)}
                     </div>
                   </div>
                   <div className="team-panel" style={{padding:'1rem'}}>
                     <div style={{fontSize:'.72rem',color:'var(--sub)',marginBottom:'.45rem'}}>1º Período — {gameData.teamB}</div>
                     <div className="faults-display">
                       {[1,2,3,4,5,6,7,8].map(n => <button key={n} className={`fault-btn ${faultsB1>=n ? (n>=6?'crit':'on'):''}`} onClick={()=>setFaultsB1(n === faultsB1 ? n-1 : n)}>{n}</button>)}
                     </div>
                     <div style={{fontSize:'.72rem',color:'var(--sub)',margin:'.75rem 0 .45rem'}}>2º Período — {gameData.teamB}</div>
                     <div className="faults-display">
                       {[1,2,3,4,5,6,7,8].map(n => <button key={n} className={`fault-btn ${faultsB2>=n ? (n>=6?'crit':'on'):''}`} onClick={()=>setFaultsB2(n === faultsB2 ? n-1 : n)}>{n}</button>)}
                     </div>
                   </div>
                 </div>

                 <div className="step-nav">
                    <button className="btn btn-ghost" onClick={()=>setCurrentStep(2)}>← Anterior</button>
                    <button className="btn btn-primary" onClick={()=>setCurrentStep(4)}>Próximo: Arbitragem →</button>
                  </div>
               </div>
             )}

             {currentStep === 4 && (
               <div className="step-content active">
                 <div className="sec-title">🟡 Equipe de Arbitragem</div>
                 <div className="arb-grid">
                    <div className="form-group"><label>Árbitro Principal</label><input className="inp" value={sumula.arb1} onChange={e=>setSumula({...sumula,arb1:e.target.value})} placeholder="Nome / UF" /></div>
                    <div className="form-group"><label>Árbitro Auxiliar</label><input className="inp" value={sumula.arb2} onChange={e=>setSumula({...sumula,arb2:e.target.value})} placeholder="Nome / UF" /></div>
                    <div className="form-group"><label>Terceiro Árbitro</label><input className="inp" value={sumula.arb3} onChange={e=>setSumula({...sumula,arb3:e.target.value})} placeholder="Nome / UF" /></div>
                    <div className="form-group"><label>Anotador</label><input className="inp" value={sumula.arb4} onChange={e=>setSumula({...sumula,arb4:e.target.value})} placeholder="Nome / UF" /></div>
                    <div className="form-group"><label>Cronometrista</label><input className="inp" value={sumula.arb5} onChange={e=>setSumula({...sumula,arb5:e.target.value})} placeholder="Nome / UF" /></div>
                    <div className="form-group"><label>Representante</label><input className="inp" value={sumula.arb6} onChange={e=>setSumula({...sumula,arb6:e.target.value})} placeholder="Nome / ND" /></div>
                 </div>
                 <div className="step-nav">
                    <button className="btn btn-ghost" onClick={()=>setCurrentStep(3)}>← Anterior</button>
                    <button className="btn btn-primary" onClick={()=>setCurrentStep(5)}>Próximo: Finalizar →</button>
                  </div>
               </div>
             )}

             {currentStep === 5 && (
               <div className="step-content active">
                 <div className="sec-title">🏆 Resultado Final</div>
                 <div style={{display:'flex', alignItems:'center', gap:'1.5rem', marginBottom:'2rem', flexWrap:'wrap'}}>
                   <div className="form-group">
                     <label>{gameData.teamA}</label>
                     <input type="number" min="0" className="result-inp" value={sumula.scoreA} onChange={e=>setSumula({...sumula,scoreA:parseInt(e.target.value)||0})} />
                   </div>
                   <span className="result-vs">×</span>
                   <div className="form-group">
                     <label>{gameData.teamB}</label>
                     <input type="number" min="0" className="result-inp" value={sumula.scoreB} onChange={e=>setSumula({...sumula,scoreB:parseInt(e.target.value)||0})} />
                   </div>
                 </div>
                 <div className="submit-panel">
                   <h3>SÚMULA PRONTA?</h3>
                   <p>Revise todos os dados antes de finalizar. Após a confirmação, a súmula é registrada e um resumo é gerado.</p>
                   <button className="btn btn-primary" style={{fontSize:'.95rem', padding:'.85rem 2rem'}} onClick={submitSumula}>✓ Finalizar e Registrar Súmula</button>
                 </div>
                 <div className="step-nav">
                    <button className="btn btn-ghost" onClick={()=>setCurrentStep(4)}>← Anterior</button>
                 </div>
               </div>
             )}

           </div>
        </div>

        {/* TAB HISTORICO */}
        <div className={`tab-page ${activeTab === 'tab-agendados' ? 'active' : ''}`}>
           <div className="hist-body">
             <div className="page-heading">
               <h1>Jogos Agendados</h1>
               <p>Súmulas prontas para preenchimento futuro. Armazene o link e acesse no dia do jogo.</p>
             </div>
             
             <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
               {agendados.length === 0 ? (
                 <div style={{textAlign:'center', color:'var(--sub)', padding:'3rem', background:'var(--card)', borderRadius:'8px', border:'1px dashed var(--border)'}}>
                   Nenhum jogo agendado atualmente.<br/>Gere o link de uma súmula e clique em &quot;Salvar nos Agendados&quot;.
                 </div>
               ) : (
                 agendados.map(a => (
                   <div key={a.id} style={{background:'var(--card)', border:'1px solid var(--border)', borderRadius:'8px', padding:'1rem'}}>
                     <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'.5rem'}}>
                       <div>
                         <div style={{fontFamily:'DM Mono', color:'var(--sub)', fontSize:'.75rem', marginBottom:'.2rem'}}>{new Date(a.date).toLocaleDateString('pt-BR')}</div>
                         <a href={a.url} target="_blank" rel="noreferrer" style={{fontWeight:600, fontSize:'1.1rem', textDecoration:'none', color:'inherit', display:'inline-block', cursor:'pointer'}}>{a.title}</a>
                       </div>
                       <div style={{display:'flex', gap:'.5rem'}}>
                         <button className="btn btn-ghost btn-sm" onClick={() => {
                           navigator.clipboard.writeText(a.url);
                           alert('Link copiado!');
                         }}>Copiar Link</button>
                         <a href={a.url} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{textDecoration:"none", display:"inline-flex", alignItems:"center"}}>Abrir →</a>
                         <button className="btn btn-danger btn-sm" onClick={() => {
                           const newA = agendados.filter(x => x.id !== a.id);
                           setAgendados(newA);
                           localStorage.setItem('pt_agendados', JSON.stringify(newA));
                         }}>✕</button>
                       </div>
                     </div>
                     <div style={{background:'rgba(255,255,255,.03)', padding:'.5rem', borderRadius:'6px', marginTop:'.75rem', fontFamily:'DM Mono', fontSize:'.8rem', color:'var(--sky)', wordBreak:'break-all'}}>
                       {a.url}
                     </div>
                   </div>
                 ))
               )}
             </div>
           </div>
        </div>

        {/* TAB HISTORICO */}
        <div className={`tab-page ${activeTab === 'tab-hist' ? 'active' : ''}`}>
           <div className="hist-body">
             <div className="page-heading">
               <h1>Histórico de Súmulas</h1>
               <p>Todas as súmulas registradas neste dispositivo.</p>
             </div>
             <div style={{display:'flex', gap:'.75rem', marginBottom:'1.5rem', flexWrap:'wrap'}}>
               <input className="inp" style={{maxWidth:'280px'}} placeholder="Buscar jogo ou equipe..." value={histSearch} onChange={e => setHistSearch(e.target.value)} />
               <button className="btn btn-ghost btn-sm" onClick={() => {
                 const rows = [['#','Data','Equipe A','Gols A','Gols B','Equipe B','Competição','Status']];
                 historico.forEach((r,i) => rows.push([(historico.length-i).toString(), r.data, r.teamA, r.golsA, r.golsB, r.teamB, r.comp, r.status]));
                 const csv = rows.map(r => r.join(';')).join('\n');
                 const a = document.createElement('a');
                 a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
                 a.download = 'historico_polo_tapajos.csv';
                 a.click();
               }}>📥 Exportar CSV</button>
             </div>
             <table className="hist-table">
               <thead><tr><th>#</th><th>Data</th><th>Equipe A</th><th>Placar</th><th>Equipe B</th><th>Competição</th><th>Status</th></tr></thead>
               <tbody>
                 {historico.filter(r => (r.teamA+r.teamB+r.comp).toLowerCase().includes(histSearch.toLowerCase())).map((r,i) => (
                   <tr key={r.id}>
                     <td style={{fontFamily:'DM Mono', color:'var(--sub)', fontSize:'.75rem'}}>#{String(historico.length - i).padStart(3,'0')}</td>
                     <td>{new Date(r.data).toLocaleDateString('pt-BR')}</td>
                     <td style={{fontWeight:600}}>{r.teamA}</td>
                     <td style={{fontFamily:'var(--font-bebas)', fontSize:'1.1rem', color:'var(--sky)'}}>{r.golsA} × {r.golsB}</td>
                     <td style={{fontWeight:600}}>{r.teamB}</td>
                     <td style={{color:'var(--sub)', fontSize:'.82rem'}}>{r.comp}</td>
                     <td><span className="status-badge s-ok">✓ {r.status}</span></td>
                   </tr>
                 ))}
                 {historico.length === 0 && <tr><td colSpan={7} style={{textAlign:'center', color:'var(--sub)', padding:'2rem'}}>Nenhuma súmula registrada ainda.</td></tr>}
               </tbody>
             </table>
           </div>
        </div>

        {/* TAB CONFIG */}
        <div className={`tab-page ${activeTab === 'tab-config' ? 'active' : ''}`}>
           <div className="config-body">
             <div className="page-heading">
               <h1>Configurações</h1>
               <p>Personalize o sistema para o seu clube e competição.</p>
             </div>
             <div className="form-card">
                <div className="form-card-title">🏟 Dados do Clube</div>
                <div className="form-row full"><div className="form-group"><label>Nome do Clube</label><input className="inp" value={config.clube} onChange={e=>setConfig({...config,clube:e.target.value})} /></div></div>
                <div className="form-row">
                  <div className="form-group"><label>Cidade</label><input className="inp" value={config.cidade} onChange={e=>setConfig({...config,cidade:e.target.value})} /></div>
                  <div className="form-group"><label>Estado</label><input className="inp" value={config.estado} onChange={e=>setConfig({...config,estado:e.target.value})} /></div>
                </div>
             </div>
             <div style={{display:'flex', gap:'.75rem', flexWrap:'wrap', marginTop:'2rem'}}>
                <button className="btn btn-primary" onClick={()=>{localStorage.setItem('pt_config', JSON.stringify(config)); alert('Salvo.')}}>💾 Salvar Configurações</button>
                <button className="btn btn-ghost" onClick={()=>{if(confirm('Apagar histórico?')){setHistorico([]); localStorage.removeItem('pt_historico');}}}>🗑 Limpar Histórico</button>
             </div>
           </div>
        </div>

        {/* TAB SUCCESS */}
        <div className={`tab-page ${activeTab === 'tab-success' ? 'active' : ''}`}>
           <div className="success-body">
             <div className="success-icon">✓</div>
             <h1>SÚMULA REGISTRADA</h1>
             <p>A súmula foi finalizada e registrada com sucesso. Ela encontra-se preservada no Histórico do sistema.</p>
             <div className="success-card">
               {historico[0] && (
                 <>
                   <strong style={{color:'var(--text)',fontSize:'1rem'}}>{historico[0].teamA} {historico[0].golsA} × {historico[0].golsB} {historico[0].teamB}</strong><br/><br/>
                   <strong style={{color:'var(--text)'}}>Competição:</strong> {historico[0].comp}<br/>
                   <strong style={{color:'var(--text)'}}>Data:</strong> {new Date(historico[0].data).toLocaleDateString('pt-BR')}<br/>
                   <strong style={{color:'var(--text)'}}>Árbitro Principal:</strong> {historico[0].arb}
                 </>
               )}
             </div>
             <div style={{display:'flex', gap:'.75rem', flexWrap:'wrap', justifyContent:'center'}}>
                <button className="btn btn-primary" style={{ flex: 1, minWidth: '220px', justifyContent: 'center', padding: '1rem', fontSize: '1rem' }} onClick={()=>window.print()}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>🖨 Imprimir / Salvar PDF</span>
                </button>
                <button className="btn btn-ghost" style={{ flex: 1, minWidth: '150px', justifyContent: 'center', padding: '1rem' }} onClick={()=>goTab('tab-gerar')}>Nova Súmula</button>
                <button className="btn btn-ghost" style={{ flex: 1, minWidth: '150px', justifyContent: 'center', padding: '1rem' }} onClick={()=>goTab('tab-hist')}>Ver Histórico</button>
             </div>
           </div>
        </div>

      </div>

      {/* PRINTABLE PDF LAYOUT (Only visible in @media print) */}
      <div className="printable-sumula">
        <div className="p-header">
          <h1 className="p-title">SÚMULA DE JOGO</h1>
          <p className="p-subtitle">FEFUSPA</p>
        </div>

        <div className="p-info-grid">
          <div className="p-info-item"><strong>Competição:</strong> {gameData.comp || '—'}</div>
          <div className="p-info-item"><strong>Ginásio:</strong> {gameData.gym || '—'}</div>
          <div className="p-info-item"><strong>Categoria:</strong> {gameData.cat || '—'}</div>
          <div className="p-info-item"><strong>Cidade / UF:</strong> {gameData.city || '—'}</div>
          <div className="p-info-item"><strong>Data:</strong> {gameData.date ? new Date(gameData.date).toLocaleDateString('pt-BR') : '—'}</div>
          <div className="p-info-item"><strong>Jogo Nº:</strong> {gameData.num || '—'}</div>
          <div className="p-info-item"><strong>Horário:</strong> {gameData.time || '—'}</div>
          <div className="p-info-item"><strong>Chave/Fase:</strong> {gameData.group || '—'} / {gameData.fase || '—'}</div>
        </div>

        <div className="p-score-box">
          {gameData.teamA} {sumula.scoreA} &times; {sumula.scoreB} {gameData.teamB}
        </div>

        <div className="p-teams-wrapper">
          <div className="p-team-col">
            <div className="p-team-name">EQUIPE A: {gameData.teamA}</div>
            <table className="p-table">
              <thead><tr><th>Nº</th><th>Atleta</th><th>Gols</th><th>A</th><th>V</th></tr></thead>
              <tbody>
                {playersA.length > 0 ? playersA.map(p => {
                   const g = goalsA.filter(x => x.name.includes(p.name)).length;
                   return (
                    <tr key={p.id}>
                      <td>{p.num}</td><td>{p.name} {p.role ? `(${p.role})` : ''}</td>
                      <td>{g > 0 ? g : ''}</td>
                      <td style={{fontSize:'10px'}}>{p.y ? (p.yMin ? `${p.yMin}'` : 'X') : ''}</td>
                      <td style={{fontSize:'10px'}}>{p.r ? (p.rMin ? `${p.rMin}'` : 'X') : ''}</td>
                    </tr>
                 )}) : <tr><td colSpan={5}>Nenhum atleta registrado</td></tr>}
              </tbody>
            </table>
            <div className="p-section-title">Gols e Faltas (Equipe A)</div>
            <div className="p-goals"><strong>Gols: </strong> 
              {goalsA.length > 0 ? goalsA.map((g,i) => <span key={i}>{g.name} ({g.min}&apos; {g.period}) / </span>) : '—'}
            </div>
            <div className="p-cards"><strong>Faltas Acumuladas: </strong> 1ºT: {faultsA1} | 2ºT: {faultsA2}</div>
            
            <div className="p-section-title" style={{marginTop:'10px'}}>Substituições</div>
            <table className="p-table" style={{marginTop: '5px'}}>
              <thead><tr><th>Período</th><th>Tempo</th><th>Entra</th><th>Sai</th></tr></thead>
              <tbody>
                {subsA.length > 0 ? subsA.map((s,i) => (
                  <tr key={i}><td>{s.period}</td><td>{s.min}&apos;</td><td>{s.in}</td><td>{s.out}</td></tr>
                )) : <tr><td colSpan={4}>Sem substituições</td></tr>}
              </tbody>
            </table>

            <div className="p-section-title" style={{marginTop:'10px'}}>Comissão Técnica</div>
            <div style={{fontSize:'0.65rem', lineHeight:'1.4'}}>
              <div><strong>Técnico:</strong> {gameData.techA || '—'}</div>
              <div><strong>Aux. Técnico:</strong> {gameData.auxA || '—'}</div>
              <div><strong>Prep. Físico:</strong> {gameData.prepA || '—'}</div>
              <div><strong>Massagista/Atend.:</strong> {gameData.massA || '—'}</div>
              <div><strong>Méd/Fisio:</strong> {gameData.medA || '—'}</div>
              <div><strong>Supervisor:</strong> {gameData.supA || '—'}</div>
            </div>
          </div>

          <div className="p-team-col">
            <div className="p-team-name">EQUIPE B: {gameData.teamB}</div>
            <table className="p-table">
              <thead><tr><th>Nº</th><th>Atleta</th><th>Gols</th><th>A</th><th>V</th></tr></thead>
              <tbody>
                {playersB.length > 0 ? playersB.map(p => {
                   const g = goalsB.filter(x => x.name.includes(p.name)).length;
                   return (
                    <tr key={p.id}>
                      <td>{p.num}</td><td>{p.name} {p.role ? `(${p.role})` : ''}</td>
                      <td>{g > 0 ? g : ''}</td>
                      <td style={{fontSize:'10px'}}>{p.y ? (p.yMin ? `${p.yMin}'` : 'X') : ''}</td>
                      <td style={{fontSize:'10px'}}>{p.r ? (p.rMin ? `${p.rMin}'` : 'X') : ''}</td>
                    </tr>
                 )}) : <tr><td colSpan={5}>Nenhum atleta registrado</td></tr>}
              </tbody>
            </table>
            <div className="p-section-title">Gols e Faltas (Equipe B)</div>
            <div className="p-goals"><strong>Gols: </strong> 
              {goalsB.length > 0 ? goalsB.map((g,i) => <span key={i}>{g.name} ({g.min}&apos; {g.period}) / </span>) : '—'}
            </div>
            <div className="p-cards"><strong>Faltas Acumuladas: </strong> 1ºT: {faultsB1} | 2ºT: {faultsB2}</div>
            
            <div className="p-section-title" style={{marginTop:'10px'}}>Substituições</div>
            <table className="p-table" style={{marginTop: '5px'}}>
              <thead><tr><th>Período</th><th>Tempo</th><th>Entra</th><th>Sai</th></tr></thead>
              <tbody>
                {subsB.length > 0 ? subsB.map((s,i) => (
                  <tr key={i}><td>{s.period}</td><td>{s.min}&apos;</td><td>{s.in}</td><td>{s.out}</td></tr>
                )) : <tr><td colSpan={4}>Sem substituições</td></tr>}
              </tbody>
            </table>

            <div className="p-section-title" style={{marginTop:'10px'}}>Comissão Técnica</div>
            <div style={{fontSize:'0.65rem', lineHeight:'1.4'}}>
              <div><strong>Técnico:</strong> {gameData.techB || '—'}</div>
              <div><strong>Aux. Técnico:</strong> {gameData.auxB || '—'}</div>
              <div><strong>Prep. Físico:</strong> {gameData.prepB || '—'}</div>
              <div><strong>Massagista/Atend.:</strong> {gameData.massB || '—'}</div>
              <div><strong>Méd/Fisio:</strong> {gameData.medB || '—'}</div>
              <div><strong>Supervisor:</strong> {gameData.supB || '—'}</div>
            </div>
          </div>
        </div>

        <div className="p-section-title">Equipe de Arbitragem</div>
        <div className="p-footer">
          <div className="p-footer-item"><strong>Árbitro Principal:</strong> {sumula.arb1 || '—'}<div className="p-sign-line">Assinatura</div></div>
          <div className="p-footer-item"><strong>Árbitro Auxiliar:</strong> {sumula.arb2 || '—'}<div className="p-sign-line">Assinatura</div></div>
          <div className="p-footer-item"><strong>Anotador:</strong> {sumula.mesario || '—'}<div className="p-sign-line">Assinatura</div></div>
          <div className="p-footer-item"><strong>Cronometrista / Repres:</strong> {sumula.rep || '—'}<div className="p-sign-line">Assinatura</div></div>
        </div>
      </div>

    </div>
  );
}
