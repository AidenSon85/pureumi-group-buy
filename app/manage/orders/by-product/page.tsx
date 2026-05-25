"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Stack, CircularProgress, FormControl,
  InputLabel, Select, MenuItem, Avatar,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ko } from "date-fns/locale";
import { format, subDays } from "date-fns";
import InventoryIcon from "@mui/icons-material/Inventory";
import ImageIcon from "@mui/icons-material/Image";

interface ProductStat {
  productId: string; productName: string; imageUrl: string | null;
  factoryName: string; orderCount: number; totalQty: number; totalAmount: number;
}
interface Factory { id: string; name: string }
const formatWon = (n: number) => `₩${n.toLocaleString()}`;

export default function ByProductOrdersPage() {
  const [data, setData] = useState<ProductStat[]>([]);
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
    fetch(`/api/orders/by-product?${q}`).then((r) => r.json()).then((d) => {
      setData(d || []); setLoading(false);
    }).catch(() => setLoading(false));
  }, [factoryFilter, startDate, endDate]);

  useEffect(() => { fetch("/api/factories").then((r) => r.json()).then(setFactories); }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
      <Box>
        <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 3 }}>
          <InventoryIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>제품별 주문 내역</Typography>
        </Stack>

        <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #e0e0e0" }}>
          <Stack direction="row" spacing={2}>
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

        <Paper elevation={0} sx={{ border: "1px solid #e0e0e0" }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "#f5f5f5" } }}>
                  <TableCell>제품</TableCell>
                  <TableCell>매장</TableCell>
                  <TableCell align="right">주문 건수</TableCell>
                  <TableCell align="right">판매 수량</TableCell>
                  <TableCell align="right">총 매출</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
                ) : data.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6, color: "text.secondary" }}>데이터가 없습니다</TableCell></TableRow>
                ) : data.map((d, i) => (
                  <TableRow key={d.productId} hover>
                    <TableCell>
                      <Stack direction="row" sx={{ alignItems: "center" }} spacing={1.5}>
                        <Typography variant="body2" sx={{ color: "text.secondary", minWidth: 24, textAlign: "center" }}>{i + 1}</Typography>
                        <Avatar src={d.imageUrl || undefined} variant="rounded" sx={{ width: 36, height: 36, bgcolor: "#f5f5f5" }}>
                          <ImageIcon color="disabled" fontSize="small" />
                        </Avatar>
                        <Typography sx={{ fontWeight: 600 }}>{d.productName}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{d.factoryName}</TableCell>
                    <TableCell align="right">{d.orderCount}건</TableCell>
                    <TableCell align="right">{d.totalQty}개</TableCell>
                    <TableCell align="right"><Typography sx={{ fontWeight: 700, color: "primary.main" }}>{formatWon(d.totalAmount)}</Typography></TableCell>
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
