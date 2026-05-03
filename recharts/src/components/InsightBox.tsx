import { Box, Typography, Chip, Paper } from "@mui/material";

/** tone은 배지 색상에만 영향 — 박스 자체는 다른 Paper와 동일한 디자인 */
type Tone = "primary" | "secondary" | "danger";

const badgeStyle: Record<Tone, { bg: string; color: string }> = {
  primary:   { bg: "#dbeafe", color: "#1d4ed8" },
  secondary: { bg: "#eff6ff", color: "#1e40af" },
  danger:    { bg: "#fee2e2", color: "#b91c1c" },
};

interface Props {
  tone?: Tone;
  /** 한 줄 핵심 메시지 (강조하고 싶은 단어는 <strong>으로 마크업) */
  headline: string | React.ReactNode;
  /** 보조 한 줄 (옵션) */
  sub?: string | React.ReactNode;
  /** 핵심 포인트 칩 (옵션, 최대 4개 권장) */
  points?: string[];
  /** 좌측 라벨 칩 텍스트 */
  badge?: string;
}

export default function InsightBox({ tone = "primary", headline, sub, points, badge }: Props) {
  const b = badgeStyle[tone];

  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid #e2e8f0",
        borderRadius: 2,
        bgcolor: "#fff",
        p: 3,
      }}
    >
      {badge && (
        <Box sx={{ mb: 1.2 }}>
          <Chip
            label={badge}
            size="small"
            sx={{
              bgcolor: b.bg,
              color: b.color,
              fontWeight: 700,
              fontSize: 11,
              height: 22,
            }}
          />
        </Box>
      )}

      <Typography
        sx={{
          fontSize: 16,
          fontWeight: 700,
          color: "#0f172a",
          lineHeight: 1.5,
          mb: sub ? 0.6 : 0,
        }}
      >
        {headline}
      </Typography>

      {sub && (
        <Typography sx={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>
          {sub}
        </Typography>
      )}

      {points && points.length > 0 && (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1.5 }}>
          {points.map((p) => (
            <Chip
              key={p}
              label={p}
              size="small"
              sx={{
                bgcolor: "#f8fafc",
                color: "#374151",
                fontSize: 11,
                height: 24,
                fontWeight: 500,
                border: "1px solid #e2e8f0",
              }}
            />
          ))}
        </Box>
      )}
    </Paper>
  );
}
