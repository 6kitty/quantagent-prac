import { Box, Typography, Divider, Tooltip } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { kpiData } from "../data/mockData";

const fmt = (v: number) => v.toLocaleString("ko-KR");

const stats = [
  {
    label: "누적 수익률",
    value: `+${kpiData.roi}%`,
    sub: "10년 백테스트",
    positive: true,
    tooltip: `2016~2025년(10년) 백테스트 누적 수익률입니다. KOSPI200 벤치마크(+${kpiData.benchmark}%)를 ${(kpiData.roi - kpiData.benchmark).toFixed(1)}%p 초과 달성했습니다. (수수료 0.015% · 거래세 0.23% · 슬리피지 0.1% 차감 후)`,
  },
  {
    label: "CAGR (연복리)",
    value: `${kpiData.cagr}%`,
    sub: "연평균 복합 성장률",
    positive: true,
    tooltip: `연평균 복합 성장률(CAGR)입니다. 원금이 매년 평균 ${kpiData.cagr}%씩 성장했다는 의미로, 예금 이자율(약 3~4%)과 비교해 이해할 수 있습니다.`,
  },
  {
    label: "Sharpe Ratio",
    value: String(kpiData.sharpeRatio),
    sub: "위험 대비 수익",
    positive: true,
    tooltip: `샤프 비율은 위험(변동성) 한 단위당 얼마나 수익을 올렸는지를 나타냅니다. 1.0 이상이면 양호, 1.5 이상이면 우수한 전략으로 평가됩니다. 이 전략은 ${kpiData.sharpeRatio}로 우수 등급입니다.`,
  },
  {
    label: "MDD (최대 낙폭)",
    value: `${kpiData.mdd}%`,
    sub: "고점 대비 최대 손실",
    positive: false,
    tooltip: `최대 낙폭(MDD)은 백테스트 기간 중 가장 크게 손실났던 구간의 낙폭입니다. 예를 들어 1억 원 투자 시 최대 약 ${Math.abs(kpiData.mdd)}%(${fmt(Math.round(100_000_000 * Math.abs(kpiData.mdd) / 100))}원)가 일시적으로 줄어들 수 있었다는 의미입니다.`,
  },
  {
    label: "이익 실현 누적",
    value: `${fmt(kpiData.profit)}원`,
    sub: `승률 ${kpiData.winRate}%`,
    positive: true,
    tooltip: `백테스트 10년간 원금(1억 원) 대비 실현된 총 이익입니다. 전체 거래의 ${kpiData.winRate}%에서 수익이 발생했습니다.`,
  },
  {
    label: "평가금액",
    value: `${fmt(kpiData.totalAsset)}원`,
    sub: "백테스트 종료 시점",
    positive: true,
    tooltip: `원금 1억 원으로 시작해 2025년 말 백테스트 종료 시점의 총 평가 자산입니다.`,
  },
  {
    label: "전체 거래 수",
    value: `${kpiData.totalTrades}건`,
    sub: `수익 거래 ${kpiData.winStocks}건`,
    positive: true,
    tooltip: `백테스트 기간 동안 발생한 총 매매 횟수입니다. 이 중 ${kpiData.winStocks}건(${kpiData.winRate}%)에서 수익이 실현되었습니다.`,
  },
  {
    label: "평균 보유기간",
    value: `${kpiData.avgHoldDays}일`,
    sub: "종목당 평균",
    positive: true,
    tooltip: `한 종목을 매수한 뒤 매도하기까지 평균 ${kpiData.avgHoldDays}일 보유했습니다. 월간 리밸런싱 전략의 특성상 약 22일(영업일 기준) 보유 주기가 나타납니다.`,
  },
];

interface StatItemProps {
  label: string; value: string; sub: string; positive: boolean; tooltip: string; last?: boolean;
}

function StatItem({ label, value, sub, positive, tooltip, last }: StatItemProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "stretch" }}>
      <Box sx={{ px: 2.5, py: 1.5, minWidth: 130 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, mb: 0.3 }}>
          <Typography variant="caption" sx={{ color: "#64748b", fontSize: 11 }}>{label}</Typography>
          <Tooltip title={tooltip} arrow placement="top" slotProps={{ tooltip: { sx: { maxWidth: 280, fontSize: 12, lineHeight: 1.7 } } }}>
            <InfoOutlinedIcon sx={{ fontSize: 12, color: "#94a3b8", cursor: "pointer" }} />
          </Tooltip>
        </Box>
        <Typography sx={{ fontWeight: 700, fontSize: 18, color: positive ? "#1d4ed8" : "#dc2626", lineHeight: 1.2 }}>
          {value}
        </Typography>
        <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: 11 }}>{sub}</Typography>
      </Box>
      {!last && <Divider orientation="vertical" flexItem sx={{ borderColor: "#e2e8f0" }} />}
    </Box>
  );
}

export default function StatsBar() {
  return (
    <Box sx={{ bgcolor: "#fff", borderBottom: "1px solid #e2e8f0", px: 2 }}>
      <Box sx={{ display: "flex", alignItems: "stretch", flexWrap: "wrap", py: 0.5 }}>
        {stats.map((s, i) => (
          <StatItem key={i} {...s} last={i === stats.length - 1} />
        ))}
      </Box>
    </Box>
  );
}
