'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  Home, 
  Link as LinkIcon, 
  FileText, 
  Calendar, 
  History, 
  Settings, 
  Download, 
  Printer, 
  CheckCircle2, 
  Zap, 
  Smartphone, 
  Target 
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User } from 'firebase/auth';

export default function App() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('tab-home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Config
  const [config, setConfig] = useState({
    clube: 'FEFUSPA', cidade: 'Santarém', estado: 'PA', ginasio: '',
    comp: '', cat: 'Adulto / Masculino', temp: '', nextNum: 1,
    competitions: [] as string[],
    mobileMode: true,
    confirmSave: true
  });

  const [newCompName, setNewCompName] = useState('');

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
    scoreExtraA: 0, scoreExtraB: 0,
    scorePenA: 0, scorePenB: 0,
    arb1: '', arb2: '', arb3: '', arb4: '', arb5: '', arb6: '',
    timeA1: '', timeA2: '', timeB1: '', timeB2: '',
    reportType: 'normal', reportText: ''
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
  const [subsGridA, setSubsGridA] = useState<string[][]>(Array.from({length: 15}, () => Array(5).fill('')));
  const [subsGridB, setSubsGridB] = useState<string[][]>(Array.from({length: 15}, () => Array(5).fill('')));
  const [subsGridA_Per, setSubsGridA_Per] = useState<number[][]>(Array.from({length: 15}, () => Array(5).fill(0)));
  const [subsGridB_Per, setSubsGridB_Per] = useState<number[][]>(Array.from({length: 15}, () => Array(5).fill(0)));
  
  const [faultsA1, setFaultsA1] = useState(0);
  const [faultsA2, setFaultsA2] = useState(0);
  const [faultsB1, setFaultsB1] = useState(0);
  const [faultsB2, setFaultsB2] = useState(0);
  const [activeSubPeriod, setActiveSubPeriod] = useState<1 | 2>(1);

  // Histórico & Agendados
  interface HistoricoItem {
    id: number;
    data: string;
    teamA: string;
    teamB: string;
    golsA: number;
    golsB: number;
    extraA: number;
    extraB: number;
    penA: number;
    penB: number;
    comp: string;
    gym: string;
    status: string;
    arb: string;
  }
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [histSearch, setHistSearch] = useState('');
  
  interface AgendadoItem {
    id: number;
    title: string;
    url: string;
    date: string;
  }
  const [agendados, setAgendados] = useState<AgendadoItem[]>([]);

  // Import Modal
  const [importModal, setImportModal] = useState<{isOpen: boolean, team: 'a'|'b'}>({isOpen: false, team: 'a'});
  const [importData, setImportData] = useState<{headers: string[], rows: string[][]}|null>(null);
  const [colMap, setColMap] = useState({num: '', name: '', pos: ''});
  const [importStatus, setImportStatus] = useState({msg: '', type: ''});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ----- AUTH -----
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAuthError(err.message);
      } else {
        setAuthError('Ocorreu um erro desconhecido');
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

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
    setSubsGridA(Array.from({length: 8}, () => Array(5).fill('')));
    setSubsGridB(Array.from({length: 8}, () => Array(5).fill('')));
    setSubsGridA2(Array.from({length: 8}, () => Array(5).fill('')));
    setSubsGridB2(Array.from({length: 8}, () => Array(5).fill('')));
    setGoalsA([]); setGoalsB([]);
    setFaultsA1(0); setFaultsA2(0); setFaultsB1(0); setFaultsB2(0);
    setSumula(s => ({ ...s, scoreA: 0, scoreB: 0 }));
    setCurrentStep(0);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line
    setIsMounted(true);
    const savedConfig = localStorage.getItem('pt_config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      setConfig({ ...parsed, competitions: parsed.competitions || [] });
    }
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
  const updatePlayer = (team: 'a'|'b', id: number, field: string, val: string | boolean) => {
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
    const v = val.replace(/[^\d:]/g, '');
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
    const currentPeriodStr = activeSubPeriod === 1 ? '1º Per.' : '2º Per.';
    if(team === 'a') {
      setGoalsA([...goalsA, { id: Date.now(), name: '', period: currentPeriodStr, min: '' }]);
      setSumula(s => ({...s, scoreA: s.scoreA + 1}));
    } else {
      setGoalsB([...goalsB, { id: Date.now(), name: '', period: currentPeriodStr, min: '' }]);
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

  const updateSubsGrid = (team: 'a'|'b', rIdx: number, cIdx: number, val: string, period?: 1 | 2) => {
    const p = period || activeSubPeriod;
    if (team === 'a') {
      setSubsGridA(prev => {
        const next = [...prev];
        next[rIdx] = [...next[rIdx]];
        next[rIdx][cIdx] = val;
        return next;
      });
      setSubsGridA_Per(prev => {
        const next = [...prev];
        next[rIdx] = [...next[rIdx]];
        if (val === '') next[rIdx][cIdx] = 0;
        else if (next[rIdx][cIdx] === 0) next[rIdx][cIdx] = p;
        return next;
      });
    } else {
      setSubsGridB(prev => {
        const next = [...prev];
        next[rIdx] = [...next[rIdx]];
        next[rIdx][cIdx] = val;
        return next;
      });
      setSubsGridB_Per(prev => {
        const next = [...prev];
        next[rIdx] = [...next[rIdx]];
        if (val === '') next[rIdx][cIdx] = 0;
        else if (next[rIdx][cIdx] === 0) next[rIdx][cIdx] = p;
        return next;
      });
    }
  };

  // ----- FINALIZAR ------
  const submitSumula = () => {
    if (config.confirmSave && !confirm('Deseja realmente registrar esta súmula?')) return;
    const reg = {
      id: Date.now(),
      data: gameData.date || new Date().toISOString().slice(0,10),
      teamA: gameData.teamA || 'Equipe A',
      teamB: gameData.teamB || 'Equipe B',
      golsA: sumula.scoreA, golsB: sumula.scoreB,
      extraA: sumula.scoreExtraA, extraB: sumula.scoreExtraB,
      penA: sumula.scorePenA, penB: sumula.scorePenB,
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
          const rows = XLSX.utils.sheet_to_json<string[][]>(ws, { header: 1, defval: '' });
          processParsed(file.name, rows);
        } catch (err: unknown) {
          if (err instanceof Error) {
            setImportStatus({msg: 'Erro: ' + err.message, type: 'err'});
          }
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const processParsed = (name: string, rows: string[][]) => {
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
  if (!isMounted || user === undefined) return null;

  if (user === null) {
    return (
      <div className="flex bg-[var(--dark)] text-[var(--text)] min-h-screen items-center justify-center p-4">
        <div className="bg-[var(--card)] border border-[var(--border)] p-8 rounded-2xl w-full max-w-md shadow-lg">
          <div className="text-center mb-6">
            <div className="bg-[var(--blue)] w-14 h-14 mx-auto rounded-xl flex items-center justify-center text-white font-['Bebas_Neue'] text-2xl tracking-wider mb-4">FE</div>
            <h1 className="font-['Bebas_Neue'] text-3xl text-[var(--sky)] tracking-wide">SÚMULA DIGITAL</h1>
            <p className="text-[var(--sub)] font-light mt-1">Acesse sua conta para continuar</p>
          </div>
          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-[var(--sub)] font-medium">E-mail</label>
              <input type="email" required className="inp" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-[var(--sub)] font-medium">Senha</label>
              <input type="password" required className="inp" placeholder="••••••" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            {authError && <div className="text-red-500 text-sm mt-1 bg-red-100/10 p-2 rounded">{authError}</div>}
            <button type="submit" className="btn btn-primary justify-center mt-2 w-full text-[1rem] py-3">
              {authMode === 'login' ? 'Entrar Módulo Mesário' : 'Criar Conta'}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-[var(--sub)] pt-4 border-t border-[var(--border)]">
            {authMode === 'login' ? 'Ainda não é cadastrado?' : 'Já possui cadastro?'}
            <button type="button" className="text-[var(--sky)] ml-2 hover:underline" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}>
              {authMode === 'login' ? 'Criar nova conta' : 'Fazer login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

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

      <datalist id="competitions-list">
        {config.competitions.map(c => <option key={c} value={c} />)}
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
      {/* SIDEBAR OVERLAY */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} 
        onClick={() => setSidebarOpen(false)}
      ></div>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">FE</div>
          <div className="brand-text">
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
          
          <div className="nav-section-label">Gestão</div>
          <div className={`nav-item ${activeTab==='tab-agendados'?'active':''}`} onClick={()=>goTab('tab-agendados')}><Calendar className="nav-icon" size={18} /> Jogos Agendados<span className="nav-badge">{agendados.length}</span></div>
          <div className={`nav-item ${activeTab==='tab-hist'?'active':''}`} onClick={()=>goTab('tab-hist')}><History className="nav-icon" size={18} /> Histórico<span className="nav-badge">{historico.length}</span></div>
          <div className={`nav-item ${activeTab==='tab-config'?'active':''}`} onClick={()=>goTab('tab-config')}><Settings className="nav-icon" size={18} /> Configurações</div>

          <div className="nav-section-label">Competições</div>
          <div className="px-3 mb-2">
            <div className="flex gap-1">
              <input 
                className="inp text-[0.7rem] py-1 h-8" 
                placeholder="Nova Competição..." 
                value={newCompName} 
                onChange={e => setNewCompName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newCompName.trim()) {
                    const updatedComps = [...config.competitions, newCompName.trim()];
                    const newConfig = { ...config, competitions: updatedComps };
                    setConfig(newConfig);
                    localStorage.setItem('pt_config', JSON.stringify(newConfig));
                    setNewCompName('');
                  }
                }}
              />
              <button 
                className="btn btn-primary p-1 w-8 h-8 flex items-center justify-center shrink-0"
                onClick={() => {
                  if (newCompName.trim()) {
                    const updatedComps = [...config.competitions, newCompName.trim()];
                    const newConfig = { ...config, competitions: updatedComps };
                    setConfig(newConfig);
                    localStorage.setItem('pt_config', JSON.stringify(newConfig));
                    setNewCompName('');
                  }
                }}
              >+</button>
            </div>
          </div>
          <div className="max-h-[150px] overflow-y-auto px-3 custom-scrollbar">
            {config.competitions.map((c, i) => (
              <div key={i} className="flex items-center justify-between group py-1 text-[0.7rem] text-[var(--sub)] hover:text-white transition-colors">
                <span className="truncate pr-2">🏆 {c}</span>
                <button 
                  className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                  onClick={() => {
                    const updatedComps = config.competitions.filter((_, idx) => idx !== i);
                    const newConfig = { ...config, competitions: updatedComps };
                    setConfig(newConfig);
                    localStorage.setItem('pt_config', JSON.stringify(newConfig));
                  }}
                >✕</button>
              </div>
            ))}
          </div>
        </nav>
        <div className="sidebar-footer">FEFUSPA © 2026<br/>Versão 1.0.0</div>
      </aside>

      <div className="main-content">
        <div className="topbar">
          <div style={{display:'flex', alignItems:'center', gap:'.75rem'}}>
            <div className="hamburger" onClick={() => setSidebarOpen(true)}>
              <span/><span/><span/>
            </div>
            <span className="topbar-title">{getTabTitle()}</span>
          </div>
          <div className="topbar-right">
            <div className="text-[0.7rem] text-[var(--sub)] mr-2 hidden sm:block">{user?.email}</div>
            <button className="btn btn-ghost btn-sm mr-4" onClick={handleLogout}>Sair</button>
            <div className="topbar-badge">Sistema Online</div>
          </div>
        </div>

        {/* TAB HOME */}
        <div className={`tab-page ${activeTab === 'tab-home' ? 'active' : ''}`}>
          <div className="home-hero">
            <div className="home-badge">☆ Sistema Digital FEFUSPA</div>
            <h1 className="home-title">SÚMULA<br/><em>DIGITAL</em><br/><span>FEFUSPA</span></h1>
            <p className="home-sub">Gerencie súmulas de futsal online, gere links exclusivos por partida e registre tudo de forma digital — sem papel, sem complicação.</p>
            <div className="home-actions">
              <button className="btn btn-primary" onClick={() => goTab('tab-gerar')}><Zap className="mr-2" size={18} /> Gerar Link de Súmula</button>
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
              <div className="feat-card"><div className="feat-icon"><LinkIcon size={24} /></div><div className="feat-title">Link Único por Jogo</div><div className="feat-desc">URL exclusiva com dados pré-preenchidos para facilitar o trabalho da mesa.</div></div>
              <div className="feat-card"><div className="feat-icon"><FileText size={24} /></div><div className="feat-title">Padrão CBFS</div><div className="feat-desc">Todos os campos seguem o modelo oficial da confederação.</div></div>
              <div className="feat-card"><div className="feat-icon"><Target size={24} /></div><div className="feat-title">Gols em Tempo Real</div><div className="feat-desc">Registre gols com autor, período e minuto instantaneamente.</div></div>
              <div className="feat-card"><div className="feat-icon"><Smartphone size={24} /></div><div className="feat-title">Mobile First</div><div className="feat-desc">Interface adaptada para tablets e celulares.</div></div>
            </div>
          </div>
          <div style={{padding:'0 2.5rem'}}><div className="section-head"><h2>Ações Rápidas</h2></div></div>
          <div className="quick-actions">
             <div className="quick-card" onClick={() => goTab('tab-gerar')}><div className="quick-card-icon"><LinkIcon size={20} /></div><div className="quick-card-title">Gerar Link de Súmula</div><div className="quick-card-desc">Crie um link fácil para o mesário preencher na hora.</div></div>
             <div className="quick-card" onClick={openDemoSumula}><div className="quick-card-icon"><FileText size={20} /></div><div className="quick-card-title">Preencher Súmula Demo</div><div className="quick-card-desc">Faça um test-drive em uma súmula já pronta.</div></div>
             <div className="quick-card" onClick={() => goTab('tab-hist')}><div className="quick-card-icon"><History size={20} /></div><div className="quick-card-title">Ver Histórico</div><div className="quick-card-desc">Exporte ou acesse todas as súmulas processadas.</div></div>
             <div className="quick-card" onClick={() => goTab('tab-config')}><div className="quick-card-icon"><Settings size={20} /></div><div className="quick-card-title">Configurações</div><div className="quick-card-desc">Ajuste regras padrão, clube ou preferências do sistema.</div></div>
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
              <div className="form-card-title"><Target className="mr-2 inline" size={18} /> Competição</div>
              <div className="form-row border-b border-white/5 pb-4 mb-4">
                <div className="form-group"><label>Competição</label>
                  <input list="competitions-list" className="inp" value={gameData.comp} onChange={e=>setGameData({...gameData,comp:e.target.value})} placeholder="Selecione ou digite..." />
                </div>
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
                    <button type="button" className="btn-import btn-sm" style={{padding:'2px 8px', fontSize:'0.7rem', height:'auto'}} onClick={() => setImportModal({isOpen: true, team:'a'})}><Download size={12} className="mr-1" /> EXCEL/CSV</button>
                  </div>
                  <textarea className="inp" style={{minHeight:'100px', resize: 'vertical'}} placeholder="Cole os nomes dos jogadores...&#10;(Um jogador por linha)" value={gameData.rosterA} onChange={e=>setGameData({...gameData,rosterA:e.target.value})} />
                </div>
                <div className="form-group">
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'4px'}}>
                    <label style={{marginBottom:0}}>Escalação {gameData.teamB || 'Equipe B'} (Opcional)</label>
                    <button type="button" className="btn-import btn-sm" style={{padding:'2px 8px', fontSize:'0.7rem', height:'auto'}} onClick={() => setImportModal({isOpen: true, team:'b'})}><Download size={12} className="mr-1" /> EXCEL/CSV</button>
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
                <Zap className="mr-2" size={20} /> Gerar Link de Súmula
              </button>
              <button className="btn btn-ghost" style={{width:'100%',justifyContent:'center',fontSize:'.95rem',padding:'.85rem', borderColor:'var(--border)'}} onClick={gerarESalvarAgendado}>
                <Calendar className="mr-2" size={20} /> Salvar nos Jogos Agendados
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
             {/* FEFUSPA Header Logo */}
             <div className="flex flex-col items-center pt-8 pb-4 bg-[var(--surface)] border-b-2 border-orange-200 mb-6 rounded-t-xl">
               <div className="w-28 h-32 relative mb-3">
                 <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-md">
                   {/* Shield Shape */}
                   <path d="M5,10 Q5,0 15,0 L85,0 Q95,0 95,10 L95,80 Q95,120 50,120 Q5,120 5,80 Z" fill="#1e3a8a" />
                   {/* Red Background */}
                   <path d="M8,40 L92,40 L92,80 Q92,115 50,115 Q8,115 8,80 Z" fill="#dc2626" />
                   {/* White Stripe */}
                   <rect x="40" y="40" width="20" height="75" fill="#ffffff" />
                   {/* FEFUSPA Text */}
                   <text x="50" y="28" fill="#ffffff" fontSize="16" font-black textAnchor="middle" style={{fontFamily: 'sans-serif', fontWeight: 900}}>FEFUSPA</text>
                   {/* Blue Star */}
                   <path d="M50,55 L53,63 L61,63 L55,68 L57,76 L50,71 L43,76 L45,68 L39,63 L47,63 Z" fill="#1e3a8a" />
                   {/* Date */}
                   <text x="50" y="108" fill="#1e3a8a" fontSize="8" font-black textAnchor="middle" style={{fontFamily: 'sans-serif', fontWeight: 900}}>05 04 88</text>
                 </svg>
               </div>
               <h1 className="text-xl font-black text-slate-900 text-center uppercase tracking-tighter">
                 Federação de Futebol de Salão do Pará
               </h1>
               <div className="flex items-center gap-2 mt-1">
                 <div className="h-[2px] w-6 bg-slate-300"></div>
                 <p className="text-[0.65rem] text-slate-500 font-bold uppercase tracking-widest">Súmula Eletrônica Oficial</p>
                 <div className="h-[2px] w-6 bg-slate-300"></div>
               </div>
             </div>
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
                   <div className="form-group"><label>Competição</label>
                    <input list="competitions-list" className="inp" value={gameData.comp} onChange={(e)=>setGameData({...gameData,comp:e.target.value})} placeholder="Selecione ou digite..." />
                  </div>
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
                  
                  {/* Period Switcher */}
                  <div className="flex mb-6 p-1 bg-orange-100 rounded-xl max-w-md mx-auto border border-orange-200">
                    <button 
                      className={`flex-1 py-4 font-black transition-all rounded-lg flex items-center justify-center gap-3 text-lg ${activeSubPeriod === 1 ? 'bg-white text-black border border-[#38bdf8]/50 shadow-[0_0_20px_rgba(56,189,248,0.3)]' : 'bg-orange-200/50 text-black/60 hover:bg-orange-200'}`}
                      onClick={() => setActiveSubPeriod(1)}
                    >
                      <div className={`w-3 h-3 rounded-full ${activeSubPeriod === 1 ? 'bg-[#38bdf8]' : 'bg-black/20 border border-black/10'}`}></div>
                      1º TEMPO
                    </button>
                    <button 
                      className={`flex-1 py-4 font-black transition-all rounded-lg flex items-center justify-center gap-3 text-lg ${activeSubPeriod === 2 ? 'bg-white text-black border border-[#ef4444]/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'bg-slate-200/50 text-black/60 hover:bg-slate-200'}`}
                      onClick={() => setActiveSubPeriod(2)}
                    >
                      <div className={`w-3 h-3 rounded-full ${activeSubPeriod === 2 ? 'bg-[#ef4444]' : 'bg-black/20 border border-black/10'}`}></div>
                      2º TEMPO
                    </button>
                  </div>

                  <div className="goals-grid" style={{gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)'}}>
                    {/* TEAM A */}
                    <div className="flex flex-col gap-6">
                      <div className="goals-label text-xl font-black mb-4" style={{color: activeSubPeriod === 1 ? '#38bdf8' : '#ef4444', textShadow: '0 2px 4px rgba(0,0,0,0.2)'}}>{gameData.teamA||'EQUIPE A'}</div>
                      
                      {/* Active Period Substitutions Team A */}
                      <div>
                        <div 
                          className="text-[0.8rem] mb-3 uppercase tracking-widest font-black"
                          style={{ color: activeSubPeriod === 1 ? '#38bdf8' : '#ef4444' }}
                        >
                          SUBSTITUIÇÕES {activeSubPeriod}º TEMPO
                        </div>
                        <div className="grid gap-2">
                          {subsGridA.map((row, rIdx) => (
                             <div key={rIdx} className="flex flex-col gap-1">
                               <div className="flex gap-2">
                                 {row.map((val, cIdx) => {
                                   const pName = playersA.find(p => p.num === val)?.name;
                                   const cellPer = subsGridA_Per[rIdx][cIdx];
                                   const color = cellPer === 2 ? '#ef4444' : '#38bdf8';
                                   return (
                                     <div key={cIdx} className="flex flex-col flex-1 min-w-0">
                                       <input 
                                         className="goal-min text-center bg-white/10 border-2 w-full text-lg" 
                                         style={{
                                           padding: '0.6rem 0.2rem', 
                                           minWidth: 0, 
                                           borderRadius: '8px',
                                           color: color,
                                           fontWeight: '900',
                                           borderColor: color === '#ef4444' ? 'rgba(239,68,68,0.5)' : 'rgba(56,189,248,0.5)'
                                         }} 
                                         maxLength={2} 
                                         inputMode="numeric" 
                                         value={val} 
                                         onChange={e=>updateSubsGrid('a', rIdx, cIdx, e.target.value.replace(/\D/g, ''), activeSubPeriod)} 
                                       />
                                       {val && (
                                         <div 
                                           className="text-[0.6rem] truncate text-center mt-1 uppercase font-black px-1 rounded" 
                                           title={pName}
                                           style={{ color: 'black', background: 'white' }}
                                         >
                                           {pName ? pName.split(' ')[0] : '—'}
                                         </div>
                                       )}
                                     </div>
                                   );
                                 })}
                               </div>
                             </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* TEAM B */}
                    <div className="flex flex-col gap-6">
                      <div className="goals-label text-xl font-black mb-4" style={{color: activeSubPeriod === 1 ? 'var(--yellow)' : '#ef4444', textShadow: '0 2px 4px rgba(0,0,0,0.2)'}}>{gameData.teamB||'EQUIPE B'}</div>
                      
                      {/* Active Period Substitutions Team B */}
                      <div>
                        <div 
                          className="text-[0.8rem] mb-3 uppercase tracking-widest font-black"
                          style={{ color: activeSubPeriod === 1 ? '#38bdf8' : '#ef4444' }}
                        >
                          SUBSTITUIÇÕES {activeSubPeriod}º TEMPO
                        </div>
                        <div className="grid gap-2">
                          {subsGridB.map((row, rIdx) => (
                             <div key={rIdx} className="flex flex-col gap-1">
                               <div className="flex gap-2">
                                 {row.map((val, cIdx) => {
                                   const pName = playersB.find(p => p.num === val)?.name;
                                   const cellPer = subsGridB_Per[rIdx][cIdx];
                                   const color = cellPer === 2 ? '#ef4444' : '#38bdf8';
                                   return (
                                     <div key={cIdx} className="flex flex-col flex-1 min-w-0">
                                       <input 
                                         className="goal-min text-center bg-white/10 border-2 w-full text-lg" 
                                         style={{
                                           padding: '0.6rem 0.2rem', 
                                           minWidth: 0, 
                                           borderRadius: '8px',
                                           color: color,
                                           fontWeight: '900',
                                           borderColor: color === '#ef4444' ? 'rgba(239,68,68,0.5)' : 'rgba(56,189,248,0.5)'
                                         }} 
                                         maxLength={2} 
                                         inputMode="numeric" 
                                         value={val} 
                                         onChange={e=>updateSubsGrid('b', rIdx, cIdx, e.target.value.replace(/\D/g, ''), activeSubPeriod)} 
                                       />
                                       {val && (
                                         <div 
                                           className="text-[0.6rem] truncate text-center mt-1 uppercase font-black px-1 rounded" 
                                           title={pName}
                                           style={{ color: 'black', background: 'white' }}
                                         >
                                           {pName ? pName.split(' ')[0] : '—'}
                                         </div>
                                       )}
                                     </div>
                                   );
                                 })}
                               </div>
                             </div>
                          ))}
                        </div>
                      </div>
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
                  
                  {/* Period Switcher (Synced) */}
                  <div className="flex mb-4 p-1 bg-orange-100 rounded-xl max-w-sm mx-auto border border-orange-200">
                    <button 
                      className={`flex-1 py-4 font-black transition-all rounded-lg flex items-center justify-center gap-3 text-lg ${activeSubPeriod === 1 ? 'bg-white text-black border border-[#38bdf8]/50 shadow-[0_0_20px_rgba(56,189,248,0.3)]' : 'bg-slate-200/50 text-black/60 hover:bg-slate-200'}`}
                      onClick={() => setActiveSubPeriod(1)}
                    >
                      <div className={`w-3 h-3 rounded-full ${activeSubPeriod === 1 ? 'bg-[#38bdf8]' : 'bg-black/20 border border-black/10'}`}></div>
                      1º TEMPO
                    </button>
                    <button 
                      className={`flex-1 py-4 font-black transition-all rounded-lg flex items-center justify-center gap-3 text-lg ${activeSubPeriod === 2 ? 'bg-white text-black border border-[#ef4444]/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'bg-slate-200/50 text-black/60 hover:bg-slate-200'}`}
                      onClick={() => setActiveSubPeriod(2)}
                    >
                      <div className={`w-3 h-3 rounded-full ${activeSubPeriod === 2 ? 'bg-[#ef4444]' : 'bg-black/20 border border-black/10'}`}></div>
                      2º TEMPO
                    </button>
                  </div>

                  <div className="goals-grid">
                    <div>
                      <div className="goals-label text-xl font-black mb-4" style={{color: activeSubPeriod === 1 ? 'var(--sky)' : '#ef4444', textShadow: '0 2px 4px rgba(0,0,0,0.2)'}}>{gameData.teamA||'EQUIPE A'}</div>
                      {goalsA.map(g => (
                        <div className="goal-entry" key={g.id} style={{ borderColor: g.period.includes(activeSubPeriod.toString()) ? (activeSubPeriod === 1 ? '#38bdf8' : '#ef4444') : 'var(--border)', opacity: g.period.includes(activeSubPeriod.toString()) ? 1 : 0.5 }}>
                          <span style={{fontSize:'0.9rem'}}>⚽</span>
                           <select 
                             style={{ flex: 1, background: 'transparent', color: 'black', border: 'none', outline: 'none' }}
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
                          <input className="goal-min" style={g.period.includes('2') ? {color:'#ef4444', borderColor:'#ef4444'} : {color:'#38bdf8', borderColor:'#38bdf8'}} value={g.min} maxLength={5} inputMode="numeric" onChange={e=>setGoalsA(goalsA.map(x=>x.id===g.id?{...x,min:handleTimeChange(e.target.value)}:x))} placeholder="min:seg" />
                          <span className="goal-del" onClick={()=>removeGoal('a', g.id)}>✕</span>
                        </div>
                      ))}
                      <button 
                        className="add-goal-btn" 
                        onClick={()=>addGoal('a')}
                        style={{ borderStyle: 'dashed', borderColor: activeSubPeriod === 1 ? '#38bdf8' : '#ef4444', color: activeSubPeriod === 1 ? '#38bdf8' : '#ef4444', background: activeSubPeriod === 1 ? 'rgba(56,189,248,0.05)' : 'rgba(239,68,68,0.05)' }}
                      >
                        + Registrar Gol ({sumula.scoreA})
                      </button>
                    </div>
                    <div>
                      <div className="goals-label text-xl font-black mb-4" style={{color: activeSubPeriod === 1 ? 'var(--yellow)' : '#ef4444', textShadow: '0 2px 4px rgba(0,0,0,0.2)'}}>{gameData.teamB||'EQUIPE B'}</div>
                      {goalsB.map(g => (
                        <div className="goal-entry" key={g.id} style={{ borderColor: g.period.includes(activeSubPeriod.toString()) ? (activeSubPeriod === 1 ? '#38bdf8' : '#ef4444') : 'var(--border)', opacity: g.period.includes(activeSubPeriod.toString()) ? 1 : 0.5 }}>
                          <span style={{fontSize:'0.9rem'}}>⚽</span>
                           <select 
                             style={{ flex: 1, background: 'transparent', color: 'black', border: 'none', outline: 'none' }}
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
                          <input className="goal-min" style={g.period.includes('2') ? {color:'#ef4444', borderColor:'#ef4444'} : {color:'#38bdf8', borderColor:'#38bdf8'}} value={g.min} maxLength={5} inputMode="numeric" onChange={e=>setGoalsB(goalsB.map(x=>x.id===g.id?{...x,min:handleTimeChange(e.target.value)}:x))} placeholder="min:seg" />
                          <span className="goal-del" onClick={()=>removeGoal('b', g.id)}>✕</span>
                        </div>
                      ))}
                      <button 
                        className="add-goal-btn" 
                        onClick={()=>addGoal('b')}
                        style={{ borderStyle: 'dashed', borderColor: activeSubPeriod === 1 ? '#38bdf8' : '#ef4444', color: activeSubPeriod === 1 ? '#38bdf8' : '#ef4444', background: activeSubPeriod === 1 ? 'rgba(56,189,248,0.05)' : 'rgba(239,68,68,0.05)' }}
                      >
                        + Registrar Gol ({sumula.scoreB})
                      </button>
                    </div>
                  </div>
                  
                  <div className="sec-title mt-8">⛔ Faltas Acumuladas — {activeSubPeriod}º Tempo</div>
                  <div className="teams-grid">
                    <div className="team-panel" style={{padding:'1rem', borderColor: activeSubPeriod === 1 ? 'rgba(56,189,248,0.2)' : 'rgba(239,68,68,0.2)'}}>
                      <div style={{fontSize:'.72rem',color: activeSubPeriod === 1 ? '#38bdf8' : '#ef4444', marginBottom:'.45rem',fontWeight:'bold'}}>{activeSubPeriod}º Período — {gameData.teamA}</div>
                      <div className="faults-display">
                        {[1,2,3,4,5,6,7,8].map(n => {
                          const currentFaults = activeSubPeriod === 1 ? faultsA1 : faultsA2;
                          const setFaults = activeSubPeriod === 1 ? setFaultsA1 : setFaultsA2;
                          const color = activeSubPeriod === 1 ? '#38bdf8' : '#ef4444';
                          return (
                            <button 
                              key={n} 
                              className={`fault-btn ${currentFaults>=n ? (n>=6?'crit':'on'):''}`} 
                              style={currentFaults>=n && n<6 ? {background:color, borderColor:color, color:'white'} : (!(currentFaults>=n) ? {color:color, borderColor: color === '#38bdf8' ? 'rgba(56,189,248,0.3)' : 'rgba(239,68,68,0.3)'} : {})}
                              onClick={()=>setFaults(n === currentFaults ? n-1 : n)}
                            >
                              {n}
                            </button>
                          );
                        })}
                      </div>
                      
                      <div className="mt-4 flex items-center justify-center gap-2 bg-orange-100 p-2 rounded-lg border border-orange-200">
                        <span className="text-[0.65rem] bg-orange-50 text-black px-1.5 py-0.5 rounded font-black">PEDIDO DE TEMPO:</span>
                        <input 
                          className="goal-min bg-orange-50 border text-center w-20" 
                          style={{
                            color: activeSubPeriod === 1 ? '#38bdf8' : '#ef4444', 
                            borderColor: activeSubPeriod === 1 ? 'rgba(56,189,248,0.5)' : 'rgba(239,68,68,0.5)',
                            fontSize: '0.8rem',
                            padding: '4px'
                          }} 
                          maxLength={5} 
                          inputMode="numeric" 
                          placeholder="00:00" 
                          value={activeSubPeriod === 1 ? sumula.timeA1 : sumula.timeA2} 
                          onChange={e=>setSumula({...sumula, [activeSubPeriod === 1 ? 'timeA1' : 'timeA2']: handleTimeChange(e.target.value)})} 
                        />
                      </div>
                    </div>
                    <div className="team-panel" style={{padding:'1rem', borderColor: activeSubPeriod === 1 ? 'rgba(56,189,248,0.2)' : 'rgba(239,68,68,0.2)'}}>
                      <div style={{fontSize:'.72rem',color: activeSubPeriod === 1 ? '#38bdf8' : '#ef4444', marginBottom:'.45rem',fontWeight:'bold'}}>{activeSubPeriod}º Período — {gameData.teamB}</div>
                      <div className="faults-display">
                        {[1,2,3,4,5,6,7,8].map(n => {
                          const currentFaults = activeSubPeriod === 1 ? faultsB1 : faultsB2;
                          const setFaults = activeSubPeriod === 1 ? setFaultsB1 : setFaultsB2;
                          const color = activeSubPeriod === 1 ? '#38bdf8' : '#ef4444';
                          return (
                            <button 
                              key={n} 
                              className={`fault-btn ${currentFaults>=n ? (n>=6?'crit':'on'):''}`} 
                              style={currentFaults>=n && n<6 ? {background:color, borderColor:color, color:'white'} : (!(currentFaults>=n) ? {color:color, borderColor: color === '#38bdf8' ? 'rgba(56,189,248,0.3)' : 'rgba(239,68,68,0.3)'} : {})}
                              onClick={()=>setFaults(n === currentFaults ? n-1 : n)}
                            >
                              {n}
                            </button>
                          );
                        })}
                      </div>
                      
                      <div className="mt-4 flex items-center justify-center gap-2 bg-orange-100 p-2 rounded-lg border border-orange-200">
                        <span className="text-[0.65rem] bg-orange-50 text-black px-1.5 py-0.5 rounded font-black">PEDIDO DE TEMPO:</span>
                        <input 
                          className="goal-min bg-orange-50 border text-center w-20" 
                          style={{
                            color: activeSubPeriod === 1 ? '#38bdf8' : '#ef4444', 
                            borderColor: activeSubPeriod === 1 ? 'rgba(56,189,248,0.5)' : 'rgba(239,68,68,0.5)',
                            fontSize: '0.8rem',
                            padding: '4px'
                          }} 
                          maxLength={5} 
                          inputMode="numeric" 
                          placeholder="00:00" 
                          value={activeSubPeriod === 1 ? sumula.timeB1 : sumula.timeB2} 
                          onChange={e=>setSumula({...sumula, [activeSubPeriod === 1 ? 'timeB1' : 'timeB2']: handleTimeChange(e.target.value)})} 
                        />
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

                 <div className="sec-title mt-8">📝 Relatório do Árbitro</div>
                 <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex flex-wrap gap-6 mb-4">
                      <label className="flex items-center gap-2 cursor-pointer group text-black">
                        <input 
                          type="radio" 
                          name="reportType" 
                          className="w-4 h-4 accent-sky"
                          checked={sumula.reportType === 'normal'} 
                          onChange={() => setSumula({...sumula, reportType: 'normal', reportText: ''})} 
                        />
                        <span className="text-sm font-medium group-hover:text-sky transition-colors">Jogo Normal</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group text-black">
                        <input 
                          type="radio" 
                          name="reportType" 
                          className="w-4 h-4 accent-sky"
                          checked={sumula.reportType === 'attached'} 
                          onChange={() => setSumula({...sumula, reportType: 'attached'})} 
                        />
                        <span className="text-sm font-medium group-hover:text-sky transition-colors">Segue relatório em anexo</span>
                      </label>
                    </div>
                   {sumula.reportType === 'attached' && (
                     <textarea 
                       className="inp w-full text-sm" 
                       style={{ minHeight: '150px', resize: 'vertical' }} 
                       placeholder="Descreva as ocorrências disciplinares, problemas técnicos ou qualquer outra observação relevante da partida..."
                       value={sumula.reportText}
                       onChange={e => setSumula({...sumula, reportText: e.target.value})}
                     />
                   )}
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
                 <div className="grid gap-6 mb-8 mt-2">
                    <div className="flex flex-col gap-6">
                      {/* Tempo Normal */}
                      <div className="flex items-center gap-6 flex-wrap">
                        <div className="form-group pb-2 border-b border-white/5 w-full">
                          <label className="text-[0.6rem] uppercase tracking-wider text-[var(--sub)]">Tempo Normal: {gameData.teamA}</label>
                          <div className="flex items-center gap-4 mt-1">
                             <input type="number" min="0" className="result-inp" value={sumula.scoreA} onChange={e=>setSumula({...sumula,scoreA:parseInt(e.target.value)||0})} />
                             <span className="text-xl opacity-20">×</span>
                             <input type="number" min="0" className="result-inp" value={sumula.scoreB} onChange={e=>setSumula({...sumula,scoreB:parseInt(e.target.value)||0})} />
                             <label className="text-[0.6rem] uppercase tracking-wider text-[var(--sub)] ml-auto">{gameData.teamB}</label>
                          </div>
                        </div>
                      </div>
                      
                      {/* Tempo Extra */}
                      <div className="flex items-center gap-6 flex-wrap">
                        <div className="form-group pb-2 border-b border-white/5 w-full">
                          <label className="text-[0.6rem] uppercase tracking-wider text-[var(--sub)]">Tempo Extra (se houver): {gameData.teamA}</label>
                          <div className="flex items-center gap-4 mt-1">
                             <input type="number" min="0" className="result-inp h-10 w-20 text-lg" value={sumula.scoreExtraA} onChange={e=>setSumula({...sumula,scoreExtraA:parseInt(e.target.value)||0})} />
                             <span className="text-sm opacity-10">×</span>
                             <input type="number" min="0" className="result-inp h-10 w-20 text-lg" value={sumula.scoreExtraB} onChange={e=>setSumula({...sumula,scoreExtraB:parseInt(e.target.value)||0})} />
                             <label className="text-[0.6rem] uppercase tracking-wider text-[var(--sub)] ml-auto">{gameData.teamB}</label>
                          </div>
                        </div>
                      </div>

                      {/* Pênaltis */}
                      <div className="flex items-center gap-6 flex-wrap">
                        <div className="form-group w-full">
                          <label className="text-[0.6rem] uppercase tracking-wider text-[#ef4444]">Pênaltis (se houver): {gameData.teamA}</label>
                          <div className="flex items-center gap-4 mt-1">
                             <input type="number" min="0" className="result-inp h-10 w-20 text-lg border-[#ef4444]/30" value={sumula.scorePenA} onChange={e=>setSumula({...sumula,scorePenA:parseInt(e.target.value)||0})} />
                             <span className="text-sm opacity-10">×</span>
                             <input type="number" min="0" className="result-inp h-10 w-20 text-lg border-[#ef4444]/30" value={sumula.scorePenB} onChange={e=>setSumula({...sumula,scorePenB:parseInt(e.target.value)||0})} />
                             <label className="text-[0.6rem] uppercase tracking-wider text-[#ef4444] ml-auto">{gameData.teamB}</label>
                          </div>
                        </div>
                      </div>
                    </div>
                 </div>
                 <div className="submit-panel">
                   <h3>SÚMULA PRONTA?</h3>
                   <p>Revise todos os dados antes de finalizar. Após a confirmação, a súmula é registrada e um resumo é gerado.</p>
                   
                   <div className="flex flex-col gap-2 mb-6 w-full max-w-sm">
                     <label className="text-[0.7rem] text-[var(--sub)] font-medium uppercase tracking-wider">Vincular Partida à Competição:</label>
                     <select 
                       className="inp w-full"
                       value={gameData.comp}
                       onChange={e => setGameData({...gameData, comp: e.target.value})}
                     >
                       <option value="">— Selecionar Competição —</option>
                       {config.competitions.map((c, i) => (
                         <option key={i} value={c}>{c}</option>
                       ))}
                     </select>
                     {config.competitions.length === 0 && (
                       <p className="text-[0.6rem] text-red-500/70">Nenhuma competição cadastrada. Adicione uma no menu lateral.</p>
                     )}
                   </div>

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
                      <td style={{fontFamily:'var(--font-bebas)', fontSize:'1.1rem', color:'var(--sky)'}}>
                        <div>{r.golsA} × {r.golsB}</div>
                        {(r.extraA > 0 || r.extraB > 0) && <div className="text-[0.68rem] text-red-500/70 leading-none mt-0.5 font-sans">E: {r.extraA}x{r.extraB}</div>}
                        {(r.penA > 0 || r.penB > 0) && <div className="text-[0.68rem] text-red-500 font-bold leading-none mt-0.5 font-sans">PE: {r.penA}x{r.penB}</div>}
                      </td>
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
               <div className="flex items-center gap-3 mb-2">
                 <div className="bg-[var(--blue)] p-2 rounded-lg text-white">
                   <Settings size={24} />
                 </div>
                 <h1 className="!mb-0 text-3xl font-['Bebas_Neue'] tracking-wide">Configurações</h1>
               </div>
               <p className="text-[var(--sub)] font-light">Personalize o sistema para o seu clube e competição.</p>
             </div>

             <div className="config-container grid gap-6">
               <div className="form-card !mb-0">
                  <div className="form-card-title">🏟 Dados do Clube</div>
                  <div className="form-row full">
                    <div className="form-group">
                      <label>Nome do Clube Responsável</label>
                      <input className="inp" value={config.clube} onChange={e=>setConfig({...config,clube:e.target.value})} placeholder="Ex: FEFUSPA" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Cidade Sede</label>
                      <input className="inp" value={config.cidade} onChange={e=>setConfig({...config,cidade:e.target.value})} placeholder="Ex: Santarém" />
                    </div>
                    <div className="form-group">
                      <label>Estado (UF)</label>
                      <input className="inp" value={config.estado} onChange={e=>setConfig({...config,estado:e.target.value})} placeholder="Ex: PA" />
                    </div>
                  </div>
               </div>

               <div className="form-card !mb-0">
                  <div className="form-card-title">⚙️ Comportamento do Sistema</div>
                  <div className="config-list">
                    <div className="config-row">
                      <div className="config-info">
                        <div className="config-label">Auto-incrementar Nº do Jogo</div>
                        <div className="config-desc">Gera o próximo número automaticamente ao salvar uma súmula.</div>
                      </div>
                      <div className="form-group w-24">
                        <input 
                          type="number" 
                          className="inp text-center" 
                          value={config.nextNum} 
                          onChange={e=>setConfig({...config, nextNum: parseInt(e.target.value) || 1})} 
                        />
                      </div>
                    </div>
                    
                    <div className="config-row">
                      <div className="config-info">
                        <div className="config-label">Modo para Dispositivos Móveis</div>
                        <div className="config-desc">Otimiza botões e tabelas para telas menores e comandos de toque.</div>
                      </div>
                      <div 
                        className={`toggle-switch ${config.mobileMode ? 'on' : ''}`}
                        onClick={() => setConfig({...config, mobileMode: !config.mobileMode})}
                      ></div>
                    </div>

                    <div className="config-row">
                      <div className="config-info">
                        <div className="config-label">Confirmação antes de Registrar</div>
                        <div className="config-desc">Evita salvamentos acidentais durante o preenchimento.</div>
                      </div>
                      <div 
                        className={`toggle-switch ${config.confirmSave ? 'on' : ''}`}
                        onClick={() => setConfig({...config, confirmSave: !config.confirmSave})}
                      ></div>
                    </div>
                  </div>
               </div>

               <div className="form-card !mb-0">
                  <div className="form-card-title">🛡️ Gerenciamento de Dados</div>
                  <p className="text-xs text-[var(--sub)] mb-4">Atenção: A limpeza do histórico é irreversível e afetará os registros salvos localmente.</p>
                  <div className="flex gap-3 flex-wrap">
                    <button className="btn btn-ghost border-red-200 text-red-500 hover:bg-red-50" onClick={()=>{if(confirm('Apagar histórico de súmulas permanentemente?')){setHistorico([]); localStorage.removeItem('pt_historico');}}}>
                      🗑 Esvaziar Histórico
                    </button>
                    <button className="btn btn-ghost border-blue-200 text-[var(--sky)]" onClick={()=>{
                      const data = JSON.stringify({config, historico, agendados});
                      const blob = new Blob([data], {type: 'application/json'});
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `backup_fefuspa_${new Date().toISOString().slice(0,10)}.json`;
                      a.click();
                    }}>
                      📤 Exportar Backup (JSON)
                    </button>
                  </div>
               </div>
             </div>

             <div className="fixed bottom-6 right-6 sm:relative sm:bottom-0 sm:right-0 mt-8">
                <button 
                  className="btn btn-primary shadow-2xl sm:shadow-lg !py-4 sm:!py-3 !px-8 text-lg sm:text-base w-full sm:w-auto" 
                  onClick={()=>{localStorage.setItem('pt_config', JSON.stringify(config)); alert('Configurações salvas com sucesso!')}}
                >
                  <CheckCircle2 className="mr-2" size={20} /> Salvar Configurações
                </button>
             </div>
           </div>
        </div>

        {/* TAB SUCCESS */}
        <div className={`tab-page ${activeTab === 'tab-success' ? 'active' : ''}`}>
           <div className="success-body">
             <div className="success-icon"><CheckCircle2 size={48} /></div>
             <h1>SÚMULA REGISTRADA</h1>
             <p>A súmula foi finalizada e registrada com sucesso. Ela encontra-se preservada no Histórico do sistema.</p>
             <div className="success-card">
               {historico[0] && (
                 <>
                    <strong style={{color:'var(--text)',fontSize:'1rem'}}>{historico[0].teamA} {historico[0].golsA} × {historico[0].golsB} {historico[0].teamB}</strong>
                    {(historico[0].extraA > 0 || historico[0].extraB > 0) && <div className="text-xs text-red-500 font-bold mt-1">Tempo Extra: {historico[0].extraA} &times; {historico[0].extraB}</div>}
                    {(historico[0].penA > 0 || historico[0].penB > 0) && <div className="text-xs text-red-500 font-bold mt-1">Pênaltis: {historico[0].penA} &times; {historico[0].penB}</div>}
                    <br/><br/>
                   <strong style={{color:'var(--text)'}}>Competição:</strong> {historico[0].comp}<br/>
                   <strong style={{color:'var(--text)'}}>Data:</strong> {new Date(historico[0].data).toLocaleDateString('pt-BR')}<br/>
                   <strong style={{color:'var(--text)'}}>Árbitro Principal:</strong> {historico[0].arb}
                 </>
               )}
             </div>
             <div style={{display:'flex', gap:'.75rem', flexWrap:'wrap', justifyContent:'center'}}>
                <button className="btn btn-primary" style={{ flex: 1, minWidth: '220px', justifyContent: 'center', padding: '1rem', fontSize: '1rem' }} onClick={()=>window.print()}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Printer size={18} /> Imprimir / Salvar PDF</span>
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
          <div className="flex flex-col items-center gap-1">
            <div className="text-2xl">
              {gameData.teamA} {sumula.scoreA} &times; {sumula.scoreB} {gameData.teamB}
            </div>
            {(sumula.scoreExtraA > 0 || sumula.scoreExtraB > 0) && (
              <div className="text-xs uppercase tracking-widest text-[#ef4444] font-bold">
                T. Extra: {sumula.scoreExtraA} &times; {sumula.scoreExtraB}
              </div>
            )}
            {(sumula.scorePenA > 0 || sumula.scorePenB > 0) && (
              <div className="text-xs uppercase tracking-widest text-[#ef4444] font-bold">
                Pênaltis: {sumula.scorePenA} &times; {sumula.scorePenB}
              </div>
            )}
          </div>
        </div>

        <div className="p-teams-wrapper">
          <div className="p-team-col">
            <div className="p-team-name">EQUIPE A: {gameData.teamA}</div>
            <table className="p-table">
              <thead>
                <tr>
                  <th rowSpan={2}>Nº</th><th rowSpan={2}>Atleta</th><th colSpan={5}>SUBSTITUIÇÃO</th><th rowSpan={2}>Gols</th><th rowSpan={2}>A</th><th rowSpan={2}>V</th>
                </tr>
                <tr><th></th><th></th><th></th><th></th><th></th></tr>
              </thead>
              <tbody>
                {Array.from({length: 15}).map((_, i) => {
                   const p = playersA[i];
                   const g = p ? goalsA.filter(x => x.name.includes(p.name)).length : 0;
                   const p1subs = subsGridA[i].filter((v, idx) => v !== '' && subsGridA_Per[i][idx] === 1).map(v => ({v, c: '#38bdf8'}));
                   const p2subs = subsGridA[i].filter((v, idx) => v !== '' && subsGridA_Per[i][idx] === 2).map(v => ({v, c: '#ef4444'}));
                   const allSubs = [...p1subs, ...p2subs];
                   return (
                    <tr key={i}>
                      <td>{p ? p.num : ''}</td><td style={{textAlign: 'left'}}>{p ? `${p.name} ${p.role ? `(${p.role})` : ''}` : ''}</td>
                      {[0,1,2,3,4].map(idx => (
                        <td key={idx} style={{color: allSubs[idx]?.c, fontWeight: 'bold'}}>{allSubs[idx]?.v || ''}</td>
                      ))}
                      <td>{g > 0 ? g : ''}</td>
                      <td style={{fontSize:'10px'}}>{p?.y ? (p.yMin ? `${p.yMin}'` : 'X') : ''}</td>
                      <td style={{fontSize:'10px'}}>{p?.r ? (p.rMin ? `${p.rMin}'` : 'X') : ''}</td>
                    </tr>
                 )})}
              </tbody>
            </table>
            <div className="p-section-title">Gols e Faltas (Equipe A)</div>
            <div className="p-goals"><strong>Gols: </strong> 
              {goalsA.length > 0 ? goalsA.map((g,i) => <span key={i} style={g.period === '2º Per.' ? {color:'#ef4444'} : {}}>{g.name} ({g.min}&apos; {g.period}) / </span>) : '—'}
            </div>
            <div className="p-cards">
              <strong>Faltas Acumuladas: </strong> 1ºT: {faultsA1} | 2ºT: <span style={{color:'#ef4444', fontWeight:'bold'}}>{faultsA2}</span><br/>
              <strong>Pedidos de Tempo: </strong> 1ºT: {sumula.timeA1 || '—'} | 2ºT: <span style={{color:'#ef4444', fontWeight:'bold'}}>{sumula.timeA2 || '—'}</span>
            </div>
            
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
              <thead>
                <tr>
                  <th rowSpan={2}>Nº</th><th rowSpan={2}>Atleta</th><th colSpan={5}>SUBSTITUIÇÃO</th><th rowSpan={2}>Gols</th><th rowSpan={2}>A</th><th rowSpan={2}>V</th>
                </tr>
                <tr><th></th><th></th><th></th><th></th><th></th></tr>
              </thead>
              <tbody>
                {Array.from({length: 15}).map((_, i) => {
                   const p = playersB[i];
                   const g = p ? goalsB.filter(x => x.name.includes(p.name)).length : 0;
                   const p1subs = subsGridB[i].filter((v, idx) => v !== '' && subsGridB_Per[i][idx] === 1).map(v => ({v, c: '#38bdf8'}));
                   const p2subs = subsGridB[i].filter((v, idx) => v !== '' && subsGridB_Per[i][idx] === 2).map(v => ({v, c: '#ef4444'}));
                   const allSubs = [...p1subs, ...p2subs];
                   return (
                    <tr key={i}>
                      <td>{p ? p.num : ''}</td><td style={{textAlign: 'left'}}>{p ? `${p.name} ${p.role ? `(${p.role})` : ''}` : ''}</td>
                      {[0,1,2,3,4].map(idx => (
                        <td key={idx} style={{color: allSubs[idx]?.c, fontWeight: 'bold'}}>{allSubs[idx]?.v || ''}</td>
                      ))}
                      <td>{g > 0 ? g : ''}</td>
                      <td style={{fontSize:'10px'}}>{p?.y ? (p.yMin ? `${p.yMin}'` : 'X') : ''}</td>
                      <td style={{fontSize:'10px'}}>{p?.r ? (p.rMin ? `${p.rMin}'` : 'X') : ''}</td>
                    </tr>
                 )})}
              </tbody>
            </table>
            <div className="p-section-title">Gols e Faltas (Equipe B)</div>
            <div className="p-goals"><strong>Gols: </strong> 
              {goalsB.length > 0 ? goalsB.map((g,i) => <span key={i} style={g.period === '2º Per.' ? {color:'#ef4444'} : {}}>{g.name} ({g.min}&apos; {g.period}) / </span>) : '—'}
            </div>
            <div className="p-cards">
              <strong>Faltas Acumuladas: </strong> 1ºT: {faultsB1} | 2ºT: <span style={{color:'#ef4444', fontWeight:'bold'}}>{faultsB2}</span><br/>
              <strong>Pedidos de Tempo: </strong> 1ºT: {sumula.timeB1 || '—'} | 2ºT: <span style={{color:'#ef4444', fontWeight:'bold'}}>{sumula.timeB2 || '—'}</span>
            </div>
            
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

        <div className="p-section-title">Relatório do Árbitro</div>
        <div style={{fontSize:'0.7rem', border:'1px solid #000', padding:'8px', minHeight:'60px', marginBottom:'15px'}}>
          {sumula.reportType === 'normal' ? 'JOGO NORMAL' : (sumula.reportText || 'SEGUE RELATÓRIO EM ANEXO (Não preenchido)')}
        </div>

        <div className="p-section-title">Equipe de Arbitragem</div>
        <div className="p-footer">
          <div className="p-footer-item"><strong>Árbitro Principal:</strong> {sumula.arb1 || '—'}<div className="p-sign-line">Assinatura</div></div>
          <div className="p-footer-item"><strong>Árbitro Auxiliar:</strong> {sumula.arb2 || '—'}<div className="p-sign-line">Assinatura</div></div>
          <div className="p-footer-item"><strong>Anotador:</strong> {sumula.arb4 || '—'}<div className="p-sign-line">Assinatura</div></div>
          <div className="p-footer-item"><strong>Cronometrista / Repres:</strong> {`${sumula.arb5 || ''} / ${sumula.arb6 || ''}`.trim() === '/' ? '—' : `${sumula.arb5 || ''} / ${sumula.arb6 || ''}`}<div className="p-sign-line">Assinatura</div></div>
        </div>
      </div>

    </div>
  );
}
