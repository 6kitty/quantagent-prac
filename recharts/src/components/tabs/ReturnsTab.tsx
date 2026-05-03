import { Box, Typography, ToggleButton, ToggleButtonGroup, Paper } from "@mui/material";
import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ReferenceLine,
} from "recharts";
import { portfolioHistory, drawdownData, monthlyReturns } from "../../data/mockData";
import InsightBox from "../InsightBox";

const BLUE = "#2563eb";

function MonthlyHeatmap() {
  const years = ["2016","2017","2018","2019","2020","2021","2022","2023","2024","2025"];
  const months = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
  const byYearMonth: Record<string, Record<string, number>> = {};
  for (const d of monthlyReturns) {
    if (!byYearMonth[d.year]) byYearMonth[d.year] = {};
    byYearMonth[d.year][d.month] = d.value;
  }
  const getColor = (v: number) => {
    if (v > 8) return "#1d4ed8";
    if (v > 4) return "#3b82f6";
    if (v > 0) return "#93c5fd";
    if (v > -4) return "#fca5a5";
    if (v > -8) return "#ef4444";
    return "#b91c1c";
  };
  return (
    <Box>
      <Typography sx={{ fontWeight: 600, color: "#0f172a", fontSize: 14, mb: 1.5 }}>
        월별 수익률 히트맵 (2016~2025)
      </Typography>
      <Box sx={{ overflowX: "auto" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: `56px repeat(12, 1fr)`, gap: 0.5, minWidth: 760 }}>
          <Box />
          {months.map((m) => (
            <Typography key={m} sx={{ fontSize: 10, color: "#64748b", textAlign: "center" }}>{m}</Typography>
          ))}
          {years.map((y) => (
            <Box key={y} sx={{ display: "contents" }}>
              <Typography sx={{ fontSize: 10, color: "#64748b", display: "flex", alignItems: "center" }}>{y}</Typography>
              {months.map((m) => {
                const v = byYearMonth[y]?.[m] ?? 0;
                return (
                  <Box key={m} sx={{ bgcolor: getColor(v), borderRadius: 0.8, display: "flex", alignItems: "center", justifyContent: "center", py: 0.7 }}>
                    <Typography sx={{ fontSize: 9, color: "#fff", fontWeight: 600 }}>
                      {v > 0 ? "+" : ""}{v}%
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>
      <Box sx={{ display: "flex", gap: 1.5, mt: 1, flexWrap: "wrap" }}>
        {([["#1d4ed8",">+8%"],["#3b82f6","+4~8%"],["#93c5fd","0~+4%"],["#fca5a5","0~-4%"],["#ef4444","-4~-8%"],["#b91c1c","<-8%"]] as [string,string][]).map(([c,l]) => (
          <Box key={l} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, bgcolor: c, borderRadius: 0.5 }} />
            <Typography sx={{ fontSize: 10, color: "#64748b" }}>{l}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

const slim = portfolioHistory.filter((_, i) => i % 3 === 0);
const slimDd = drawdownData.filter((_, i) => i % 3 === 0);

export default function ReturnsTab() {
  const [view, setView] = useState<"cumulative" | "monthly" | "annual">("cumulative");

  return (
    <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>

      {/* ── 한 줄 인사이트 ─────────────────────────────────────────────────── */}
      <InsightBox
        tone="primary"
        badge="10년 백테스트"
        headline={<>10년 누적 <strong style={{ color: "#1d4ed8" }}>+94.7%</strong>로 KOSPI200(+42.6%) 대비 <strong style={{ color: "#1d4ed8" }}>+52.1%p</strong> 초과 수익을 냈습니다.</>}
        sub="2022년 하락 구간에서도 KOSPI200(−31.8%) 대비 작은 낙폭(−24.3%)을 기록해 하방 방어력을 보여줬습니다."
        points={["연복리 16.8%", "Sharpe 1.62", "MDD −24.3%", "벤치마크 MDD −31.8%"]}
      />

      {/* ── 누적 수익률 ───────────────────────────────────────────────────── */}
      <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: 15 }}>누적 수익률</Typography>
          <ToggleButtonGroup
            size="small"
            value={view}
            exclusive
            onChange={(_, v) => v && setView(v)}
            sx={{
              "& .MuiToggleButton-root": {
                fontSize: 12,
                py: 0.3,
                px: 1.5,
                textTransform: "none",
                "&.Mui-selected": { bgcolor: "#2563eb", color: "#fff" },
              },
            }}
          >
            <ToggleButton value="cumulative">누적</ToggleButton>
            <ToggleButton value="monthly">월별</ToggleButton>
            <ToggleButton value="annual">연별</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={slim} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => String(v).slice(0, 7)} interval={25} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `${v}%`} domain={["auto", "auto"]} />
            <Tooltip formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name === "portfolio" ? "전략" : "KOSPI200"]} labelStyle={{ fontSize: 12 }} />
            <Legend formatter={(v) => v === "portfolio" ? "수익률(전략)" : "KOSPI200"} wrapperStyle={{ fontSize: 12 }} />
            <ReferenceLine y={100} stroke="#e2e8f0" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="portfolio" stroke={BLUE} dot={false} strokeWidth={2} name="portfolio" />
            <Line type="monotone" dataKey="benchmark" stroke="#94a3b8" dot={false} strokeWidth={1.5} strokeDasharray="5 3" name="benchmark" />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      {/* ── MDD 차트 ──────────────────────────────────────────────────────── */}
      <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: 15 }}>누적 수익률 MDD</Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            {([["#ef4444","전략"],["#94a3b8","KOSPI200"]] as [string,string][]).map(([c,l]) => (
              <Box key={l} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box sx={{ width: 10, height: 10, bgcolor: c, borderRadius: "50%" }} />
                <Typography sx={{ fontSize: 11, color: "#64748b" }}>{l}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={slimDd} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="bmGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => String(v).slice(0, 7)} interval={25} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `${v}%`} />
            <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}%`]} labelStyle={{ fontSize: 12 }} />
            <ReferenceLine y={0} stroke="#94a3b8" />
            <Area type="monotone" dataKey="drawdown" stroke="#ef4444" fill="url(#ddGrad)" strokeWidth={2} dot={false} name="전략" />
            <Area type="monotone" dataKey="benchmark" stroke="#94a3b8" fill="url(#bmGrad)" strokeWidth={1.5} dot={false} name="KOSPI200" />
          </AreaChart>
        </ResponsiveContainer>

        <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1 }}>
          {([
            ["낙폭 시작일","2022.06.01"],["최대 낙폭일","2022.10.14"],
            ["낙폭 최종일","2023.01.31"],["지속 기간(월)","8"],["최대 낙폭(%)","−24.3%"],
          ] as [string,string][]).map(([label, value]) => (
            <Box key={label} sx={{ bgcolor: "#f8fafc", borderRadius: 1.5, p: 1.5 }}>
              <Typography sx={{ fontSize: 11, color: "#94a3b8" }}>{label}</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{value}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* ── 월별 히트맵 ─────────────────────────────────────────────────────── */}
      <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, p: 3 }}>
        <MonthlyHeatmap />
        <Typography sx={{ fontSize: 12, color: "#64748b", mt: 1.5, lineHeight: 1.7 }}>
          <strong style={{ color: "#0f172a" }}>가장 힘들었던 해는 2018·2022년</strong>(미중 무역전쟁 / 연준 금리 인상). 월간 리밸런싱이라 한 달이 나빠도 다음 달 회복 기회가 있는 구조입니다.
        </Typography>
      </Paper>

      {/* ── 연도별 비교 ───────────────────────────────────────────────────── */}
      <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, p: 3 }}>
        <Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: 15, mb: 2 }}>
          연도별 수익률 비교 (전략 vs KOSPI200)
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1.5 }}>
          {[
            { year:"2016", strategy:12.4, benchmark:3.3 },
            { year:"2017", strategy:28.1, benchmark:21.8 },
            { year:"2018", strategy:-14.2, benchmark:-17.3 },
            { year:"2019", strategy:22.7, benchmark:7.7 },
            { year:"2020", strategy:31.4, benchmark:30.8 },
            { year:"2021", strategy:24.8, benchmark:3.6 },
            { year:"2022", strategy:-18.3, benchmark:-24.9 },
            { year:"2023", strategy:29.4, benchmark:18.7 },
            { year:"2024", strategy:18.6, benchmark:-9.6 },
            { year:"2025", strategy:16.2, benchmark:4.8 },
          ].map(({ year, strategy, benchmark }) => (
            <Box key={year} sx={{ bgcolor: "#f8fafc", borderRadius: 2, p: 1.8, textAlign: "center" }}>
              <Typography sx={{ fontSize: 11, color: "#94a3b8", mb: 0.8 }}>{year}</Typography>
              <Typography sx={{ fontSize: 17, fontWeight: 700, color: strategy >= 0 ? BLUE : "#dc2626" }}>
                {strategy > 0 ? "+" : ""}{strategy}%
              </Typography>
              <Typography sx={{ fontSize: 10, color: "#94a3b8" }}>전략</Typography>
              <Box sx={{ mt: 0.5, pt: 0.5, borderTop: "1px solid #e2e8f0" }}>
                <Typography sx={{ fontSize: 12, color: benchmark >= 0 ? "#475569" : "#dc2626", fontWeight: 600 }}>
                  {benchmark > 0 ? "+" : ""}{benchmark}%
                </Typography>
                <Typography sx={{ fontSize: 9, color: "#94a3b8" }}>KOSPI200</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
}


