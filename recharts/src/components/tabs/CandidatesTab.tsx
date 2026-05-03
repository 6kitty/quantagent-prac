import { Box, Typography, Paper } from "@mui/material";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip as RTooltip, Legend,
} from "recharts";
import { candidateStocks, type CandidateStock } from "../../data/mockData";
import InsightBox from "../InsightBox";

const signalColor: Record<string, string> = { 매수: "#16a34a", 매도: "#dc2626", 보유: "#f59e0b" };

// ── 레이더 차트 데이터 ─────────────────────────────────────────────────────
const factorRadarData = [
  { subject: "모멘텀", 삼성전자: 82, SK하이닉스: 92, NAVER: 68, benchmark: 50 },
  { subject: "퀄리티", 삼성전자: 91, SK하이닉스: 88, NAVER: 85, benchmark: 50 },
  { subject: "밸류", 삼성전자: 74, SK하이닉스: 62, NAVER: 68, benchmark: 50 },
  { subject: "성장성", 삼성전자: 85, SK하이닉스: 94, NAVER: 79, benchmark: 50 },
  { subject: "변동성", 삼성전자: 72, SK하이닉스: 61, NAVER: 76, benchmark: 50 },
];

const altRadarData = [
  { subject: "뉴스 톤",     삼성전자: 78, SK하이닉스: 84, NAVER: 71, baseline: 50 },
  { subject: "컨센서스 상향", 삼성전자: 72, SK하이닉스: 79, NAVER: 63, baseline: 50 },
  { subject: "목표가 상승여력", 삼성전자: 81, SK하이닉스: 88, NAVER: 74, baseline: 50 },
];

// ── 종목별 선정 이유 카드 ──────────────────────────────────────────────────
function StockCard({ stock }: { stock: CandidateStock }) {
  const sc = signalColor[stock.signal];

  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid #e2e8f0",
        borderRadius: 2,
        p: 2,
        "&:hover": { borderColor: "#93c5fd", boxShadow: "0 2px 12px #1d4ed815" },
        transition: "all 0.15s",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{stock.name}</Typography>
          <Typography sx={{ fontSize: 11, color: "#94a3b8" }}>{stock.code}</Typography>
        </Box>
        <Box sx={{ bgcolor: `${sc}15`, border: `1.5px solid ${sc}`, borderRadius: 1.5, px: 1.2, py: 0.4 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 800, color: sc }}>{stock.signal}</Typography>
        </Box>
      </Box>

      <Box sx={{ bgcolor: "#f8fafc", borderRadius: 1.5, p: 1.2 }}>
        <Typography sx={{ fontSize: 12, color: "#0f172a", lineHeight: 1.6, mb: 0.5 }}>
          "{stock.citation.text}"
        </Typography>
        <Typography sx={{ fontSize: 10, color: "#2563eb", fontWeight: 600 }}>
          — {stock.citation.source} {stock.citation.date}
        </Typography>
      </Box>
    </Paper>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────
export default function CandidatesTab() {
  return (
    <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>

      <InsightBox
        tone="secondary"
        headline={<>이번 달은 <strong style={{ color: "#1d4ed8" }}>반도체·인터넷 중심 10종목</strong>. 애널리스트 컨센서스 상향이 가장 강한 종목들로 채워졌습니다.</>}
        sub="삼성전자·SK하이닉스의 목표가 상향 비율이 최근 3개월 평균 대비 각각 +18%p · +22%p 상승했습니다."
        points={["반도체 28%", "인터넷 16%", "뉴스 192건 분석", "리포트 48건 분석"]}
      />

      {/* ── 종목 선정 — 카드 그리드 ────────────────────────────────────────── */}
      <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, p: 3 }}>
        <Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: 15, mb: 2 }}>
          종목 선정
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 2 }}>
          {candidateStocks.map((stock) => (
            <StockCard key={stock.code} stock={stock} />
          ))}
        </Box>
      </Paper>

      {/* ── 팩터 레이더 차트 2개 ──────────────────────────────────────────── */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
        <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, p: 3 }}>
          <Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: 14, mb: 1.5 }}>정형 팩터</Typography>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={factorRadarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#374151" }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: "#94a3b8" }} />
              <Radar name="삼성전자" dataKey="삼성전자" stroke="#1d4ed8" fill="#1d4ed8" fillOpacity={0.15} />
              <Radar name="SK하이닉스" dataKey="SK하이닉스" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
              <Radar name="NAVER" dataKey="NAVER" stroke="#93c5fd" fill="#93c5fd" fillOpacity={0.1} />
              <Radar name="KOSPI200 평균" dataKey="benchmark" stroke="#94a3b8" fill="none" strokeDasharray="4 2" />
              <RTooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </Paper>

        <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, p: 3 }}>
          <Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: 14, mb: 1.5 }}>비정형 팩터</Typography>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={altRadarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#374151" }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: "#94a3b8" }} />
              <Radar name="삼성전자" dataKey="삼성전자" stroke="#1d4ed8" fill="#1d4ed8" fillOpacity={0.2} />
              <Radar name="SK하이닉스" dataKey="SK하이닉스" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} />
              <Radar name="NAVER" dataKey="NAVER" stroke="#93c5fd" fill="#93c5fd" fillOpacity={0.12} />
              <Radar name="기준선" dataKey="baseline" stroke="#94a3b8" fill="none" strokeDasharray="4 2" />
              <RTooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </Paper>
      </Box>
    </Box>
  );
}
