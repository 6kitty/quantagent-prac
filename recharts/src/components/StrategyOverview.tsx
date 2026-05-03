import { Box, Typography } from "@mui/material";

const conditions = [
  {
    label: "A",
    title: "모멘텀 진입",
    detail: "RSI 30~70",
    description: "과열 직전 구간은 피하고, 상승 에너지가 살아 있는 종목만 추립니다.",
  },
  {
    label: "B",
    title: "추세 확인",
    detail: "ADX >= 20",
    description: "추세 강도가 약한 종목은 제외하고, 방향성이 분명한 흐름만 남깁니다.",
  },
  {
    label: "C",
    title: "상승 방향성",
    detail: "+DI > -DI",
    description: "상승 압력이 하락 압력보다 우세한 종목만 매수 후보로 인정합니다.",
  },
  {
    label: "D",
    title: "거래량 확인",
    detail: "20일 평균 대비 1.2배",
    description: "신호만 좋은 종목이 아니라 실제 매수세가 붙는 종목인지 확인합니다.",
  },
];

export default function StrategyOverview() {
  return (
    <Box
      sx={{
        px: { xs: 2, md: 4 },
        py: { xs: 2, md: 3 },
        borderBottom: "1px solid #e5ebf3",
        background: "linear-gradient(180deg, #f7faff 0%, #f2f6fb 100%)",
      }}
    >
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.02fr 1fr" }, gap: 2 }}>
        <Box
          sx={{
            p: { xs: 2.5, md: 3.5 },
            borderRadius: 6,
            bgcolor: "#ffffff",
            border: "1px solid #e7edf5",
            boxShadow: "0 10px 28px rgba(15, 23, 42, 0.04)",
          }}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#2563eb", mb: 1.2 }}>
            전략 개요
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: 28, md: 34 },
              lineHeight: 1.22,
              letterSpacing: "-0.04em",
              fontWeight: 800,
              color: "#111827",
              mb: 1.5,
            }}
          >
            추세가 확인된 종목만
            <br />
            자연스럽게 골라 담는 전략
          </Typography>
          <Typography
            sx={{
              fontSize: 15,
              lineHeight: 1.8,
              color: "#4b5563",
              maxWidth: 620,
              mb: 1.6,
            }}
          >
            이 전략은 단기 과열을 피하면서도 상승 흐름이 살아 있는 종목만 선별하는 데
            목적이 있습니다. 모멘텀과 추세, 방향성, 거래량을 함께 확인해 진입 신호의
            신뢰도를 높이고, 애매한 구간에서의 불필요한 매수를 줄입니다.
          </Typography>
          <Typography sx={{ fontSize: 15, lineHeight: 1.8, color: "#4b5563", maxWidth: 620 }}>
            결과적으로 강한 종목을 더 늦지 않게 따라가되, 상승 확률이 낮은 종목은 초기에
            걸러내는 보수적인 추세 추종 전략에 가깝습니다.
          </Typography>
        </Box>

        <Box
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: 6,
            bgcolor: "#ffffff",
            border: "1px solid #dbeafe",
            boxShadow: "0 10px 24px rgba(37, 99, 235, 0.06)",
          }}
        >
          <Typography sx={{ fontSize: 13, color: "#2563eb", fontWeight: 700, mb: 1.8 }}>
            매수 조건
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.2 }}>
            {conditions.map(({ label, title, detail, description }) => (
              <Box
                key={label}
                sx={{
                  p: 1.7,
                  borderRadius: 4,
                  bgcolor: "#fbfdff",
                  border: "1px solid #edf2f7",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Box
                    sx={{
                      minWidth: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor: "#e9f2ff",
                      color: "#2563eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    {label}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 15, color: "#111827", fontWeight: 700 }}>
                      {title}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: "#2563eb", fontWeight: 700 }}>
                      {detail}
                    </Typography>
                  </Box>
                </Box>
                <Typography sx={{ fontSize: 13, color: "#4b5563", lineHeight: 1.65 }}>
                  {description}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
