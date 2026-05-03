import { Box, Typography, Chip, Button } from "@mui/material";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import ShareIcon from "@mui/icons-material/Share";

export default function Header() {
  return (
    <Box sx={{ bgcolor: "#fff", borderBottom: "1px solid #e2e8f0" }}>
      <Box sx={{ px: 4, py: 2.2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <Chip
            label="QA-K200-001"
            size="small"
            sx={{
              bgcolor: "#dbeafe",
              color: "#1d4ed8",
              fontWeight: 700,
              fontSize: 11,
              height: 22,
              letterSpacing: 0.3,
            }}
          />
          <Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: 17 }}>
            정형 팩터 + 비정형 신호 복합 스코어 KOSPI200 월간 리밸런싱 전략
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            startIcon={<BookmarkBorderIcon />}
            size="small"
            variant="outlined"
            sx={{ borderColor: "#cbd5e1", color: "#64748b", fontSize: 12, "&:hover": { borderColor: "#2563eb", color: "#2563eb" } }}
          >
            저장
          </Button>
          <Button
            startIcon={<ShareIcon />}
            size="small"
            variant="contained"
            sx={{ bgcolor: "#2563eb", fontSize: 12, "&:hover": { bgcolor: "#1d4ed8" } }}
          >
            공유
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
