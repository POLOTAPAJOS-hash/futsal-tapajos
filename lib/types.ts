export interface Player {
  id: number;
  num: string;
  name: string;
  y: boolean;
  yMin?: string;
  yPer?: string;
  r: boolean;
  rMin?: string;
  rPer?: string;
  role: string;
}

export interface Goal {
  id: number;
  name: string;
  period: string;
  min: string;
}

export interface HistoricoItem {
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

export interface AgendadoItem {
  id: number;
  title: string;
  url: string;
  date: string;
}

export interface GameData {
  comp: string;
  cat: string;
  num: string;
  group: string;
  fase: string;
  teamA: string;
  teamB: string;
  gym: string;
  city: string;
  date: string;
  time: string;
  rosterA: string;
  rosterB: string;
  techA: string;
  auxA: string;
  prepA: string;
  massA: string;
  medA: string;
  supA: string;
  techB: string;
  auxB: string;
  prepB: string;
  massB: string;
  medB: string;
  supB: string;
}

export interface Config {
  clube: string;
  cidade: string;
  estado: string;
  ginasio: string;
  comp: string;
  cat: string;
  temp: string;
  nextNum: number;
  competitions: string[];
  mobileMode: boolean;
  confirmSave: boolean;
}

export interface Sumula {
  p1i: string;
  p1f: string;
  p2i: string;
  p2f: string;
  pei: string;
  pef: string;
  techA: string;
  techB: string;
  scoreA: number;
  scoreB: number;
  scoreExtraA: number;
  scoreExtraB: number;
  scorePenA: number;
  scorePenB: number;
  arb1: string;
  arb2: string;
  arb3: string;
  arb4: string;
  arb5: string;
  arb6: string;
  timeA1: string;
  timeA2: string;
  timeB1: string;
  timeB2: string;
  reportType: string;
  reportText: string;
}
