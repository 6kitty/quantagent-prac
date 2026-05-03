import { useState, useMemo } from "react";
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TableSortLabel, TablePagination,
} from "@mui/material";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import { tradeHistory, barChartData } from "../../data/mockData";

const fmt = (v: number) => v.toLocaleString("ko-KR");

type SortKey = "date" | "buyCount" | "sellCount" | "holdCount" | "periodReturn" | "cumReturn" | "asset" | "remaining";
type SortDir = "asc" | "desc";

const columns: { key: SortKey; label: string; align?: "right" | "left" }[] = [
  { key: "date",         label: "날짜",            align: "left"  },
  { key: "buyCount",     label: "매수 종목수",     align: "right" },
  { key: "sellCount",    label: "매도 종목수",     align: "right" },
  { key: "holdCount",    label: "남은 종목수",     align: "right" },
  { key: "periodReturn", label: "기간 수익률(%)",  align: "right" },
  { key: "cumReturn",    label: "누적 수익률(%)",  align: "right" },
  { key: "asset",        label: "총 자산(원)",     align: "right" },
  { key: "remaining",    label: "남은 현금(원)",   align: "right" },
];

function ReturnText({ value }: { value: number }) {
  return (
    <Typography
      component="span"
      sx={{
        color: value >= 0 ? "#1d4ed8" : "#dc2626",
        fontWeight: 600,
        fontSize: 12,
      }}
    >
      {value >= 0 ? "+" : ""}{value.toFixed(2)}%
    </Typography>
  );
}

export default function TradesTab() {
  const [sortBy, setSortBy] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const sorted = useMemo(() => {
    const rows = [...tradeHistory];
    rows.sort((a, b) => {
      const av = a[sortBy] as number | string;
      const bv = b[sortBy] as number | string;
      if (av === bv) return 0;
      const cmp = av < bv ? -1 : 1;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [sortBy, sortDir]);

  const paged = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("desc");
    }
  };

  return (
    <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>

      {/* ── 거래 차트 ─────────────────────────────────────────────────────── */}
      <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, p: 3 }}>
        <Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: 15, mb: 2 }}>거래 내역</Typography>

        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={barChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `${v}%`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              formatter={(value, name) => [
                `${Number(value).toFixed(2)}%`,
                name === "periodReturn" ? "기간 수익률" : "누적 수익률",
              ]}
            />
            <Legend
              formatter={(v) => (v === "periodReturn" ? "기간 수익률" : "누적 수익률")}
              wrapperStyle={{ fontSize: 12 }}
            />
            <ReferenceLine yAxisId="left" y={0} stroke="#94a3b8" />
            <Bar yAxisId="left" dataKey="periodReturn" name="periodReturn" radius={[3, 3, 0, 0]}>
              {barChartData.map((d, i) => (
                <Cell key={i} fill={d.periodReturn >= 0 ? "#3b82f6" : "#dc2626"} />
              ))}
            </Bar>
            <Line yAxisId="right" type="monotone" dataKey="cumReturn" name="cumReturn"
              stroke="#1d4ed8" strokeWidth={2} dot={{ r: 3, fill: "#1d4ed8" }} />
          </ComposedChart>
        </ResponsiveContainer>
      </Paper>

      {/* ── 거래 상세 테이블 ───────────────────────────────────────────── */}
      <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ p: 3, pb: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: 15 }}>거래 상세</Typography>
          <Typography sx={{ fontSize: 11, color: "#94a3b8" }}>총 {tradeHistory.length}건</Typography>
        </Box>

        <TableContainer sx={{ maxHeight: 520 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    align={col.align}
                    sx={{
                      bgcolor: "#f8fafc",
                      color: "#475569",
                      fontWeight: 600,
                      fontSize: 12,
                      borderBottom: "1px solid #e2e8f0",
                      whiteSpace: "nowrap",
                      py: 1.2,
                    }}
                  >
                    <TableSortLabel
                      active={sortBy === col.key}
                      direction={sortBy === col.key ? sortDir : "asc"}
                      onClick={() => handleSort(col.key)}
                      sx={{
                        "&.Mui-active": { color: "#1d4ed8" },
                        "& .MuiTableSortLabel-icon": { color: "#1d4ed8 !important" },
                      }}
                    >
                      {col.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map((row, i) => (
                <TableRow
                  key={`${row.date}-${i}`}
                  sx={{
                    "&:hover": { bgcolor: "#f8fafc" },
                    "& td": { borderBottom: "1px solid #f1f5f9" },
                  }}
                >
                  <TableCell sx={{ fontSize: 12, color: "#1d4ed8", fontWeight: 600 }}>{row.date}</TableCell>
                  <TableCell align="right" sx={{ fontSize: 12, color: "#374151" }}>{row.buyCount}</TableCell>
                  <TableCell align="right" sx={{ fontSize: 12, color: "#374151" }}>{row.sellCount}</TableCell>
                  <TableCell align="right" sx={{ fontSize: 12, color: "#374151" }}>{row.holdCount}</TableCell>
                  <TableCell align="right">
                    <ReturnText value={row.periodReturn} />
                  </TableCell>
                  <TableCell align="right">
                    <ReturnText value={row.cumReturn} />
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: 12, color: "#0f172a" }}>{fmt(row.asset)}</TableCell>
                  <TableCell align="right" sx={{ fontSize: 12, color: "#475569" }}>{fmt(row.remaining)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={tradeHistory.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage="행 수"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
          sx={{
            borderTop: "1px solid #e2e8f0",
            "& .MuiTablePagination-toolbar": { fontSize: 12, color: "#475569" },
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: 12 },
          }}
        />
      </Paper>
    </Box>
  );
}
