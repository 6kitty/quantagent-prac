import { Box, Tab, Tabs } from "@mui/material";
import { TabKey } from "../types";

const tabs: { key: TabKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "candidates", label: "매매종목 정보" },
  { key: "returns", label: "수익률" },
  { key: "risk", label: "리스크" },
  { key: "trades", label: "거래 내역" },
];

interface Props {
  activeSet: Set<TabKey>;
  onChange: (tab: TabKey) => void;
}

export default function TabNav({ activeSet, onChange }: Props) {
  return (
    <Box
      sx={{
        bgcolor: "#fff",
        borderBottom: "1px solid #e2e8f0",
        px: 2,
        position: "sticky",
        top: 0,
        zIndex: 5,
      }}
    >
      <Tabs value={-1} sx={{ minHeight: 44 }} slotProps={{ indicator: { sx: { display: "none" } } }}>
        {tabs.map((tab) => {
          const isActive = activeSet.has(tab.key);
          return (
            <Tab
              key={tab.key}
              label={tab.label}
              onClick={() => onChange(tab.key)}
              sx={{
                minHeight: 44,
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "#2563eb" : "#64748b",
                textTransform: "none",
                borderBottom: isActive ? "3px solid #2563eb" : "3px solid transparent",
                marginBottom: "-1px",
                transition: "color 0.15s, border-color 0.15s",
                "&:hover": { color: "#2563eb" },
              }}
            />
          );
        })}
      </Tabs>
    </Box>
  );
}
