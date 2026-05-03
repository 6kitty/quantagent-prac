import { Box, Typography, Paper, Chip, Divider } from "@mui/material";
import { kpiData } from "../data/mockData";

const excess = (kpiData.roi - kpiData.benchmark).toFixed(1);

export default function InsightPanel() {
  return (
    <Box sx={{ bgcolor: "#fff", borderBottom: "1px solid #e2e8f0", px: 4, py: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>전략 종합 평가</Typography>
        <Chip label="초보 퀀트를 위한 해설" size="small"
          sx={{ bgcolor: "#f1f5f9", color: "#64748b", fontSize: 11, height: 22 }} />
        <Chip label="2025.12 기준" size="small"
          sx={{ bgcolor: "#dbeafe", color: "#1d4ed8", fontWeight: 600, fontSize: 11, height: 22 }} />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>

        {/* ① 수익성 */}
        <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, p: 2.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.2 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>수익성</Typography>
            <Chip label="양호" size="small"
              sx={{ bgcolor: "#dcfce7", color: "#16a34a", fontWeight: 700, fontSize: 11, height: 20 }} />
          </Box>
          <Typography sx={{ fontSize: 13, color: "#374151", lineHeight: 1.9 }}>
            2016년 1월 1억 원을 투자했다면 2025년 말 <strong>약 1억 9,470만 원</strong>이 됩니다.
            KOSPI200을 그냥 추종했다면 1억 4,260만 원이었을 겁니다.
            이 전략이 약 <strong>5,210만 원을 더 벌어준 셈</strong>입니다.
            연복리 {kpiData.cagr}%는 정기예금(약 3%)의 5배 수준입니다.
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5, mt: 1.5, flexWrap: "wrap" }}>
            {[
              { label: "전략 누적", value: `+${kpiData.roi}%`, color: "#1d4ed8" },
              { label: "KOSPI200", value: `+${kpiData.benchmark}%`, color: "#64748b" },
              { label: "초과 수익", value: `+${excess}%p`, color: "#16a34a" },
            ].map(({ label, value, color }) => (
              <Box key={label} sx={{ bgcolor: "#f8fafc", borderRadius: 1.5, px: 1.5, py: 0.8 }}>
                <Typography sx={{ fontSize: 9, color: "#94a3b8" }}>{label}</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color }}>{value}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* ② 안정성 */}
        <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, p: 2.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.2 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>안정성</Typography>
            <Chip label="우수" size="small"
              sx={{ bgcolor: "#dbeafe", color: "#1d4ed8", fontWeight: 700, fontSize: 11, height: 20 }} />
          </Box>
          <Typography sx={{ fontSize: 13, color: "#374151", lineHeight: 1.9 }}>
            샤프 비율 <strong>{kpiData.sharpeRatio}</strong>은 위험 대비 수익 효율 지표입니다.
            퀀트 업계에서 <strong>1.5 이상이면 우수</strong> 등급으로 분류합니다.
            최대 낙폭(MDD) <strong>−{Math.abs(kpiData.mdd)}%</strong>는 2022년 6월∼2023년 1월에 기록됐습니다.
            1억 기준 약 2,430만 원이 일시 감소했지만, 같은 기간 KOSPI200은 −31.8%였습니다.
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5, mt: 1.5, flexWrap: "wrap" }}>
            {[
              { label: "Sharpe", value: String(kpiData.sharpeRatio), color: "#1d4ed8" },
              { label: "MDD(전략)", value: `${kpiData.mdd}%`, color: "#dc2626" },
              { label: "MDD(지수)", value: "−31.8%", color: "#94a3b8" },
            ].map(({ label, value, color }) => (
              <Box key={label} sx={{ bgcolor: "#f8fafc", borderRadius: 1.5, px: 1.5, py: 0.8 }}>
                <Typography sx={{ fontSize: 9, color: "#94a3b8" }}>{label}</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color }}>{value}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* ③ 핵심 차별점 */}
        <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, p: 2.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.2 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>핵심 차별점</Typography>
            <Chip label="비정형 신호" size="small"
              sx={{ bgcolor: "#fef3c7", color: "#92400e", fontWeight: 700, fontSize: 11, height: 20 }} />
          </Box>
          <Typography sx={{ fontSize: 13, color: "#374151", lineHeight: 1.9 }}>
            비정형 신호(Seibro + 한경 뉴스)를 끄면 누적 수익이 <strong>+94.7% → +67.2%</strong>로 약 27.5%p 감소합니다.
            MDD도 −24.3% → −31.8%로 악화됩니다. 수익은 높이면서 손실은 줄인 것이 LLM 신호의 역할입니다.
            현재 반도체·인터넷 비중 54%로 섹터 집중이 가장 큰 리스크입니다.
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5, mt: 1.5, flexWrap: "wrap" }}>
            {[
              { label: "비정형 ON", value: "+94.7%", color: "#1d4ed8" },
              { label: "비정형 OFF", value: "+67.2%", color: "#94a3b8" },
              { label: "기여차이", value: "+27.5%p", color: "#d97706" },
            ].map(({ label, value, color }) => (
              <Box key={label} sx={{ bgcolor: "#f8fafc", borderRadius: 1.5, px: 1.5, py: 0.8 }}>
                <Typography sx={{ fontSize: 9, color: "#94a3b8" }}>{label}</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color }}>{value}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>

      <Divider sx={{ mt: 2, borderColor: "#e2e8f0" }} />
      <Typography sx={{ mt: 1, fontSize: 10, color: "#94a3b8" }}>
        ✱ 위 평가는 시뮬레이션 기반이며 미래 성과를 보장하지 않습니다. 수수료 0.015% · 거래세 0.23% · 슬리피지 0.1% 차감 후 기준.
      </Typography>
    </Box>
  );
}
