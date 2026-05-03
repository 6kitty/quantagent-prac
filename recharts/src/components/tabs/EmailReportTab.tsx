import { Box, Typography, Paper, Chip, Divider } from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import { emailReportData } from "../../data/mockData";

const signalColor: Record<string, string> = {
  매수: "#16a34a",
  매도: "#dc2626",
  보유: "#2563eb",
  관찰: "#f59e0b",
};

const signalBg: Record<string, string> = {
  매수: "#dcfce7",
  매도: "#fee2e2",
  보유: "#dbeafe",
  관찰: "#fef9c3",
};

export default function EmailReportTab() {
  const r = emailReportData;

  return (
    <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>

      {/* ── 이메일 카드 외관 ────────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          border: "1px solid #e2e8f0",
          borderRadius: 2,
          overflow: "hidden",
          maxWidth: 720,
          mx: "auto",
          width: "100%",
        }}
      >
        {/* 이메일 헤더 */}
        <Box sx={{ bgcolor: "#1e3a5f", px: 3, py: 2.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <EmailIcon sx={{ color: "#60a5fa", fontSize: 20 }} />
              <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>QuantAgent Daily Report</Typography>
            </Box>
            <Chip label={`${r.date} · ${r.sendTime} 발송`} size="small" sx={{ bgcolor: "#1d4ed8", color: "#fff", fontWeight: 600, fontSize: 11 }} />
          </Box>
          <Typography sx={{ color: "#93c5fd", fontSize: 12, mt: 0.5 }}>
            KOSPI200 LLM 팩터+비정형 전략 · 개미핥기 · {r.date}
          </Typography>
        </Box>

        <Box sx={{ px: 3, py: 2.5, display: "flex", flexDirection: "column", gap: 2.5 }}>

          {/* ── 전일 시황 요약 ────────────────────────────────────────────────── */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 1 }}>
              <Box sx={{ width: 4, height: 16, bgcolor: "#2563eb", borderRadius: 2 }} />
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>전일 시황 요약</Typography>
            </Box>
            <Box sx={{ bgcolor: "#f8fafc", borderRadius: 1.5, px: 2, py: 1.5 }}>
              <Typography sx={{ fontSize: 13, color: "#374151", lineHeight: 1.8 }}>{r.marketSummary}</Typography>
            </Box>
          </Box>

          <Divider sx={{ borderColor: "#f1f5f9" }} />

          {/* ── 주요 뉴스 ─────────────────────────────────────────────────────── */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 1 }}>
              <Box sx={{ width: 4, height: 16, bgcolor: "#0891b2", borderRadius: 2 }} />
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>주요 뉴스 요약</Typography>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
              {r.topNews.map((n, i) => (
                <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 1, py: 0.8, borderBottom: i < r.topNews.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                  <Box sx={{ minWidth: 18, height: 18, bgcolor: "#dbeafe", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", mt: 0.1 }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#2563eb" }}>{i + 1}</Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 13, color: "#0f172a", lineHeight: 1.5 }}>{n.title}</Typography>
                    <Typography sx={{ fontSize: 11, color: "#94a3b8" }}>{n.source} · {n.time}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          <Divider sx={{ borderColor: "#f1f5f9" }} />

          {/* ── 오늘의 신호 ───────────────────────────────────────────────────── */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 1.5 }}>
              <Box sx={{ width: 4, height: 16, bgcolor: "#16a34a", borderRadius: 2 }} />
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>오늘의 매수·매도·관찰 신호</Typography>
              <Chip label="T-1 PIT 기준" size="small" sx={{ bgcolor: "#f1f5f9", color: "#64748b", fontSize: 10, height: 20, ml: "auto" }} />
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {r.signals.map((s) => (
                <Box
                  key={s.code}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    p: 1.5,
                    bgcolor: `${signalBg[s.signal]}`,
                    borderRadius: 1.5,
                    border: `1px solid ${signalColor[s.signal]}33`,
                  }}
                >
                  <Chip
                    label={s.signal}
                    size="small"
                    sx={{ bgcolor: signalColor[s.signal], color: "#fff", fontWeight: 700, fontSize: 11, height: 22, minWidth: 40 }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                      <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>{s.code}</Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{s.name}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: 12, color: "#374151" }}>{s.reason}</Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography sx={{ fontSize: 11, color: "#94a3b8" }}>신뢰도</Typography>
                    <Typography sx={{ fontSize: 15, fontWeight: 800, color: signalColor[s.signal] }}>{s.confidence}%</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          <Divider sx={{ borderColor: "#f1f5f9" }} />

          {/* ── 오늘의 후보 종목 ──────────────────────────────────────────────── */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 1.5 }}>
              <Box sx={{ width: 4, height: 16, bgcolor: "#7c3aed", borderRadius: 2 }} />
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>오늘의 후보 종목</Typography>
              <Typography sx={{ fontSize: 11, color: "#94a3b8", ml: 0.5 }}>매수 신호 상위 5종목</Typography>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1 }}>
              {r.todayCandidates.map((c, i) => (
                <Box
                  key={c.code}
                  sx={{
                    bgcolor: "#f8fafc",
                    borderRadius: 1.5,
                    p: 1.5,
                    textAlign: "center",
                    border: i === 0 ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                  }}
                >
                  {i === 0 && (
                    <Typography sx={{ fontSize: 9, color: "#2563eb", fontWeight: 700, mb: 0.3 }}>TOP 1</Typography>
                  )}
                  <Typography sx={{ fontSize: 10, color: "#94a3b8" }}>{c.code}</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#0f172a", mb: 0.5 }}>{c.name}</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 800, color: "#2563eb" }}>{c.score}점</Typography>
                  <Typography sx={{ fontSize: 10, color: "#64748b" }}>{c.sector}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Divider sx={{ borderColor: "#f1f5f9" }} />

          {/* ── 리스크 요약 ───────────────────────────────────────────────────── */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 1 }}>
              <Box sx={{ width: 4, height: 16, bgcolor: "#dc2626", borderRadius: 2 }} />
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>오늘의 리스크 요약</Typography>
            </Box>
            <Box sx={{ bgcolor: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 1.5, px: 2, py: 1.5 }}>
              <Typography sx={{ fontSize: 13, color: "#92400e", lineHeight: 1.8 }}>{r.riskSummary}</Typography>
            </Box>
          </Box>

          {/* ── 면책 문구 ─────────────────────────────────────────────────────── */}
          <Box sx={{ bgcolor: "#f8fafc", borderRadius: 1, px: 2, py: 1.2, mt: 0.5 }}>
            <Typography sx={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.8 }}>
              본 리포트는 시뮬레이션 결과이며 실제 투자 성과와 다를 수 있습니다. 수수료 0.015% + 거래세 0.23% + 슬리피지 0.1% 차감 기준.
              한이음 "개미핥기" 프로젝트 · QuantAgent 자동 생성 리포트.
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* ── 발송 설정 안내 ───────────────────────────────────────────────────── */}
      <Paper elevation={0} sx={{ border: "1px dashed #94a3b8", borderRadius: 2, p: 3, maxWidth: 720, mx: "auto", width: "100%" }}>
        <Typography sx={{ fontWeight: 700, color: "#374151", fontSize: 14, mb: 1 }}>이메일 발송 설정</Typography>
        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
          {[
            ["발송 시각", "매일 08:00 (영업일)"],
            ["수신 주소", "sixeunseoth@gmail.com"],
            ["포함 신호", "매수·매도·관찰·보유"],
            ["비정형 데이터", "한경 뉴스 + Seibro 리포트"],
          ].map(([label, value]) => (
            <Box key={label as string}>
              <Typography sx={{ fontSize: 11, color: "#94a3b8" }}>{label}</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{value}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>

    </Box>
  );
}
