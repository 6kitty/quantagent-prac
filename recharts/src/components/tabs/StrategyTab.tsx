import { Box, Typography, Paper, Chip, Divider, Tooltip as MuiTooltip } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { kpiData } from "../../data/mockData";
import InsightBox from "../InsightBox";

const { commission, tax, slippage } = kpiData.tradingCost;

const conditions = [
  { label: "A", title: "모멘텀 진입", detail: "상대강도지수(RSI, 14) ≥ 30 AND ≤ 70" },
  { label: "B", title: "추세 확인", detail: "추세강도지수(DMI/ADX, 14) ≥ 20" },
  { label: "C", title: "상승 방향성", detail: "+DI > -DI (매수 우위)" },
  { label: "D", title: "거래량 확인", detail: "거래량 20일 평균 대비 ≥ 1.2배" },
];

export default function StrategyTab() {
  return (
    <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>

      {/* ── 한 줄 인사이트 ─────────────────────────────────────────────────── */}
      <InsightBox
        tone="primary"
        badge="왜 이 전략인가"
        headline={<>정형 팩터(모멘텀·퀄리티·밸류) 위에 <strong style={{ color: "#1d4ed8" }}>비정형 신호(애널리스트 리포트·뉴스)</strong>를 더해 KOSPI200 정보 우위를 잡는 전략입니다.</>}
        sub="A·B·C·D 네 조건이 동시 충족된 종목 중 정형 55% + 비정형 45% 가중합 스코어 상위 10종목을 매월 말 리밸런싱합니다."
        points={[
          "모멘텀 — 최근 오른 종목은 더 오르는 경향",
          "퀄리티 — 이익 안정적 기업은 오래 버티는 경향",
          "밸류 — 저평가는 결국 제 가격을 찾는 경향",
          "비정형 — 리포트·뉴스 LLM 분석 (정보 우위)",
        ]}
      />

      {/* ── 전략 개요 + 백테스트 결과 요약 ───────────────────────────────── */}
      <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, p: 3 }}>
        <Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: 16, mb: 0.5 }}>전략 개요</Typography>
        <Typography sx={{ color: "#64748b", fontSize: 13, lineHeight: 1.7, mb: 2 }}>
          본 전략은 <strong>모멘텀 · 퀄리티 · 밸류 3-팩터</strong>(정형)와
          <strong> Seibro 애널리스트 리포트 · 한경 뉴스 감성 분석</strong>(비정형)을 복합 스코어링하여
          <strong> KOSPI200</strong> 유니버스에서 상위 10종목을 매월 말 리밸런싱하는 LLM 기반 퀀트 전략입니다.
          모든 비정형 신호는 T-1 시가 기준(PIT 준수)으로 적용하며, Walk-Forward 검증으로 과적합을 방지합니다.
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
          {["모멘텀 팩터", "퀄리티 팩터", "밸류 팩터", "비정형 신호", "월간 리밸런싱", "KOSPI200", "LLM 기반", "T-1 PIT"].map((tag) => (
            <Chip key={tag} label={tag} size="small" sx={{ bgcolor: "#dbeafe", color: "#1d4ed8", fontWeight: 500, fontSize: 11 }} />
          ))}
        </Box>

        {/* 결과 요약 — Header에서 이동 */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, bgcolor: "#f8fafc", borderRadius: 1.5, px: 2, py: 1.2 }}>
          <Box sx={{ width: 3, alignSelf: "stretch", bgcolor: "#3182f6", borderRadius: 1 }} />
          <Typography sx={{ fontSize: 12, color: "#374151", lineHeight: 1.7 }}>
            10년 백테스트 결과, KOSPI200 대비 <strong style={{ color: "#1d4ed8" }}>{(kpiData.roi - kpiData.benchmark).toFixed(1)}%p 초과 수익</strong>을 달성했고
            비정형 신호가 정형 팩터 단독 대비 <strong style={{ color: "#1d4ed8" }}>MDD를 약 7.5%p</strong> 낮추는 데 기여했습니다.
            모든 지표는 수수료 0.015% · 거래세 0.23% · 슬리피지 0.1% 차감 후 값입니다.
          </Typography>
        </Box>
      </Paper>

      {/* ── 매수 조건식 ──────────────────────────────────────────────────── */}
      <Paper elevation={0} sx={{ border: "2px solid #1d4ed8", borderRadius: 2, p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Box sx={{ width: 4, height: 20, bgcolor: "#1d4ed8", borderRadius: 2 }} />
          <Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: 15 }}>매수 조건식</Typography>
          <Chip label="A AND B AND C AND D" size="small" sx={{ bgcolor: "#1d4ed8", color: "#fff", fontWeight: 700, fontSize: 11, height: 20 }} />
          <MuiTooltip
            title="네 조건을 동시에 충족하는 종목만 매수 후보로 올립니다. A(RSI)는 과매수/과매도 여부, B(ADX)는 추세가 뚜렷한지, C(DI)는 상승 방향인지, D(거래량)는 시장의 관심이 증가하는지를 확인합니다."
            arrow placement="right"
            slotProps={{ tooltip: { sx: { maxWidth: 300, fontSize: 12, lineHeight: 1.8 } } }}
          >
            <InfoOutlinedIcon sx={{ fontSize: 14, color: "#94a3b8", cursor: "pointer" }} />
          </MuiTooltip>
          <Box sx={{ ml: "auto" }}>
            <Typography sx={{ fontSize: 11, color: "#64748b" }}>매수 종목 선택: 종합 팩터 스코어 상위 (중립화)</Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
          {conditions.map(({ label, title, detail }) => (
            <Box key={label} sx={{ flex: "1 1 180px", bgcolor: "#f8fafc", borderRadius: 1.5, p: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <Box sx={{ width: 22, height: 22, borderRadius: "50%", bgcolor: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography sx={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>{label}</Typography>
                </Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{title}</Typography>
              </Box>
              <Typography sx={{ fontSize: 12, color: "#374151" }}>{detail}</Typography>
            </Box>
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
          <Box>
            <Typography sx={{ fontSize: 12, color: "#64748b", mb: 0.5 }}>손절 기준</Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#dc2626" }}>-8% 고정 손절</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, color: "#64748b", mb: 0.5 }}>익절 기준</Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#1d4ed8" }}>리밸런싱 시 자동 재조정</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, color: "#64748b", mb: 0.5 }}>종목당 비중</Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>균등 10% (10종목)</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, color: "#64748b", mb: 0.5 }}>포지션 사이징</Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>동일가중 / 변동성역가중 선택</Typography>
          </Box>
        </Box>
      </Paper>

      {/* ── 거래 비용·세금 (한국 시장 기준) ─────────────────────────────── */}
      <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, p: 3 }}>
        <Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: 15, mb: 1.5 }}>
          거래 비용 · 세금 (한국 시장 기준)
        </Typography>
        <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {[
            ["수수료", `${commission}%`, "매매 시 양방향"],
            ["거래세", `${tax}%`, "매도 시 부과"],
            ["슬리피지", `${slippage}%`, "체결가 마찰"],
            ["총 비용", `${(commission * 2 + tax + slippage).toFixed(3)}%`, "편도 기준 합산"],
          ].map(([label, value, sub]) => (
            <Box key={label as string}>
              <Typography sx={{ fontSize: 11, color: "#94a3b8" }}>{label as string}</Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#1d4ed8" }}>{value as string}</Typography>
              <Typography sx={{ fontSize: 10, color: "#94a3b8" }}>{sub as string}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>

    </Box>
  );
}


