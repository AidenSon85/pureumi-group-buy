"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Stack, CircularProgress, FormControl,
  InputLabel, Select, MenuItem, Avatar, TextField, InputAdornment, Button,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ko } from "date-fns/locale";
import { format, subDays } from "date-fns";
import InventoryIcon from "@mui/icons-material/Inventory";
import ImageIcon from "@mui/icons-material/Image";
import SearchIcon from "@mui/icons-material/Search";

interface ProductStat {
  productId: string; productName: string; imageUrl: string | null;
  factoryName: string; orderCount: number; totalQty: number; totalAmount: number;
}
interface Factory { id: string; name: string }
const formatWon = (n: number) => `₩${n.toLocaleString()}`;

const initForm = (factoryId = "") => ({
  factoryId,
  productName: "",
  startDate: subDays(new Date(), 30) as Date | null,
  endDate: new Date() as Date | null,
});

export default function ByProductOrdersPage() {
  const { data: session } = useSession();
  const isManager = (session?.user as any)?.role === "MANAGER";
  const myFactoryId = (session?.user as any)?.factoryId as string | undefined;

  const [data, setData] = useState<ProductStat[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initForm());
  const [applied, setApplied] = useState(initForm());

  const load = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams({
      factoryId: applied.factoryId,
      productName: applied.productName,
      startDate: applied.startDate ? format(applied.startDate, "yyyy-MM-dd") : "",
      endDate: applied.endDate ? format(applied.endDate, "yyyy-MM-dd") : "",
    });
    fetch(`/api/orders/by-product?${q}`).then((r) => r.json()).then((d) => {
      setData(d || []); setLoading(false);
    }).catch(() => setLoading(false));
  }, [applied]);

  useEffect(() => { fetch("/api/factories").then((r) => r.json()).then(setFactories); }, []);
  useEffect(() => {
    if (isManager && myFactoryId) {
      setForm((f) => ({ ...f, factoryId: myFactoryId }));
      setApplied((f) => ({ ...f, factoryId: myFactoryId }));
    }
  }, [isManager, myFactoryId]);
  useEffect(() => { load(); }, [load]);

  const handleSearch = () => setApplied({ ...form });
  const handleReset = () => {
    const reset = initForm(isManager && myFactoryId ? myFactoryId : "");
    setForm(reset); setApplied(reset);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 2 }}>
          <InventoryIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>제품별 주문 내역</Typography>
        </Stack>

        <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e0e0e0" }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", alignItems: "center" }}>
              {!isManager && (
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>매장</InputLabel>
                  <Select value={form.factoryId} label="매장" onChange={(e) => setForm((f) => ({ ...f, factoryId: e.target.value }))}>
                    <MenuItem value="">전체</MenuItem>
                    {factories.map((fac) => <MenuItem key={fac.id} value={fac.id}>{fac.name}</MenuItem>)}
                  </Select>
                </FormControl>
              )}
              <TextField
                size="small" label="제품명" placeholder="제품명 검색" value={form.productName}
                onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
                sx={{ width: 220 }}
              />
              <DatePicker label="시작일" value={form.startDate} onChange={(v) => setForm((f) => ({ ...f, startDate: v }))} slotProps={{ textField: { size: "small" } }} />
              <DatePicker label="종료일" value={form.endDate} onChange={(v) => setForm((f) => ({ ...f, endDate: v }))} slotProps={{ textField: { size: "small" } }} />
            </Stack>
            <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
              <Button variant="outlined" size="small" onClick={handleReset}>초기화</Button>
              <Button variant="contained" size="small" onClick={handleSearch} sx={{ minWidth: 80 }}>조회</Button>
            </Stack>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ border: "1px solid #e0e0e0" }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "#f5f5f5" } }}>
                  <TableCell width={48}>#</TableCell>
                  <TableCell>제품</TableCell>
                  <TableCell>매장</TableCell>
                  <TableCell align="right">주문 건수</TableCell>
                  <TableCell align="right">판매 수량</TableCell>
                  <TableCell align="right">총 매출</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
                ) : data.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>데이터가 없습니다</TableCell></TableRow>
                ) : data.map((d, i) => (
                  <TableRow key={d.productId} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center" }}>{i + 1}</Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" sx={{ alignItems: "center" }} spacing={1.5}>
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
