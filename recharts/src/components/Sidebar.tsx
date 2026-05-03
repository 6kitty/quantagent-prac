import { useState } from "react";
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Typography, Divider, Collapse } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SearchIcon from "@mui/icons-material/Search";
import BarChartIcon from "@mui/icons-material/BarChart";
import StorefrontIcon from "@mui/icons-material/Storefront";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SchoolIcon from "@mui/icons-material/School";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import EmailIcon from "@mui/icons-material/Email";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";

const sxItem = {
  py: 0.8, px: 2, mx: 1, borderRadius: 1,
  "&:hover": { bgcolor: "#1a3660" },
  "& .MuiListItemIcon-root": { minWidth: 30, color: "#6b8ab0" },
  "& .MuiListItemText-primary": { fontSize: 13, color: "#9bb3d4" },
};

const sxActive = {
  ...sxItem,
  bgcolor: "#1e4080",
  "& .MuiListItemIcon-root": { minWidth: 30, color: "#60a5fa" },
  "& .MuiListItemText-primary": { fontSize: 13, color: "#fff", fontWeight: 600 },
};

const sxSub = {
  ...sxItem,
  pl: 4,
  "& .MuiListItemText-primary": { fontSize: 12, color: "#9bb3d4" },
};

export default function Sidebar() {
  const [techOpen, setTechOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);

  return (
    <Box sx={{ width: 210, minHeight: "100vh", bgcolor: "#0f1b35", color: "#9bb3d4", display: "flex", flexDirection: "column", borderRight: "1px solid #1e3a5f", flexShrink: 0 }}>
      <Box sx={{ px: 3, py: 2.5, borderBottom: "1px solid #1e3a5f" }}>
        <Typography variant="h6" sx={{ color: "#fff", fontWeight: 800, letterSpacing: 1, fontSize: 15 }}>
          QuantAgent
        </Typography>
        <Typography variant="caption" sx={{ color: "#4a7ab5", fontSize: 10 }}>
          KOSPI200 LLM 퀀트 전략 · 개미핥기
        </Typography>
      </Box>

      <List dense sx={{ flex: 1, py: 1 }}>
        <ListItemButton sx={sxItem}>
          <ListItemIcon><TrendingUpIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="포트폴리오 홈" />
        </ListItemButton>

        {/* 종목 탐색 + 하위 카테고리 */}
        <ListItemButton sx={sxItem} onClick={() => setTechOpen(!techOpen)}>
          <ListItemIcon><SearchIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="종목 탐색" />
          {techOpen ? <ExpandLessIcon sx={{ fontSize: 16, color: "#6b8ab0" }} /> : <ExpandMoreIcon sx={{ fontSize: 16, color: "#6b8ab0" }} />}
        </ListItemButton>
        <Collapse in={techOpen} timeout="auto">
          <List dense disablePadding>
            {["Momentum", "Trend", "Volatility", "Volume", "Pattern"].map((label) => (
              <ListItemButton key={label} sx={sxSub}>
                <ListItemText primary={label} />
              </ListItemButton>
            ))}
          </List>
        </Collapse>

        <ListItemButton sx={sxItem}>
          <ListItemIcon><DashboardIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="대시보드" />
        </ListItemButton>
        <ListItemButton sx={sxItem}>
          <ListItemIcon><BarChartIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="포트 생성" />
        </ListItemButton>

        {/* 시장 카테고리 */}
        <ListItemButton sx={sxItem} onClick={() => setMarketOpen(!marketOpen)}>
          <ListItemIcon><StorefrontIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="포트 마켓" />
          {marketOpen ? <ExpandLessIcon sx={{ fontSize: 16, color: "#6b8ab0" }} /> : <ExpandMoreIcon sx={{ fontSize: 16, color: "#6b8ab0" }} />}
        </ListItemButton>
        <Collapse in={marketOpen} timeout="auto">
          <List dense disablePadding>
            {[
              ["KOSPI", "🌙"],
              ["KOSDAQ", "🌙"],
              ["코인", "🌙"],
              ["원자재", "☀"],
              ["나스닥", "☀"],
            ].map(([label, badge]) => (
              <ListItemButton key={label} sx={sxSub}>
                <ListItemText primary={`${label} ${badge}`} />
              </ListItemButton>
            ))}
          </List>
        </Collapse>

        <ListItemButton sx={sxActive}>
          <ListItemIcon><AssessmentIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="백테스트" />
        </ListItemButton>

        <ListItemButton sx={sxItem}>
          <ListItemIcon><CompareArrowsIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="A/B 비교" />
        </ListItemButton>

        <ListItemButton sx={sxItem}>
          <ListItemIcon><EmailIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="이메일 리포트" />
        </ListItemButton>

        <ListItemButton sx={sxItem}>
          <ListItemIcon><ManageAccountsIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="포트 관리하기" />
        </ListItemButton>

        <Divider sx={{ borderColor: "#1e3a5f", my: 1 }} />

        <ListItemButton sx={sxItem}>
          <ListItemIcon><SchoolIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="아카데미" />
        </ListItemButton>
        <ListItemButton sx={sxItem}>
          <ListItemIcon><SupportAgentIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="고객지원" />
        </ListItemButton>
        <ListItemButton sx={sxItem}>
          <ListItemIcon><SmartToyIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="포트 AI" />
        </ListItemButton>
      </List>

      <Box sx={{ px: 2, py: 2, borderTop: "1px solid #1e3a5f" }}>
        <Box sx={{ bgcolor: "#1e3a5f", borderRadius: 2, p: 1.5, textAlign: "center" }}>
          <Typography variant="caption" sx={{ color: "#60a5fa", fontWeight: 600, display: "block" }}>실전매매 연동</Typography>
          <Typography variant="caption" sx={{ color: "#6b8ab0", fontSize: 10 }}>종목 선정 · LLM 신호 연동</Typography>
        </Box>
      </Box>
    </Box>
  );
}
