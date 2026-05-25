"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Stack, CircularProgress, FormControl,
  InputLabel, Select, MenuItem,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ko } from "date-fns/locale";
import { format, subDays } from "date-fns";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

interface DailyOrder { date: string; orderCount: number; totalAmount: number; userCount: number }
interface Factory { id: string; name: string }
const formatWon = (n: number) => `₩${n.toLocaleString()}`;

export default function DailyOrdersPage() {
  const [data, setData] = useState<DailyOrder[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [factoryFilter, setFactoryFilter] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams({
      factoryId: factoryFilter,
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : "",
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : "",
    });
    fetch(`/api/orders/daily?${q}`).then((r) => r.json()).then((d) => {
      setData(d || []); setLoading(false);
    }).catch(() => setLoading(false));
  }, [factoryFilter, startDate, endDate]);

  useEffect(() => { fetch("/api/factories").then((r) => r.json()).then(setFactories); }, []);
  useEffect(() => { load(); }, [load]);

  const totals = data.reduce((a, d) => ({ orders: a.orders + d.orderCount, amount: a.amount + d.totalAmount }), { orders: 0, amount: 0 });

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
      <Box>
        <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 3 }}>
          <ShoppingCartIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>일자별 주문 내역</Typography>
        </Stack>

        <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #e0e0e0" }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>매장</InputLabel>
              <Select value={factoryFilter} label="매장" onChange={(e) => setFactoryFilter(e.target.value)}>
                <MenuItem value="">전체</MenuItem>
                {factories.map((f) => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
              </Select>
            </FormControl>
            <DatePicker label="시작일" value={startDate} onChange={setStartDate} slotProps={{ textField: { size: "small" } }} />
            <DatePicker label="종료일" value={endDate} onChange={setEndDate} slotProps={{ textField: { size: "small" } }} />
          </Stack>
        </Paper>

        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Paper elevation={0} sx={{ p: 2, flex: 1, border: "1px solid #e0e0e0", textAlign: "center" }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>기간 총 주문</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{totals.orders}건</Typography>
          </Paper>
          <Paper elevation={0} sx={{ p: 2, flex: 1, border: "1px solid #e0e0e0", textAlign: "center" }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>기간 총 매출</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "primary.main" }}>{formatWon(totals.amount)}</Typography>
          </Paper>
        </Stack>

        <Paper elevation={0} sx={{ border: "1px solid #e0e0e0" }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "#f5f5f5" } }}>
                  <TableCell>날짜</TableCell>
                  <TableCell align="right">주문 건수</TableCell>
                  <TableCell align="right">주문 고객 수</TableCell>
                  <TableCell align="right">매출 금액</TableCell>
                  <TableCell align="right">건당 평균</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
                ) : data.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6, color: "text.secondary" }}>데이터가 없습니다</TableCell></TableRow>
                ) : data.map((d) => (
                  <TableRow key={d.date} hover>
                    <TableCell><Typography sx={{ fontWeight: 500 }}>{d.date}</Typography></TableCell>
                    <TableCell align="right">{d.orderCount}건</TableCell>
                    <TableCell align="right">{d.userCount}명</TableCell>
                    <TableCell align="right"><Typography sx={{ fontWeight: 700, color: "primary.main" }}>{formatWon(d.totalAmount)}</Typography></TableCell>
                    <TableCell align="right">{d.orderCount > 0 ? formatWon(Math.round(d.totalAmount / d.orderCount)) : "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
}
