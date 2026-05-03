import { useEffect } from "react";
import { Box, Divider, Typography } from "@mui/material";
import CandidatesTab from "./tabs/CandidatesTab";
import ReturnsTab from "./tabs/ReturnsTab";
import RiskTab from "./tabs/RiskTab";
import TradesTab from "./tabs/TradesTab";
import { TabKey } from "../types";

type SectionKey = Exclude<TabKey, "all">;

const sections: { key: SectionKey; label: string; Comp: React.ComponentType }[] = [
  { key: "candidates", label: "매매종목 정보", Comp: CandidatesTab },
  { key: "returns", label: "수익률", Comp: ReturnsTab },
  { key: "risk", label: "리스크", Comp: RiskTab },
  { key: "trades", label: "거래 내역", Comp: TradesTab },
];

interface Props {
  onSectionInView: (section: SectionKey) => void;
}

export default function AllInOne({ onSectionInView }: Props) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          const key = visible[0].target.getAttribute("data-section");
          if (key) onSectionInView(key as SectionKey);
        }
      },
      { rootMargin: "-80px 0px -55% 0px", threshold: [0, 0.1, 0.5, 1] }
    );

    sections.forEach((section) => {
      const el = document.getElementById(`section-${section.key}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [onSectionInView]);

  return (
    <Box>
      {sections.map(({ key, label, Comp }, index) => (
        <Box key={key} id={`section-${key}`} data-section={key} sx={{ scrollMarginTop: 60 }}>
          {index > 0 && <Divider sx={{ borderColor: "#e2e8f0" }} />}
          <Box sx={{ px: 4, pt: 3, pb: 0 }}>
            <Typography
              sx={{
                fontSize: 11,
                color: "#94a3b8",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 1.2,
              }}
            >
              {label}
            </Typography>
          </Box>
          <Comp />
        </Box>
      ))}
    </Box>
  );
}
