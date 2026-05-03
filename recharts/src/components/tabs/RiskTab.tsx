import { Box, Typography, Paper, Chip, LinearProgress } from "@mui/material";
import { riskFactors } from "../../data/mockData";
import InsightBox from "../InsightBox";

// 블루 단일 계열 명도 변형 + "높음"만 레드 강조 (손해/위험 통용)
const levelColor: Record<string, string> = {
  높음: "#dc2626",
  중: "#3b82f6",
  낮음: "#93c5fd",
};
const levelChipBg: Record<string, string> = {
  높음: "#fee2e2",
  중: "#dbeafe",
  낮음: "#eff6ff",
};

export default function RiskTab() {
  // 영향도 내림차순 정렬 — 위험이 큰 순서로 자연스럽게 비교
  const sorted = [...riskFactors].sort((a, b) => b.impact - a.impact);

  return (
    <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
      <InsightBox
        tone="danger"
        badge="가장 큰 위협"
        headline={
          <>
            가장 큰 약점은 <strong style={{ color: "#b91c1c" }}>섹터 집중</strong>입니다. 반도체·인터넷 비중이 약{" "}
            <strong style={{ color: "#b91c1c" }}>40%</strong>로 KOSPI200(약 25%)을 크게 웃돕니다.
          </>
        }
        sub="HBM 가격 조정이나 외국인 대규모 이탈 시 시장보다 큰 낙폭이 발생할 수 있습니다."
        points={["반도체 28% · 인터넷 16%", "환율 리스크 영향도 58", "유동성·규제는 안정 구간"]}
      />

      <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, p: 3 }}>
        <Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: 16, mb: 2 }}>
          리스크 요약
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
          {sorted.map((r) => (
            <Box
              key={r.category}
              sx={{
                display: "grid",
                gridTemplateColumns: "180px 1fr 220px 60px",
                alignItems: "center",
                gap: 2,
                p: 2,
                bgcolor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 1.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{r.category}</Typography>
                <Chip
                  label={r.level}
                  size="small"
                  sx={{
                    bgcolor: levelChipBg[r.level],
                    color: levelColor[r.level],
                    fontWeight: 700,
                    fontSize: 10,
                    height: 20,
                  }}
                />
              </Box>
              <Typography sx={{ fontSize: 12, color: "#64748b" }}>{r.description}</Typography>
              <LinearProgress
                variant="determinate"
                value={r.impact}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: "#e2e8f0",
                  "& .MuiLinearProgress-bar": { bgcolor: levelColor[r.level], borderRadius: 3 },
                }}
              />
              <Typography sx={{ fontSize: 11, color: "#64748b", textAlign: "right" }}>
                {r.impact}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
}
