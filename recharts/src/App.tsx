import { useState } from "react";
import { Box, CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import ChatPrompt from "./components/ChatPrompt";
import Header from "./components/Header";
import StrategyOverview from "./components/StrategyOverview";
import StatsBar from "./components/StatsBar";
import TabNav from "./components/TabNav";
import AllInOne from "./components/AllInOne";
import ReturnsTab from "./components/tabs/ReturnsTab";
import TradesTab from "./components/tabs/TradesTab";
import CandidatesTab from "./components/tabs/CandidatesTab";
import RiskTab from "./components/tabs/RiskTab";
import { TabKey } from "./types";

const theme = createTheme({
  palette: {
    primary: { main: "#2563eb" },
    background: { default: "#f1f5f9" },
  },
  typography: {
    fontFamily: "'Pretendard', 'Noto Sans KR', -apple-system, sans-serif",
  },
  components: {
    MuiPaper: { defaultProps: { elevation: 0 } },
  },
});

type SectionKey = Exclude<TabKey, "all">;

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [autoSection, setAutoSection] = useState<SectionKey>("candidates");

  const isAllMode = activeTab === "all";

  const activeSet = new Set<TabKey>();
  if (isAllMode) {
    activeSet.add("all");
    activeSet.add(autoSection);
  } else {
    activeSet.add(activeTab);
  }

  const handleTabChange = (tab: TabKey) => {
    if (tab === "all") {
      setActiveTab("all");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (isAllMode) {
      const el = document.getElementById(`section-${tab}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setActiveTab(tab);
  };

  const renderContent = () => {
    if (isAllMode) return <AllInOne onSectionInView={setAutoSection} />;

    switch (activeTab) {
      case "candidates":
        return <CandidatesTab />;
      case "returns":
        return <ReturnsTab />;
      case "risk":
        return <RiskTab />;
      case "trades":
        return <TradesTab />;
      default:
        return null;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex", alignItems: "flex-start", minHeight: "100vh", bgcolor: "#f1f5f9" }}>
        <ChatPrompt />
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <Header />
          <StrategyOverview />
          <StatsBar />
          <TabNav activeSet={activeSet} onChange={handleTabChange} />
          <Box sx={{ flex: 1 }}>{renderContent()}</Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
