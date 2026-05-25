"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Stack, CircularProgress, FormControl,
  InputLabel, Select, MenuItem, TextField, InputAdornment, TablePagination,
  IconButton, Collapse, Dialog, DialogTitle, DialogContent, DialogActions,
  Button,
} from "@mui/material";
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [factoryFilter, setFactoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusDialog, setStatusDialog] = useState<{ id: string; current: string } | null>(null);
  const [newStatus, setNewStatus] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(page), limit: "20", search, factoryId: factoryFilter, status: statusFilter });
    fetch(`/api/orders?${q}`).then((r) => r.json()).then((d) => {
      setOrders(d.orders || []); setTotal(d.total || 0); setLoading(false);
    }).catch(() => setLoading(false));
  }, [page, search, factoryFilter, statusFilter]);

  useEffect(() => { fetch("/api/factories").then((r) => r.json()).then(setFactories); }, []);
  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async () => {
    if (!statusDialog) return;
    await fetch(`/api/orders/${statusDialog.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
    setStatusDialog(null); load();
  };

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 3 }}>
        <ShoppingCartIcon color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>주문(ORDER) 관리 - 최근 주문</Typography>
      </Stack>

      <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #e0e0e0" }}>
        <Stack direction="row" spacing={2}>
          <TextField
            size="small" placeholder="주문번호, 고객명 검색" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            slotProps={{
              input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }
            }}
            sx={{ width: 280 }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>매장</InputLabel>
            <Select value={factoryFilter} label="매장" onChange={(e) => { setFactoryFilter(e.target.value); setPage(0); }}>
              <MenuItem value="">전체</MenuItem>
              {factories.map((f) => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>상태</InputLabel>
            <Select value={statusFilter} label="상태" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
              <MenuItem value="">전체</MenuItem>
              {ALL_STATUSES.map((s) => <MenuItem key={s} value={s}>{STATUS_MAP[s].label}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: "1px solid #e0e0e0" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "#f5f5f5" } }}>
                <TableCell width={48} />
                <TableCell>주문번호</TableCell>
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
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 600, fontFamily: "monospace" }}>{o.orderNo}</Typography></TableCell>
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
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>주문 상품</Typography>
                          {o.items.map((item) => (
                            <Stack key={item.id} direction="row" sx={{ justifyContent: "space-between", py: 0.5 }}>
                              <Typography variant="body2">{item.product.name}</Typography>
                              <Typography variant="body2">{item.quantity}개 × {formatWon(item.price)} = <strong>{formatWon(item.amount)}</strong></Typography>
                            </Stack>
                          ))}
                          {o.deliveryAddr && <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 1 }}>배송지: {o.deliveryAddr}</Typography>}
                          {o.memo && <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>메모: {o.memo}</Typography>}
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
  );
}
