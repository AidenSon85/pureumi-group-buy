"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Stack, CircularProgress, FormControl,
  InputLabel, Select, MenuItem, Avatar, TextField, InputAdornment,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ko } from "date-fns/locale";
import { format, subDays } from "date-fns";
import PeopleIcon from "@mui/icons-material/People";
import SearchIcon from "@mui/icons-material/Search";

interface UserStat {
  userId: string; userName: string; userEmail: string;
  factoryName: string; orderCount: number; totalAmount: number; lastOrderAt: string;
}
interface Factory { id: string; name: string }
const formatWon = (n: number) => `₩${n.toLocaleString()}`;
const formatDate = (s: string) => new Date(s).toLocaleDateString("ko-KR");

export default function ByUserOrdersPage() {
  const { data: session } = useSession();
  const isManager = (session?.user as any)?.role === "MANAGER";
  const myFactoryId = (session?.user as any)?.factoryId as string | undefined;

  const [data, setData] = useState<UserStat[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [factoryFilter, setFactoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams({
      factoryId: factoryFilter, search,
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : "",
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : "",
    });
    fetch(`/api/orders/by-user?${q}`).then((r) => r.json()).then((d) => {
      setData(d || []); setLoading(false);
    }).catch(() => setLoading(false));
  }, [factoryFilter, search, startDate, endDate]);

  useEffect(() => { fetch("/api/factories").then((r) => r.json()).then(setFactories); }, []);
  useEffect(() => { if (isManager && myFactoryId) setFactoryFilter(myFactoryId); }, [isManager, myFactoryId]);
  useEffect(() => { load(); }, [load]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
      <Box>
        <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 3 }}>
          <PeopleIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>사용자별 주문 내역</Typography>
        </Stack>

        <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #e0e0e0" }}>
          <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
            <TextField
              size="small" placeholder="이름, 이메일 검색" value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }
              }}
              sx={{ width: 240 }}
            />
            {!isManager && (
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>매장</InputLabel>
                <Select value={factoryFilter} label="매장" onChange={(e) => setFactoryFilter(e.target.value)}>
                  <MenuItem value="">전체</MenuItem>
                  {factories.map((f) => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
                </Select>
              </FormControl>
            )}
            <DatePicker label="시작일" value={startDate} onChange={setStartDate} slotProps={{ textField: { size: "small" } }} />
            <DatePicker label="종료일" value={endDate} onChange={setEndDate} slotProps={{ textField: { size: "small" } }} />
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ border: "1px solid #e0e0e0" }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "#f5f5f5" } }}>
                  <TableCell>고객</TableCell>
                  <TableCell>소속 매장</TableCell>
                  <TableCell align="right">주문 건수</TableCell>
                  <TableCell align="right">총 구매액</TableCell>
                  <TableCell>최근 주문일</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
                ) : data.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6, color: "text.secondary" }}>데이터가 없습니다</TableCell></TableRow>
                ) : data.map((d) => (
                  <TableRow key={d.userId} hover>
                    <TableCell>
                      <Stack direction="row" sx={{ alignItems: "center" }} spacing={1.5}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: "#1976d220", color: "#1976d2" }}>{d.userName[0]}</Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{d.userName}</Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>{d.userEmail}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>{d.factoryName}</TableCell>
                    <TableCell align="right">{d.orderCount}건</TableCell>
                    <TableCell align="right"><Typography sx={{ fontWeight: 700, color: "primary.main" }}>{formatWon(d.totalAmount)}</Typography></TableCell>
                    <TableCell>{formatDate(d.lastOrderAt)}</TableCell>
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
