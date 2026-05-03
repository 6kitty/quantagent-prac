import { useState, useRef, useEffect, useCallback } from "react";
import { Box, Typography, TextField, IconButton, Chip, Avatar } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

type Msg = { role: "user" | "assistant"; content: string };

const examples = [
  "반도체 섹터에서 과매도 나오면 매수",
  "기관이 살 것 같은 종목만 보고 싶어",
  "남들이 저평가라고 보는 거 오래 보유",
  "이 전략의 핵심 차별점이 뭔가요?",
];

const initialMsgs: Msg[] = [
  {
    role: "assistant",
    content:
      "안녕하세요. KOSPI200 LLM 퀀트 에이전트입니다. 자연어로 전략을 입력하면 정형 팩터(모멘텀·퀄리티·밸류)와 비정형 신호(Seibro 리포트·한경 뉴스)를 결합해 검증해 드립니다.",
  },
];

const MIN_WIDTH = 240;
const MAX_WIDTH = 560;
const DEFAULT_WIDTH = 320;
const STORAGE_KEY = "quantagent.sidebar.width";

export default function ChatPrompt() {
  const [msgs, setMsgs] = useState<Msg[]>(initialMsgs);
  const [input, setInput] = useState("");
  const [width, setWidth] = useState<number>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!saved) return DEFAULT_WIDTH;
    const n = parseInt(saved, 10);
    return Number.isFinite(n) ? Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, n)) : DEFAULT_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  // 리사이즈 — mousedown 시 전역 리스너 등록
  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;
    const onMove = (e: MouseEvent) => {
      const w = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
      setWidth(w);
    };
    const onUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isResizing]);

  // 너비 변경 시 localStorage 저장
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(width));
  }, [width]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setMsgs((m) => [
      ...m,
      { role: "user", content: t },
      {
        role: "assistant",
        content:
          "전략 의도를 StrategySpec으로 변환 중입니다… (시연 화면) 우측 리포트의 매매종목·수익률 탭에서 결과를 확인하세요.",
      },
    ]);
    setInput("");
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        alignSelf: "flex-start",
        height: "100vh",
        width,
        flexShrink: 0,
        bgcolor: "#0f1b35",
        color: "#cbd5e1",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid #1e3a5f",
      }}
    >
      {/* 헤더 */}
      <Box sx={{ px: 2.5, py: 2.2, borderBottom: "1px solid #1e3a5f" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.3 }}>
          <AutoAwesomeIcon sx={{ fontSize: 16, color: "#60a5fa" }} />
          <Typography sx={{ color: "#fff", fontWeight: 800, letterSpacing: 0.5, fontSize: 14 }}>
            QuantAgent
          </Typography>
        </Box>
        <Typography sx={{ color: "#4a7ab5", fontSize: 11, lineHeight: 1.5 }}>
          말로 입력한 전략을 뉴스·애널리스트 리포트까지 합쳐 검증하는 LLM 퀀트 에이전트
        </Typography>
      </Box>

      {/* 대화 영역 */}
      <Box ref={scrollRef} sx={{ flex: 1, overflowY: "auto", px: 2, py: 2 }}>
        {msgs.map((m, i) => (
          <Box
            key={i}
            sx={{
              display: "flex",
              gap: 1,
              mb: 1.8,
              flexDirection: m.role === "user" ? "row-reverse" : "row",
            }}
          >
            <Avatar
              sx={{
                width: 24,
                height: 24,
                bgcolor: m.role === "user" ? "#1e4080" : "#1e3a5f",
                fontSize: 10,
                color: "#cbd5e1",
              }}
            >
              {m.role === "user" ? "U" : "Q"}
            </Avatar>
            <Box
              sx={{
                bgcolor: m.role === "user" ? "#1e4080" : "#16294a",
                color: m.role === "user" ? "#fff" : "#cbd5e1",
                borderRadius: 1.5,
                px: 1.4,
                py: 1,
                maxWidth: "82%",
                fontSize: 12,
                lineHeight: 1.7,
              }}
            >
              {m.content}
            </Box>
          </Box>
        ))}

        {/* 예시 프롬프트 칩 — 첫 응답 직후 표시 */}
        {msgs.length === 1 && (
          <Box sx={{ mt: 1.5 }}>
            <Typography sx={{ fontSize: 10, color: "#4a7ab5", mb: 0.8, pl: 0.5 }}>
              예시 전략
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.7 }}>
              {examples.map((ex) => (
                <Chip
                  key={ex}
                  label={ex}
                  size="small"
                  onClick={() => send(ex)}
                  sx={{
                    bgcolor: "#16294a",
                    color: "#9bb3d4",
                    fontSize: 11,
                    height: 26,
                    justifyContent: "flex-start",
                    "& .MuiChip-label": { px: 1.2, whiteSpace: "normal" },
                    "&:hover": { bgcolor: "#1e3a5f", color: "#fff" },
                    cursor: "pointer",
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {/* 입력창 */}
      <Box sx={{ p: 1.5, borderTop: "1px solid #1e3a5f" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-end",
            gap: 0.5,
            bgcolor: "#16294a",
            borderRadius: 1.5,
            px: 1,
            py: 0.5,
            border: "1px solid transparent",
            "&:focus-within": { borderColor: "#3b82f6" },
          }}
        >
          <TextField
            multiline
            maxRows={4}
            fullWidth
            variant="standard"
            placeholder="전략을 자연어로 입력하세요 (예: 외국인 순매수 강한 반도체)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            slotProps={{
              input: {
                disableUnderline: true,
                sx: {
                  fontSize: 12,
                  color: "#e2e8f0",
                  "&::placeholder": { color: "#64748b" },
                },
              },
            }}
          />
          <IconButton
            size="small"
            onClick={() => send(input)}
            disabled={!input.trim()}
            sx={{
              color: input.trim() ? "#60a5fa" : "#475569",
              "&:hover": { bgcolor: "#1e3a5f" },
            }}
          >
            <SendIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
        <Typography sx={{ fontSize: 9, color: "#475569", mt: 0.6, textAlign: "center" }}>
          시뮬레이션 결과 · 수수료 0.015% · 거래세 0.23% · 슬리피지 0.1% 반영
        </Typography>
      </Box>

      {/* 리사이즈 핸들 — 우측 가장자리 */}
      <Box
        onMouseDown={onResizeMouseDown}
        sx={{
          position: "absolute",
          top: 0,
          right: -3,
          width: 6,
          height: "100%",
          cursor: "col-resize",
          zIndex: 20,
          "&:hover": {
            bgcolor: "#3b82f6",
            opacity: 0.4,
          },
          ...(isResizing && {
            bgcolor: "#3b82f6",
            opacity: 0.6,
          }),
        }}
      />
    </Box>
  );
}
