import { OHLCVData } from "../types";

// ── KPI (비용·세금·슬리피지 차감 후) ──────────────────────────────────────
export const kpiData = {
  roi: 94.7,          // 누적 수익률 (10년, 비용 차감 후)
  cagr: 16.8,         // 연복리
  sharpeRatio: 1.62,
  mdd: -24.3,
  winRate: 61.4,
  totalTrades: 412,
  avgHoldDays: 22.1,
  benchmark: 42.6,    // KOSPI200 동기간
  totalAsset: 194_700_000,
  profit: 94_700_000,
  winStocks: 253,
  tradingCost: { commission: 0.015, tax: 0.23, slippage: 0.1 },
};

// ── 포트폴리오 히스토리 (2016-01 ~ 2025-12, 10년) ──────────────────────────
export const portfolioHistory = (() => {
  const data = [];
  let portfolio = 100;
  let benchmark = 100;
  const startDate = new Date("2016-01-01");
  for (let i = 0; i < 520; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i * 7);
    if (d > new Date("2025-12-31")) break;
    const pRet = (Math.random() - 0.43) * 3.5;
    const bRet = (Math.random() - 0.46) * 2.8;
    portfolio *= 1 + pRet / 100;
    benchmark *= 1 + bRet / 100;
    data.push({
      date: d.toISOString().slice(0, 10),
      portfolio: parseFloat(portfolio.toFixed(2)),
      benchmark: parseFloat(benchmark.toFixed(2)),
    });
  }
  return data;
})();

// ── 월별 수익률 (2016~2025, 10년) ─────────────────────────────────────────
export const monthlyReturns: { year: string; month: string; value: number }[] = [];
const _years = ["2016","2017","2018","2019","2020","2021","2022","2023","2024","2025"];
const _months = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const _rawMonthly: Record<string, number[]> = {
  "2016": [1.2,-2.4,3.1,4.8,-1.2,2.3,5.1,-0.8,-2.1,3.4,6.2,2.1],
  "2017": [4.3,2.1,1.8,3.4,5.2,2.8,-0.4,1.9,2.3,4.7,-1.2,3.8],
  "2018": [-3.2,-2.8,1.4,-4.1,-2.3,-1.8,3.2,-1.4,-4.8,2.1,1.8,-5.2],
  "2019": [6.4,1.3,2.8,-0.9,2.1,4.3,2.7,-1.2,-0.8,3.2,4.8,2.4],
  "2020": [3.2,-8.1,-15.4,12.3,4.7,2.1,6.8,5.4,-3.2,-1.8,8.9,5.2],
  "2021": [2.1,6.3,4.8,3.2,-2.7,1.9,-1.4,7.2,-4.1,5.8,-3.3,4.6],
  "2022": [-5.2,-3.8,2.4,-6.7,-8.2,-10.1,9.3,-3.4,-9.8,7.2,4.8,-2.1],
  "2023": [8.4,-1.2,3.7,2.1,4.8,6.2,3.4,-2.7,-4.8,-3.2,9.1,4.3],
  "2024": [2.8,7.3,3.1,-1.9,2.4,1.7,-0.8,4.2,1.9,-3.4,5.8,3.2],
  "2025": [1.4,3.2,-2.1,4.8,2.3,-1.4,3.7,2.1,-0.9,1.8,4.2,2.6],
};
for (const year of _years) {
  _rawMonthly[year].forEach((value, idx) => {
    monthlyReturns.push({ year, month: _months[idx], value });
  });
}

// ── MDD ───────────────────────────────────────────────────────────────────
export const drawdownData = (() => {
  const data = [];
  let peak = portfolioHistory[0].portfolio;
  for (const d of portfolioHistory) {
    if (d.portfolio > peak) peak = d.portfolio;
    const dd = ((d.portfolio - peak) / peak) * 100;
    data.push({ date: d.date, drawdown: parseFloat(dd.toFixed(2)), benchmark: parseFloat((dd * 0.55).toFixed(2)) });
  }
  return data;
})();

// ── 거래 내역 ──────────────────────────────────────────────────────────────
export const tradeHistory = [
  { date: "2025-11-28", buyCount: 8, sellCount: 0, holdCount: 10, periodReturn: -1.08, cumReturn: 8.35, asset: 194_176_064, remaining: 2_103_434 },
  { date: "2025-11-27", buyCount: 0, sellCount: 8, holdCount: 2, periodReturn: -9.84, cumReturn: 9.54, asset: 192_768_044, remaining: 44_131_044 },
  { date: "2025-10-31", buyCount: 8, sellCount: 0, holdCount: 10, periodReturn: 0.79, cumReturn: 21.49, asset: 188_742_610, remaining: 3_932_970 },
  { date: "2025-10-30", buyCount: 0, sellCount: 8, holdCount: 2, periodReturn: 14.54, cumReturn: 20.54, asset: 185_269_240, remaining: 48_380_440 },
  { date: "2025-09-30", buyCount: 10, sellCount: 0, holdCount: 10, periodReturn: -0.65, cumReturn: 5.24, asset: 162_619_323, remaining: 3_424_734 },
  { date: "2025-09-29", buyCount: 0, sellCount: 10, holdCount: 0, periodReturn: 11.38, cumReturn: 5.92, asset: 160_961_168, remaining: 52_961_168 },
  { date: "2025-08-30", buyCount: 8, sellCount: 0, holdCount: 10, periodReturn: 0.15, cumReturn: -4.9, asset: 147_550_471, remaining: 2_841_150 },
  { date: "2025-08-29", buyCount: 0, sellCount: 10, holdCount: 2, periodReturn: -3.74, cumReturn: -5.04, asset: 145_478_546, remaining: 38_199_126 },
  { date: "2025-07-31", buyCount: 8, sellCount: 0, holdCount: 10, periodReturn: 0.23, cumReturn: -1.36, asset: 151_320_855, remaining: 2_789_505 },
  { date: "2025-07-30", buyCount: 0, sellCount: 8, holdCount: 2, periodReturn: -4.51, cumReturn: -1.59, asset: 149_205_300, remaining: 40_002_020 },
];

export const barChartData = (() =>
  tradeHistory.slice().reverse().map((t) => ({
    date: t.date.slice(0, 7),
    periodReturn: t.periodReturn,
    cumReturn: t.cumReturn,
  }))
)();

// ── 후보군 — KOSPI200 종목 + 비정형 데이터 ─────────────────────────────────
export interface CandidateStock {
  rank: number;
  code: string;      // 6자리 종목코드
  name: string;      // 한국어 종목명
  sector: string;
  score: number;     // 종합 스코어
  momentum: number;  // 모멘텀 (%)
  valueScore: number;
  qualityScore: number;
  signal: "매수" | "매도" | "보유";
  confidence: number; // 0~100
  // 비정형 데이터
  newsCount: number;       // 한경 뉴스 건수
  reportCount: number;     // Seibro 리포트 건수
  targetUpside: number;    // 목표가 컨센 상승여력 (%)
  sentimentConf: number;   // sentiment × confidence 기여도 (0~100)
  revisionScore: number;   // revision_breadth 기여도 (0~100)
  upsideScore: number;     // price_upside 기여도 (0~100)
  citation: {
    text: string;
    source: string;
    date: string;
  };
}

export const candidateStocks: CandidateStock[] = [
  {
    rank: 1, code: "005930", name: "삼성전자", sector: "반도체",
    score: 92.4, momentum: 18.7, valueScore: 74, qualityScore: 91,
    signal: "매수", confidence: 88,
    newsCount: 34, reportCount: 8, targetUpside: 16.8,
    sentimentConf: 78, revisionScore: 72, upsideScore: 81,
    citation: { text: "HBM3E 수율 안정화로 2026E EPS +21% 전망, 4Q D램 가격 반등 기대", source: "한국투자증권", date: "2025.04.21" },
  },
  {
    rank: 2, code: "000660", name: "SK하이닉스", sector: "반도체",
    score: 90.1, momentum: 26.3, valueScore: 62, qualityScore: 88,
    signal: "매수", confidence: 85,
    newsCount: 28, reportCount: 11, targetUpside: 22.4,
    sentimentConf: 84, revisionScore: 79, upsideScore: 88,
    citation: { text: "HBM4 선공급 계약 체결, AI 서버향 매출 2026E +47% 전망", source: "미래에셋증권", date: "2025.04.18" },
  },
  {
    rank: 3, code: "035420", name: "NAVER", sector: "인터넷",
    score: 87.6, momentum: 14.2, valueScore: 68, qualityScore: 85,
    signal: "매수", confidence: 79,
    newsCount: 19, reportCount: 6, targetUpside: 13.6,
    sentimentConf: 71, revisionScore: 63, upsideScore: 74,
    citation: { text: "HyperCLOVA X 기업 SaaS 수주 확대, 광고·커머스 트리플 성장 궤도 진입", source: "NH투자증권", date: "2025.04.15" },
  },
  {
    rank: 4, code: "207940", name: "삼성바이오로직스", sector: "바이오",
    score: 85.3, momentum: 11.8, valueScore: 52, qualityScore: 93,
    signal: "보유", confidence: 74,
    newsCount: 14, reportCount: 7, targetUpside: 18.2,
    sentimentConf: 66, revisionScore: 71, upsideScore: 82,
    citation: { text: "4공장 풀가동 + 5공장 2025Q4 가동, 수주잔고 2.1조 원 사상 최대", source: "키움증권", date: "2025.04.10" },
  },
  {
    rank: 5, code: "005380", name: "현대차", sector: "자동차",
    score: 83.8, momentum: 9.4, valueScore: 81, qualityScore: 79,
    signal: "매수", confidence: 71,
    newsCount: 22, reportCount: 5, targetUpside: 11.3,
    sentimentConf: 58, revisionScore: 67, upsideScore: 69,
    citation: { text: "아이오닉9 글로벌 출시 + 北美 현지생산 확대, 2026E ROE 12% 전망", source: "삼성증권", date: "2025.04.09" },
  },
  {
    rank: 6, code: "051910", name: "LG화학", sector: "화학",
    score: 81.2, momentum: 7.8, valueScore: 71, qualityScore: 77,
    signal: "보유", confidence: 66,
    newsCount: 11, reportCount: 4, targetUpside: 9.7,
    sentimentConf: 54, revisionScore: 58, upsideScore: 62,
    citation: { text: "양극재 NCMA 9 시리즈 수율 개선, 전기차 배터리 원가 절감 로드맵 발표", source: "대신증권", date: "2025.04.07" },
  },
  {
    rank: 7, code: "035720", name: "카카오", sector: "인터넷",
    score: 78.9, momentum: 12.1, valueScore: 55, qualityScore: 73,
    signal: "보유", confidence: 62,
    newsCount: 16, reportCount: 3, targetUpside: 14.8,
    sentimentConf: 61, revisionScore: 48, upsideScore: 71,
    citation: { text: "카카오페이·카카오뱅크 수익 개선, 2025 MAU 4,800만 돌파 전망", source: "하나증권", date: "2025.04.04" },
  },
  {
    rank: 8, code: "005490", name: "POSCO홀딩스", sector: "철강",
    score: 76.4, momentum: 6.2, valueScore: 85, qualityScore: 74,
    signal: "매수", confidence: 68,
    newsCount: 9, reportCount: 4, targetUpside: 8.9,
    sentimentConf: 52, revisionScore: 61, upsideScore: 59,
    citation: { text: "리튬 사업 2025 흑자전환 전망, 철강 가격 반등 + 이차전지소재 투트랙 성장", source: "한화투자증권", date: "2025.04.03" },
  },
  {
    rank: 9, code: "006400", name: "삼성SDI", sector: "2차전지",
    score: 74.8, momentum: 8.9, valueScore: 64, qualityScore: 76,
    signal: "보유", confidence: 64,
    newsCount: 12, reportCount: 5, targetUpside: 12.1,
    sentimentConf: 49, revisionScore: 56, upsideScore: 65,
    citation: { text: "원통형 46파이 양산 본격화, 북미 전기차 배터리 수주 잔고 2026년 최대 기대", source: "KB증권", date: "2025.04.02" },
  },
  {
    rank: 10, code: "068270", name: "셀트리온", sector: "바이오",
    score: 72.1, momentum: 5.4, valueScore: 58, qualityScore: 81,
    signal: "보유", confidence: 61,
    newsCount: 10, reportCount: 4, targetUpside: 10.8,
    sentimentConf: 47, revisionScore: 54, upsideScore: 61,
    citation: { text: "짐펜트라 미국 판매 확대, 2025 바이오시밀러 처방 점유율 14% 돌파 전망", source: "신한투자증권", date: "2025.04.01" },
  },
];

// ── 리스크 요인 (한국 시장 기준) ──────────────────────────────────────────
export const riskFactors = [
  { category: "시장 리스크", level: "중", description: "FOMC 금리 동결 장기화 시 외국인 매도 압력 확대 우려", impact: 68 },
  { category: "섹터 집중 리스크", level: "높음", description: "반도체·인터넷 섹터 비중 54%로 쏠림 발생, 업황 동반 하락 위험", impact: 83 },
  { category: "유동성 리스크", level: "낮음", description: "평균 일평균거래대금 4,500억 원 이상, 청산 용이 (KOSPI200 기준)", impact: 24 },
  { category: "환율 리스크", level: "중", description: "원/달러 변동성 확대 시 외국인 수급 및 반도체 수출 영향", impact: 58 },
  { category: "규제 리스크", level: "중", description: "공매도 재개 일정 및 금투세 관련 시장 불확실성", impact: 61 },
  { category: "이벤트 리스크", level: "낮음", description: "DART 공시 기반 어닝 서프라이즈 포착으로 쇼크 최소화", impact: 31 },
];

// ── 개선 방향 (한국 alt-data 표현으로 교체) ──────────────────────────────
export const improvements = [
  { priority: "P1", title: "revision_breadth 가중치 강화", description: "Seibro 리포트 컨센서스 상향 비율(revision_breadth)의 w2 가중치를 0.25→0.35로 상향, 애널리스트 신호 반영 강도 확대", expectedEffect: "Sharpe Ratio 0.2p 개선 예상", effort: "중" },
  { priority: "P1", title: "섹터 분산 강화", description: "반도체·인터넷 비중 상한 40%로 제한, KOSPI200 내 헬스케어·소재·산업재 섹터 편입 비율 확대", expectedEffect: "MDD 24% → 16% 개선 예상", effort: "중" },
  { priority: "P2", title: "한경 뉴스 sentiment 윈도우 단축", description: "현재 30일 뉴스 감성 집계 윈도우를 14일로 단축하여 최신 시장 반응을 빠르게 반영", expectedEffect: "승률 3~5%p 개선 예상", effort: "낮음" },
  { priority: "P2", title: "DART 공시 이벤트 트리거 추가", description: "주요 공시(자사주 취득·CB·유상증자)를 실시간 감지해 리밸런싱 트리거로 활용, 이벤트 드리븐 수익 포착", expectedEffect: "연간 수익률 1.5~2.0%p 추가 가능", effort: "높음" },
  { priority: "P3", title: "동적 손절 기준 도입", description: "고정 8% 손절선을 KOSPI200 ATR(20일) 기반 동적 손절로 전환, 고변동성 구간 대응력 향상", expectedEffect: "거래 빈도 15% 감소, 비용 절감", effort: "중" },
];

// ── A/B 비교 데이터 (비정형 필터 ON vs OFF) ───────────────────────────────
export const abCompareData = {
  filterOn: { roi: 94.7, cagr: 16.8, sharpe: 1.62, mdd: -24.3, winRate: 61.4 },
  filterOff: { roi: 67.2, cagr: 12.1, sharpe: 1.19, mdd: -31.8, winRate: 54.7 },
};

export const abChartData = (() => {
  const data = [];
  let on = 100, off = 100;
  const start = new Date("2016-01-01");
  for (let i = 0; i < 120; i++) {
    const d = new Date(start);
    d.setMonth(start.getMonth() + i);
    if (d > new Date("2025-12-31")) break;
    on *= 1 + (Math.random() - 0.42) * 0.05;
    off *= 1 + (Math.random() - 0.44) * 0.045;
    data.push({ date: d.toISOString().slice(0, 7), filterOn: parseFloat(on.toFixed(2)), filterOff: parseFloat(off.toFixed(2)) });
  }
  return data;
})();

// ── 팩터 가중치 ───────────────────────────────────────────────────────────
export const factorWeights = { w1: 0.35, w2: 0.35, w3: 0.30 }; // sentiment×conf / revision_breadth / price_upside

// ── 이메일 리포트 미리보기 데이터 ─────────────────────────────────────────
export const emailReportData = {
  date: "2025-12-01",
  sendTime: "08:00",
  marketSummary: "코스피 전일 대비 +0.43% 상승 마감(2,634.2p). 외국인 2,300억 순매수. 반도체·2차전지 강세, 금융·유틸리티 약세.",
  topNews: [
    { title: "삼성전자 HBM3E 엔비디아 공급 승인 완료", source: "한경", time: "07:12" },
    { title: "한국은행, 기준금리 동결 3.00% 유지", source: "연합뉴스", time: "06:45" },
    { title: "美 PCE 예상치 하회… 연준 금리인하 기대 재상승", source: "한경", time: "06:20" },
  ],
  todayCandidates: candidateStocks.filter(c => c.signal === "매수").slice(0, 5),
  signals: [
    { code: "005930", name: "삼성전자", signal: "매수" as const, confidence: 88, reason: "HBM3E 출하 + 컨센 상향" },
    { code: "000660", name: "SK하이닉스", signal: "매수" as const, confidence: 85, reason: "HBM4 선계약 + 목표가 상향" },
    { code: "035420", name: "NAVER", signal: "매수" as const, confidence: 79, reason: "AI SaaS 수주 확대" },
    { code: "207940", name: "삼성바이오로직스", signal: "보유" as const, confidence: 74, reason: "5공장 가동 관망" },
    { code: "005380", name: "현대차", signal: "매수" as const, confidence: 71, reason: "북미 판매 호조" },
  ],
  riskSummary: "반도체 섹터 집중도 높아 HBM 가격 조정 시 포트폴리오 변동성 확대 가능. 11월 FOMC 전 외인 수급 변동 주의.",
};

// ── 삼성전자 OHLCV (KRW 단위, 최근 120거래일) ─────────────────────────────
export const ohlcvData: OHLCVData[] = (() => {
  const data: OHLCVData[] = [];
  let close = 73_000;
  const start = new Date("2025-06-01");
  for (let i = 0; i < 180; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const open = close * (1 + (Math.random() - 0.5) * 0.018);
    const high = Math.max(open, close) * (1 + Math.random() * 0.012);
    const low = Math.min(open, close) * (1 - Math.random() * 0.012);
    close = open * (1 + (Math.random() - 0.47) * 0.022);
    data.push({
      date: d,
      open: Math.round(open / 100) * 100,
      high: Math.round(high / 100) * 100,
      low: Math.round(low / 100) * 100,
      close: Math.round(close / 100) * 100,
      volume: Math.floor(Math.random() * 15_000_000 + 5_000_000),
    });
  }
  return data;
})();
