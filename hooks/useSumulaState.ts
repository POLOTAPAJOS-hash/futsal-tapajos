import { useState, useEffect, useCallback } from "react";
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import * as XLSX from "xlsx";
import { auth } from "../lib/firebase";
import { Player, Goal, HistoricoItem, AgendadoItem, GameData } from "../lib/types";

export function useSumulaState() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("tab-home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Auth
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authError, setAuthError] = useState("");

  // Config
  const [config, setConfig] = useState({
    clube: "FEFUSPA",
    cidade: "Santarém",
    estado: "PA",
    ginasio: "",
    comp: "",
    cat: "Adulto / Masculino",
    temp: "",
    nextNum: 1,
    competitions: [] as string[],
    mobileMode: true,
    confirmSave: true,
  });

  const [gameData, setGameData] = useState<GameData>({
    comp: "", cat: "Adulto / Masculino", num: "01", group: "A", fase: "",
    teamA: "", teamB: "", gym: "", city: "", date: "", time: "20:00",
    rosterA: "", rosterB: "", techA: "", auxA: "", prepA: "", massA: "",
    medA: "", supA: "", techB: "", auxB: "", prepB: "", massB: "",
    medB: "", supB: ""
  });

  const [sumula, setSumula] = useState({
    p1i: "", p1f: "", p2i: "", p2f: "", pei: "", pef: "",
    techA: "", techB: "", scoreA: 0, scoreB: 0, scoreExtraA: 0, scoreExtraB: 0,
    scorePenA: 0, scorePenB: 0,
    arb1: "", arb2: "", arb3: "", arb4: "", arb5: "", arb6: "",
    timeA1: "", timeA2: "", timeB1: "", timeB2: "",
    reportType: "normal", reportText: ""
  });

  const [playersA, setPlayersA] = useState<Player[]>([]);
  const [playersB, setPlayersB] = useState<Player[]>([]);
  const [goalsA, setGoalsA] = useState<Goal[]>([]);
  const [goalsB, setGoalsB] = useState<Goal[]>([]);
  const [faultsA1, setFaultsA1] = useState(0);
  const [faultsA2, setFaultsA2] = useState(0);
  const [faultsB1, setFaultsB1] = useState(0);
  const [faultsB2, setFaultsB2] = useState(0);
  const [activeSubPeriod, setActiveSubPeriod] = useState<1 | 2>(1);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [agendados, setAgendados] = useState<AgendadoItem[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const goTab = (id: string) => {
    setActiveTab(id);
    setSidebarOpen(false);
    window.scrollTo(0, 0);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const [generatedUrl, setGeneratedUrl] = useState("");
  const [copied, setCopiar] = useState(false);
  const [histSearch, setHistSearch] = useState("");
  const [importModal, setImportModal] = useState<{isOpen: boolean, team: 'a'|'b'}>({isOpen: false, team: 'a'});

  // Auth Functions
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      if (authMode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: unknown) {
      if (err instanceof Error) setAuthError(err.message);
      else setAuthError("Ocorreu um erro desconhecido");
    }
  };

  const gerarLink = useCallback(() => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const params = new URLSearchParams();
    params.set("sumula", "1");
    Object.entries(gameData).forEach(([k, v]) => {
      if (v) params.set(k, String(v));
    });
    const url = `${base}/?${params.toString()}`;
    setGeneratedUrl(url);
    return url;
  }, [gameData]);

  const copiarLink = () => {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl);
    setCopiar(true);
    setTimeout(() => setCopiar(false), 2000);
  };

  const gerarESalvarAgendado = () => {
    const url = gerarLink();
    const nomeJogo = `${gameData.teamA || "Equipe A"} vs ${gameData.teamB || "Equipe B"}`;
    const newItem: AgendadoItem = {
      id: Date.now(),
      title: nomeJogo,
      url: url,
      date: gameData.date || new Date().toISOString().slice(0, 10)
    };
    const updated = [newItem, ...agendados];
    setAgendados(updated);
    localStorage.setItem("pt_agendados", JSON.stringify(updated));
    alert("Súmula gerada e salva nos agendados!");
    goTab("tab-agendados");
  };

  const initSumulaInitialData = useCallback((rA?: string, rB?: string) => {
    let freshA = Array.from({ length: 5 }).map((_, i) => ({
      id: i, num: "", name: "", y: false, r: false, role: i === 0 ? "G" : "",
    }));
    let freshB = Array.from({ length: 5 }).map((_, i) => ({
      id: i + 100, num: "", name: "", y: false, r: false, role: i === 0 ? "G" : "",
    }));

    const parseRoster = (text: string, baseId: number) => {
      const names = text.split("\n").map(n => n.trim()).filter(Boolean);
      return names.map((line, i) => {
        let num = "";
        let name = line;
        const match = line.match(/^(\d{1,3})\s*[-\.]?\s+(.*)$/);
        if (match) { num = match[1]; name = match[2]; }
        return { id: baseId + i, num, name, y: false, r: false, role: i === 0 ? "G" : "" };
      });
    };

    if (rA) freshA = parseRoster(rA, 0);
    if (rB) freshB = parseRoster(rB, 100);

    setPlayersA(freshA);
    setPlayersB(freshB);
    setGoalsA([]);
    setGoalsB([]);
    setFaultsA1(0); setFaultsA2(0); setFaultsB1(0); setFaultsB2(0);
    setSumula(s => ({ ...s, scoreA: 0, scoreB: 0 }));
    setCurrentStep(0);
  }, []);

  // Effects for Loading Data
  useEffect(() => {
    setIsMounted(true);
    const savedConfig = localStorage.getItem("pt_config");
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      setConfig(prev => ({ ...prev, ...parsed, competitions: parsed.competitions || [] }));
    }
    const savedHist = localStorage.getItem("pt_historico");
    if (savedHist) setHistorico(JSON.parse(savedHist));
    const savedAgendados = localStorage.getItem("pt_agendados");
    if (savedAgendados) {
      try {
        const parsed = JSON.parse(savedAgendados);
        if (Array.isArray(parsed)) setAgendados(parsed);
      } catch (err) { console.error("Erro ao carregar agendados:", err); }
    }

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("sumula") === "1") {
        setGameData({
          comp: params.get("comp") || "", cat: params.get("cat") || "Adulto / Masculino",
          num: params.get("num") || "01", group: params.get("group") || "A", 
          fase: params.get("fase") || "", teamA: params.get("teamA") || "EQUIPE A",
          teamB: params.get("teamB") || "EQUIPE B", gym: params.get("gym") || "",
          city: params.get("city") || "", date: params.get("date") || "",
          time: params.get("time") || "20:00", rosterA: params.get("rosterA") || "",
          rosterB: params.get("rosterB") || "", techA: params.get("techA") || "",
          auxA: params.get("auxA") || "", prepA: params.get("prepA") || "",
          massA: params.get("massA") || "", medA: params.get("medA") || "",
          supA: params.get("supA") || "", techB: params.get("techB") || "",
          auxB: params.get("auxB") || "", prepB: params.get("prepB") || "",
          massB: params.get("massB") || "", medB: params.get("medB") || "",
          supB: params.get("supB") || "",
        });
        initSumulaInitialData(params.get("rosterA") || "", params.get("rosterB") || "");
        setActiveTab("tab-sumula");
      }
    }
  }, [initSumulaInitialData]);

  const [importData, setImportData] = useState<{ headers: string[]; rows: unknown[] } | null>(null);
  const [colMap, setColMap] = useState<Record<string, string>>({ name: "" });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];
      
      if (data.length > 0) {
        const headers = data[0].map(h => String(h || ""));
        const rows = data.slice(1);
        setImportData({ headers, rows });
        
        // Auto-detect a column that looks like "Nome"
        const nameIdx = headers.findIndex(h => h.toLowerCase().includes("nome") || h.toLowerCase().includes("atleta"));
        if (nameIdx !== -1) {
          setColMap({ name: String(nameIdx) });
        }
      }
    };
    reader.readAsBinaryString(file);
  };

  const doImportXlsx = () => {
    if (!importData) return;
    
    const team = importModal.team;
    const baseId = team === 'a' ? 0 : 100;
    const nameIdx = parseInt(colMap.name);

    if (isNaN(nameIdx)) {
      alert("Por favor, selecione a coluna que contém o Nome do Atleta.");
      return;
    }
    
    const newPlayers: Player[] = importData.rows.map((rowItem, idx) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = rowItem as any[];
      const name = String(row[nameIdx] || "").trim();
      
      if (!name) return null;

      return {
        id: baseId + idx,
        num: String(idx + 1), // Auto-assign number starting from 1
        name: name,
        role: "",
        y: false,
        r: false
      };
    }).filter((p): p is Player => p !== null);

    if (newPlayers.length === 0) {
      alert("Nenhum nome de atleta válido encontrado na coluna selecionada.");
      return;
    }

    if (team === 'a') setPlayersA(newPlayers);
    else setPlayersB(newPlayers);

    setImportModal({ ...importModal, isOpen: false });
    setImportData(null);
    setColMap({ name: "" });
    alert(`${newPlayers.length} atletas importados para a Equipe ${team.toUpperCase()}!`);
  };

  const addGoal = (team: "a" | "b") => {
    const num = prompt("Número do Jogador:");
    const min = prompt("Minuto:");
    if (!num || !min) return;

    if (team === "a") {
      setGoalsA(prev => [...prev, { id: Date.now(), playerNum: num, min: min, type: "G" }]);
      setSumula(s => ({ ...s, scoreA: s.scoreA + 1 }));
    } else {
      setGoalsB(prev => [...prev, { id: Date.now(), playerNum: num, min: min, type: "G" }]);
      setSumula(s => ({ ...s, scoreB: s.scoreB + 1 }));
    }
  };

  return {
    isMounted, setIsMounted,
    activeTab, setActiveTab,
    sidebarOpen, setSidebarOpen,
    currentStep, setCurrentStep,
    user, setUser,
    email, setEmail,
    password, setPassword,
    authMode, setAuthMode,
    authError, setAuthError,
    config, setConfig,
    gameData, setGameData,
    sumula, setSumula,
    playersA, setPlayersA,
    playersB, setPlayersB,
    goalsA, setGoalsA,
    goalsB, setGoalsB,
    faultsA1, setFaultsA1,
    faultsA2, setFaultsA2,
    faultsB1, setFaultsB1,
    faultsB2, setFaultsB2,
    activeSubPeriod, setActiveSubPeriod,
    historico, setHistorico,
    agendados, setAgendados,
    goTab,
    handleLogout,
    handleAuth,
    initSumulaInitialData,
    addGoal,
    generatedUrl, setGeneratedUrl,
    copied, setCopiar,
    histSearch, setHistSearch,
    importModal, setImportModal,
    importData, setImportData,
    colMap, setColMap,
    handleFileUpload,
    doImportXlsx,
    gerarLink,
    copiarLink,
    gerarESalvarAgendado
  };
}
