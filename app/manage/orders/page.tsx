"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Stack, CircularProgress, FormControl,
  InputLabel, Select, MenuItem, TextField, InputAdornment, TablePagination,
  IconButton, Collapse, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, FormGroup, FormControlLabel, Checkbox, Divider,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ko } from "date-fns/locale";
import { format, subDays } from "date-fns";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

interface OrderItem { id: string; quantity: number; price: number; amount: number; product: { name: string } }
interface Order {
  id: string; orderNo: string; status: string; totalAmount: number;
  orderedAt: string; memo: string | null; deliveryAddr: string | null;
  user: { name: string; email: string; phone: string | null };
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
const ALL_STATUSES = Object.keys(STATUS_MAP);
const formatWon = (n: number) => `₩${n.toLocaleString()}`;
const formatDate = (s: string) => new Date(s).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

const initForm = () => ({
  search: "",
  customerName: "",
  productName: "",
  factoryId: "",
  statuses: [] as string[],
  startDate: null as Date | null,
  endDate: null as Date | null,
});

export default function OrdersPage() {
  const { data: session } = useSession();
  const isManager = (session?.user as any)?.role === "MANAGER";
  const myFactoryId = (session?.user as any)?.factoryId as string | undefined;

  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [form, setForm] = useState(initForm());
  const [applied, setApplied] = useState(initForm());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusDialog, setStatusDialog] = useState<{ id: string; current: string } | null>(null);
  const [newStatus, setNewStatus] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams({
      page: String(page), limit: "20",
      search: applied.search,
      customerName: applied.customerName,
      productName: applied.productName,
      factoryId: applied.factoryId,
      statuses: applied.statuses.join(","),
      startDate: applied.startDate ? format(applied.startDate, "yyyy-MM-dd") : "",
      endDate: applied.endDate ? format(applied.endDate, "yyyy-MM-dd") : "",
    });
    fetch(`/api/orders?${q}`).then((r) => r.json()).then((d) => {
      setOrders(d.orders || []); setTotal(d.total || 0); setLoading(false);
    }).catch(() => setLoading(false));
  }, [page, applied]);

  useEffect(() => { fetch("/api/factories").then((r) => r.json()).then(setFactories); }, []);
  useEffect(() => {
    if (isManager && myFactoryId) {
      setForm((f) => ({ ...f, factoryId: myFactoryId }));
      setApplied((f) => ({ ...f, factoryId: myFactoryId }));
    }
  }, [isManager, myFactoryId]);
  useEffect(() => { load(); }, [load]);

  const handleSearch = () => { setPage(0); setApplied({ ...form }); };
  const handleReset = () => {
    const reset = { ...initForm(), factoryId: isManager && myFactoryId ? myFactoryId : "" };
    setForm(reset); setApplied(reset); setPage(0);
  };

  const handleStatusChange = async () => {
    if (!statusDialog) return;
    await fetch(`/api/orders/${statusDialog.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
    setStatusDialog(null); load();
  };

  const toggleStatus = (s: string) => {
    setForm((f) => ({
      ...f,
      statuses: f.statuses.includes(s) ? f.statuses.filter((x) => x !== s) : [...f.statuses, s],
    }));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
      <Box>
        <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 2 }}>
          <ShoppingCartIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>주문(ORDER) 관리 - 최근 주문</Typography>
        </Stack>

        {/* 조회 조건 패널 */}
        <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #e0e0e0" }}>
          <Stack spacing={2}>
            {/* 1행: 매장, 날짜 */}
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
              <DatePicker label="시작일" value={form.startDate} onChange={(v) => setForm((f) => ({ ...f, startDate: v }))} slotProps={{ textField: { size: "small" } }} />
              <DatePicker label="종료일" value={form.endDate} onChange={(v) => setForm((f) => ({ ...f, endDate: v }))} slotProps={{ textField: { size: "small" } }} />
            </Stack>

            {/* 2행: 제품명, 고객명 */}
            <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", alignItems: "center" }}>
              <TextField
                size="small" label="제품명" placeholder="제품명 검색" value={form.productName}
                onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
                sx={{ width: 220 }}
              />
              <TextField
                size="small" label="고객명/이메일" placeholder="고객명 또는 이메일" value={form.customerName}
                onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                sx={{ width: 220 }}
              />
              <TextField
                size="small" label="주문번호" placeholder="주문번호 검색" value={form.search}
                onChange={(e) => setForm((f) => ({ ...f, search: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                sx={{ width: 180 }}
              />
            </Stack>

            {/* 3행: 상태 체크박스 + 버튼 */}
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary", mr: 1 }}>상태</Typography>
                <FormGroup row>
                  {ALL_STATUSES.map((s) => (
                    <FormControlLabel
                      key={s}
                      control={
                        <Checkbox size="small" checked={form.statuses.includes(s)} onChange={() => toggleStatus(s)} />
                      }
                      label={<Typography variant="body2">{STATUS_MAP[s].label}</Typography>}
                      sx={{ mr: 1 }}
                    />
                  ))}
                </FormGroup>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" size="small" onClick={handleReset}>초기화</Button>
                <Button variant="contained" size="small" onClick={handleSearch} sx={{ minWidth: 80 }}>조회</Button>
              </Stack>
            </Stack>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ border: "1px solid #e0e0e0" }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "#f5f5f5" } }}>
                  <TableCell width={48} />
                  <TableCell>주문번호 / 제품</TableCell>
                  <TableCell>고객</TableCell>
                  <TableCell>매장</TableCell>
                  <TableCell align="right">금액</TableCell>
                  <TableCell>주문일시</TableCell>
                  <TableCell align="center">상태</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
                ) : orders.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>주문이 없습니다</TableCell></TableRow>
                ) : orders.map((o) => (
                  <>
                    <TableRow key={o.id} hover sx={{ cursor: "pointer" }} onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}>
                      <TableCell>
                        <IconButton size="small">{expandedId === o.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: "monospace" }}>{o.orderNo}</Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          {o.items.slice(0, 2).map((i) => i.product.name).join(", ")}
                          {o.items.length > 2 ? ` 외 ${o.items.length - 2}종` : ""}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{o.user.name}</Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>{o.user.email}</Typography>
                      </TableCell>
                      <TableCell>{o.factory.name}</TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontWeight: 700, color: "primary.main" }}>{formatWon(o.totalAmount)}</Typography>
                      </TableCell>
                      <TableCell><Typography variant="body2">{formatDate(o.orderedAt)}</Typography></TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Chip
                          label={STATUS_MAP[o.status]?.label}
                          size="small"
                          color={STATUS_MAP[o.status]?.color}
                          onClick={() => { setStatusDialog({ id: o.id, current: o.status }); setNewStatus(o.status); }}
                          sx={{ cursor: "pointer" }}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow key={`${o.id}-detail`}>
                      <TableCell colSpan={7} sx={{ py: 0, border: 0 }}>
                        <Collapse in={expandedId === o.id}>
                          <Box sx={{ py: 2, px: 4, bgcolor: "#fafafa", borderBottom: "1px solid #e0e0e0" }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>주문 상품 상세</Typography>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 700, bgcolor: "#f0f4ff" }}>제품명</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "#f0f4ff" }}>수량</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "#f0f4ff" }}>단가</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "#f0f4ff" }}>금액</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {o.items.map((item) => (
                                  <TableRow key={item.id}>
                                    <TableCell>{item.product.name}</TableCell>
                                    <TableCell align="right">{item.quantity}개</TableCell>
                                    <TableCell align="right">{formatWon(item.price)}</TableCell>
                                    <TableCell align="right"><strong>{formatWon(item.amount)}</strong></TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            {(o.deliveryAddr || o.memo) && (
                              <Box sx={{ mt: 1.5 }}>
                                {o.deliveryAddr && <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>배송지: {o.deliveryAddr}</Typography>}
                                {o.memo && <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>메모: {o.memo}</Typography>}
                              </Box>
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
          <TablePagination
            component="div" count={total} page={page} rowsPerPage={20}
            onPageChange={(_, p) => setPage(p)} rowsPerPageOptions={[20]}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 전체 ${count}건`}
          />
        </Paper>

        <Dialog open={!!statusDialog} onClose={() => setStatusDialog(null)}>
          <DialogTitle>주문 상태 변경</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>상태</InputLabel>
              <Select value={newStatus} label="상태" onChange={(e) => setNewStatus(e.target.value)}>
                {ALL_STATUSES.map((s) => <MenuItem key={s} value={s}>{STATUS_MAP[s].label}</MenuItem>)}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStatusDialog(null)}>취소</Button>
            <Button variant="contained" onClick={handleStatusChange}>변경</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}
