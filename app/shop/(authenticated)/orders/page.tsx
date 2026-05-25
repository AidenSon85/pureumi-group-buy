"use client";
import { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Stack, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Collapse, IconButton, CircularProgress,
  Button, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ImageIcon from "@mui/icons-material/Image";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useRouter } from "next/navigation";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  amount: number;
  product: { name: string; imageUrl: string | null };
}
interface Order {
  id: string;
  orderNo: string;
  status: string;
  totalAmount: number;
  orderedAt: string;
  deliveryAddr: string | null;
  memo: string | null;
  factory: { name: string };
  items: OrderItem[];
}

const STATUS_MAP: Record<string, { label: string; color: "default" | "info" | "warning" | "success" | "error" }> = {
  PENDING: { label: "대기", color: "default" },
  CONFIRMED: { label: "확인", color: "info" },
  SHIPPED: { label: "배송중", color: "warning" },
  DELIVERED: { label: "완료", color: "success" },
  CANCELLED: { label: "취소", color: "error" },
};

const formatWon = (n: number) => `₩${n.toLocaleString()}`;
const formatDate = (s: string) =>
  new Date(s).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function ShopOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: "success" | "error" }>({ open: false, msg: "", severity: "success" });
  const router = useRouter();

  const loadOrders = () => {
    fetch("/api/shop/orders")
      .then((r) => r.json())
      .then((d) => { setOrders(d || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadOrders(); }, []);

  const handleCancel = async () => {
    if (!cancelId) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/shop/orders/${cancelId}`, { method: "PATCH" });
      if (res.ok) {
        setSnack({ open: true, msg: "주문이 취소되었습니다", severity: "success" });
        loadOrders();
      } else {
        const d = await res.json();
        setSnack({ open: true, msg: d.error || "취소 실패", severity: "error" });
      }
    } finally {
      setCancelling(false);
      setCancelId(null);
    }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <ReceiptLongIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>주문 내역</Typography>
        </Stack>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push("/shop/products")} sx={{ color: "text.secondary" }}>
          쇼핑 계속하기
        </Button>
      </Stack>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : orders.length === 0 ? (
        <Paper elevation={0} sx={{ py: 10, textAlign: "center", border: "1px solid #e0e0e0", borderRadius: 2 }}>
          <ReceiptLongIcon sx={{ fontSize: 64, color: "#e0e0e0", mb: 2 }} />
          <Typography variant="h6" sx={{ color: "text.secondary", mb: 3 }}>주문 내역이 없습니다</Typography>
          <Button variant="contained" onClick={() => router.push("/shop/products")} sx={{ borderRadius: 8 }}>
            쇼핑하러 가기
          </Button>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden" }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "#f8f9fa" } }}>
                  <TableCell width={48} />
                  <TableCell>주문번호</TableCell>
                  <TableCell>매장</TableCell>
                  <TableCell>주문일시</TableCell>
                  <TableCell align="right">금액</TableCell>
                  <TableCell align="center">상태</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((o) => (
                  <>
                    <TableRow
                      key={o.id}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}
                    >
                      <TableCell>
                        <IconButton size="small">
                          {expandedId === o.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: "monospace" }}>
                          {o.orderNo}
                        </Typography>
                        {o.items.map((item) => (
                          <Typography key={item.id} variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                            {item.product.name} × {item.quantity}
                          </Typography>
                        ))}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{o.factory.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{formatDate(o.orderedAt)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontWeight: 700, color: "primary.main" }}>
                          {formatWon(o.totalAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={STATUS_MAP[o.status]?.label || o.status}
                          size="small"
                          color={STATUS_MAP[o.status]?.color || "default"}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow key={`${o.id}-detail`}>
                      <TableCell colSpan={6} sx={{ py: 0, border: 0 }}>
                        <Collapse in={expandedId === o.id}>
                          <Box sx={{ py: 2, px: 4, bgcolor: "#fafafa", borderBottom: "1px solid #e0e0e0" }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>주문 상품</Typography>
                            <Stack spacing={1}>
                              {o.items.map((item) => (
                                <Stack key={item.id} direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                                  <Avatar
                                    src={item.product.imageUrl || undefined}
                                    variant="rounded"
                                    sx={{ width: 36, height: 36, bgcolor: "#f5f5f5" }}
                                  >
                                    <ImageIcon fontSize="small" color="disabled" />
                                  </Avatar>
                                  <Typography variant="body2" sx={{ flex: 1 }}>{item.product.name}</Typography>
                                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                    {item.quantity}개 × {formatWon(item.price)}
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                    {formatWon(item.amount)}
                                  </Typography>
                                </Stack>
                              ))}
                            </Stack>
                            {(o.deliveryAddr || o.memo) && (
                              <Stack spacing={0.5} sx={{ mt: 2, pt: 1.5, borderTop: "1px solid #e0e0e0" }}>
                                {o.deliveryAddr && (
                                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                    배송지: {o.deliveryAddr}
                                  </Typography>
                                )}
                                {o.memo && (
                                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                    메모: {o.memo}
                                  </Typography>
                                )}
                              </Stack>
                            )}
                            {o.status === "PENDING" && (
                              <Box sx={{ mt: 2, pt: 1.5, borderTop: "1px solid #e0e0e0", textAlign: "right" }}>
                                <Button
                                  size="small" color="error" variant="outlined"
                                  onClick={(e) => { e.stopPropagation(); setCancelId(o.id); }}
                                >
                                  주문 취소
                                </Button>
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
        </Paper>
      )}

      <Dialog open={!!cancelId} onClose={() => setCancelId(null)}>
        <DialogTitle>주문 취소</DialogTitle>
        <DialogContent>
          <Typography>이 주문을 취소하시겠습니까? 취소 후 되돌릴 수 없습니다.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelId(null)}>아니요</Button>
          <Button color="error" variant="contained" onClick={handleCancel} disabled={cancelling}>
            {cancelling ? "취소 중..." : "주문 취소"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
