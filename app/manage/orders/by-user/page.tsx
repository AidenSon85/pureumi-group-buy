"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Stack, CircularProgress, FormControl,
  InputLabel, Select, MenuItem, Avatar, TextField, InputAdornment,
  Button, Collapse, Chip, IconButton,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ko } from "date-fns/locale";
import { format, subDays } from "date-fns";
import PeopleIcon from "@mui/icons-material/People";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

interface UserStat {
  userId: string; userName: string; userEmail: string;
  factoryName: string; orderCount: number; totalAmount: number; lastOrderAt: string;
}
interface OrderItem { id: string; quantity: number; price: number; amount: number; product: { name: string } }
interface Order {
  id: string; orderNo: string; status: string; totalAmount: number; orderedAt: string;
  factory: { name: string }; items: OrderItem[];
}
interface Factory { id: string; name: string }

const STATUS_MAP: Record<string, { label: string; color: "default" | "info" | "warning" | "success" | "error" }> = {
  PENDING: { label: "대기", color: "default" },
  CONFIRMED: { label: "확인", color: "info" },
  SHIPPED: { label: "배송중", color: "warning" },
  DELIVERED: { label: "완료", color: "success" },
  CANCELLED: { label: "취소", color: "error" },
};

const formatWon = (n: number) => `₩${n.toLocaleString()}`;
const formatDate = (s: string) => new Date(s).toLocaleDateString("ko-KR");
const formatDateTime = (s: string) => new Date(s).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

const initForm = (factoryId = "") => ({
  factoryId,
  search: "",
  productName: "",
  startDate: subDays(new Date(), 30) as Date | null,
  endDate: new Date() as Date | null,
});

export default function ByUserOrdersPage() {
  const { data: session } = useSession();
  const isManager = (session?.user as any)?.role === "MANAGER";
  const myFactoryId = (session?.user as any)?.factoryId as string | undefined;

  const [data, setData] = useState<UserStat[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initForm());
  const [applied, setApplied] = useState(initForm());

  // 고객 클릭 → 주문 상세
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [userOrders, setUserOrders] = useState<Record<string, Order[]>>({});
  const [loadingOrders, setLoadingOrders] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams({
      factoryId: applied.factoryId,
      search: applied.search,
      productName: applied.productName,
      startDate: applied.startDate ? format(applied.startDate, "yyyy-MM-dd") : "",
      endDate: applied.endDate ? format(applied.endDate, "yyyy-MM-dd") : "",
    });
    fetch(`/api/orders/by-user?${q}`).then((r) => r.json()).then((d) => {
      setData(d || []); setLoading(false);
      setExpandedUserId(null); setUserOrders({});
    }).catch(() => setLoading(false));
  }, [applied]);

  const loadUserOrders = useCallback(async (userId: string) => {
    if (userOrders[userId]) return;
    setLoadingOrders(userId);
    const q = new URLSearchParams({
      userId,
      factoryId: applied.factoryId,
      productName: applied.productName,
      startDate: applied.startDate ? format(applied.startDate, "yyyy-MM-dd") : "",
      endDate: applied.endDate ? format(applied.endDate, "yyyy-MM-dd") : "",
      limit: "100",
    });
    try {
      const res = await fetch(`/api/orders?${q}`);
      const d = await res.json();
      setUserOrders((prev) => ({ ...prev, [userId]: d.orders || [] }));
    } finally {
      setLoadingOrders(null);
    }
  }, [applied, userOrders]);

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

  const handleRowClick = (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
    } else {
      setExpandedUserId(userId);
      loadUserOrders(userId);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 2 }}>
          <PeopleIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>사용자별 주문 내역</Typography>
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
                size="small" label="고객명/이메일" placeholder="이름 또는 이메일" value={form.search}
                onChange={(e) => setForm((f) => ({ ...f, search: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
                sx={{ width: 220 }}
              />
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
                  <TableCell width={48} />
                  <TableCell>고객</TableCell>
                  <TableCell>소속 매장</TableCell>
                  <TableCell align="right">주문 건수</TableCell>
                  <TableCell align="right">총 구매액</TableCell>
                  <TableCell>최근 주문일</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
                ) : data.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>데이터가 없습니다</TableCell></TableRow>
                ) : data.map((d) => (
                  <>
                    <TableRow
                      key={d.userId} hover
                      sx={{ cursor: "pointer", bgcolor: expandedUserId === d.userId ? "#f0f4ff" : undefined }}
                      onClick={() => handleRowClick(d.userId)}
                    >
                      <TableCell>
                        <IconButton size="small">
                          {expandedUserId === d.userId ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
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

                    {/* 펼쳐지는 주문 상세 */}
                    <TableRow key={`${d.userId}-detail`}>
                      <TableCell colSpan={6} sx={{ py: 0, border: 0 }}>
                        <Collapse in={expandedUserId === d.userId}>
                          <Box sx={{ py: 2, px: 4, bgcolor: "#f7f9ff", borderBottom: "1px solid #e0e0e0" }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                              {d.userName}님의 주문 목록
                              {applied.productName && <Typography component="span" variant="caption" sx={{ color: "text.secondary", ml: 1 }}>({applied.productName} 포함)</Typography>}
                            </Typography>

                            {loadingOrders === d.userId ? (
                              <Box sx={{ py: 2, textAlign: "center" }}><CircularProgress size={24} /></Box>
                            ) : (userOrders[d.userId] || []).length === 0 ? (
                              <Typography variant="body2" sx={{ color: "text.secondary", py: 1 }}>주문 내역이 없습니다</Typography>
                            ) : (
                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "#e8eeff" } }}>
                                    <TableCell>주문번호</TableCell>
                                    <TableCell>주문일시</TableCell>
                                    <TableCell>제품 구성</TableCell>
                                    <TableCell align="right">금액</TableCell>
                                    <TableCell align="center">상태</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {(userOrders[d.userId] || []).map((order) => (
                                    <TableRow key={order.id} hover>
                                      <TableCell>
                                        <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 600 }}>{order.orderNo}</Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="body2">{formatDateTime(order.orderedAt)}</Typography>
                                      </TableCell>
                                      <TableCell>
                                        {order.items.map((item) => (
                                          <Box key={item.id} sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                            <Typography variant="caption">{item.product.name}</Typography>
                                            <Typography variant="caption" sx={{ color: "text.secondary" }}>×{item.quantity}</Typography>
                                            <Typography variant="caption" sx={{ color: "primary.main" }}>{formatWon(item.amount)}</Typography>
                                          </Box>
                                        ))}
                                      </TableCell>
                                      <TableCell align="right">
                                        <Typography sx={{ fontWeight: 700, color: "primary.main" }}>{formatWon(order.totalAmount)}</Typography>
                                      </TableCell>
                                      <TableCell align="center">
                                        <Chip label={STATUS_MAP[order.status]?.label} size="small" color={STATUS_MAP[order.status]?.color} />
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
}
