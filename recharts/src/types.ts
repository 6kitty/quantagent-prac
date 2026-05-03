export interface OHLCVData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type TabKey = "all" | "candidates" | "returns" | "risk" | "trades";
