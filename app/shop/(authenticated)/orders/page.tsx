"use client";
import { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Stack, Chip, Collapse, CircularProgress,
  Button, Avatar, Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, Divider, IconButton,
} from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ImageIcon from "@mui/icons-material/Image";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useRouter } from "next/navigation";
import ReviewDrawer from "@/components/shop/ReviewDrawer";

interface OrderItem {
  id: string; quantity: number; price: number; amount: number; status: string;
  pickedUpAt: string | null;
  product: { name: string; imageUrl: string | null; id: string };
}
interface Order {
  id: string; orderNo: string; status: string; totalAmount: number;
  orderedAt: string; deliveryAddr: string | null; memo: string | null;
  factory: { name: string }; items: OrderItem[];
}

const STATUS_MAP: Record<string, { label: string; color: "default" | "info" | "warning" | "success" | "error" }> = {
  PENDING:   { label: "대기중", color: "default" },
  CONFIRMED: { label: "확인됨", color: "info" },
  SHIPPED:   { label: "배송중", color: "warning" },
  DELIVERED: { label: "완료",   color: "success" },
  CANCELLED: { label: "취소됨", color: "error" },
};

const formatWon = (n: number) => `${n.toLocaleString()}원`;
const formatDate = (s: string) => {
  const d = new Date(s);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export default function ShopOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<{ orderId: string; itemId: string; name: string } | null>(null);
  const [cancelOrderTarget, setCancelOrderTarget] = useState<{ orderId: string; orderNo: string } | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [pickupTarget, setPickupTarget] = useState<{ orderId: string; itemId: string; name: string } | null>(null);
  const [pickupAllTarget, setPickupAllTarget] = useState<{ orderId: string; orderNo: string } | null>(null);
  const [pickingUp, setPickingUp] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: "success" | "error" }>({ open: false, msg: "", severity: "success" });
  const [reviewTarget, setReviewTarget] = useState<{ productId: string; productName: string; productImageUrl: string | null } | null>(null);
  const [reviewedProductIds, setReviewedProductIds] = useState<Set<string>>(new Set());
  const [userName, setUserName] = useState("");
  const router = useRouter();

  const loadOrders = () => {
    fetch("/api/shop/orders")
      .then((r) => r.json())
      .then((d) => { setOrders(d || []); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(() => {
    loadOrders();
    fetch("/api/users/me").then((r) => r.json()).then((u) => { if (u?.name) setUserName(u.name); });
  }, []);

  const handleCancelOrder = async () => {
    if (!cancelOrderTarget) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/shop/orders/${cancelOrderTarget.orderId}`, { method: "PATCH" });
      if (res.ok) {
        setSnack({ open: true, msg: "주문이 취소되었습니다", severity: "success" });
        loadOrders();
      } else {
        const d = await res.json();
        setSnack({ open: true, msg: d.error || "취소 실패", severity: "error" });
      }
    } finally { setCancelling(false); setCancelOrderTarget(null); }
  };

  const handlePickupItem = async () => {
    if (!pickupTarget) return;
    setPickingUp(true);
    try {
      const res = await fetch(`/api/shop/orders/${pickupTarget.orderId}/items/${pickupTarget.itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pickup" }),
      });
      if (res.ok) {
        setSnack({ open: true, msg: `${pickupTarget.name} 픽업 완료 처리되었습니다`, severity: "success" });
        loadOrders();
      } else {
        const d = await res.json();
        setSnack({ open: true, msg: d.error || "처리 실패", severity: "error" });
      }
    } finally { setPickingUp(false); setPickupTarget(null); }
  };

  const handlePickupAll = async () => {
    if (!pickupAllTarget) return;
    setPickingUp(true);
    try {
      const res = await fetch(`/api/shop/orders/${pickupAllTarget.orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pickup" }),
      });
      if (res.ok) {
        setSnack({ open: true, msg: "전체 픽업 완료 처리되었습니다", severity: "success" });
        loadOrders();
      } else {
        setSnack({ open: true, msg: "처리 실패", severity: "error" });
      }
    } finally { setPickingUp(false); setPickupAllTarget(null); }
  };

  const handleCancelItem = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/shop/orders/${cancelTarget.orderId}/items/${cancelTarget.itemId}`, { method: "PATCH" });
      if (res.ok) {
        setSnack({ open: true, msg: "상품이 취소되었습니다", severity: "success" });
        loadOrders();
      } else {
        const d = await res.json();
        setSnack({ open: true, msg: d.error || "취소 실패", severity: "error" });
      }
    } finally { setCancelling(false); setCancelTarget(null); }
  };

  const activeTotal = (o: Order) =>
    o.status === "CANCELLED" ? 0
      : o.items.filter((i) => i.status !== "CANCELLED").reduce((s, i) => s + i.amount, 0);

  return (
    <Box sx={{ maxWidth: 640, mx: "auto" }}>
      {/* 헤더 */}
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <ReceiptLongIcon color="primary" fontSize="small" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>주문 내역</Typography>
        </Stack>
        <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => router.push("/shop/products")}
          sx={{ color: "text.secondary", textTransform: "none" }}>
          쇼핑 계속하기
        </Button>
      </Stack>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : orders.length === 0 ? (
        <Paper elevation={0} sx={{ py: 10, textAlign: "center", border: "1px solid #e0e0e0", borderRadius: 2 }}>
          <ReceiptLongIcon sx={{ fontSize: 56, color: "#e0e0e0", mb: 2 }} />
          <Typography sx={{ color: "text.secondary", mb: 3 }}>주문 내역이 없습니다</Typography>
          <Button variant="contained" onClick={() => router.push("/shop/products")} sx={{ borderRadius: 8 }}>
            쇼핑하러 가기
          </Button>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {orders.map((o) => {
            const activeItems = o.items.filter((i) => i.status !== "CANCELLED");
            const hasActive = o.status !== "CANCELLED" && activeItems.length > 0;
            const hasCancelledItem = o.items.some((i) => i.status === "CANCELLED") && activeItems.length > 0;
            const allPickedUp = activeItems.length > 0 && activeItems.every((i) => !!i.pickedUpAt);
            const somePickedUp = activeItems.some((i) => !!i.pickedUpAt);
            const expanded = expandedId === o.id;
            const st = STATUS_MAP[o.status] || { label: o.status, color: "default" as const };
            const anyPickedUp = activeItems.some((i) => !!i.pickedUpAt);

            return (
              <Paper key={o.id} elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden" }}>
                {/* 카드 헤더 */}
                <Box
                  onClick={() => setExpandedId(expanded ? null : o.id)}
                  sx={{ px: 2, py: 1.5, cursor: "pointer", "&:active": { bgcolor: "#f9f9f9" } }}
                >
                  <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
                    <Box sx={{ minWidth: 0, flex: 1, mr: 1 }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
                        <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 700, color: "text.secondary", fontSize: 11 }}>
                          {o.orderNo}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.disabled" }}>·</Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>{o.factory.name}</Typography>
                      </Stack>
                      <Typography variant="caption" sx={{ color: "text.disabled" }}>{formatDate(o.orderedAt)}</Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", flexShrink: 0 }}>
                      {allPickedUp ? (
                        <Chip label="픽업완료" size="small" color="success" sx={{ fontWeight: 700, fontSize: 11 }} />
                      ) : somePickedUp ? (
                        <Chip label="일부픽업" size="small" color="warning" sx={{ fontWeight: 700, fontSize: 11 }} />
                      ) : (
                        <Chip label={st.label} size="small" color={st.color} sx={{ fontWeight: 600, fontSize: 11 }} />
                      )}
                      <IconButton size="small" sx={{ p: 0.3 }}>
                        {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                      </IconButton>
                    </Stack>
                  </Stack>

                  {/* 상품 요약 */}
                  <Box sx={{ mt: 1 }}>
                    {activeItems.slice(0, 2).map((item) => (
                      <Typography key={item.id} variant="body2" sx={{ color: "text.primary", lineHeight: 1.6 }} noWrap>
                        {item.product.name} × {item.quantity}
                      </Typography>
                    ))}
                    {activeItems.length > 2 && (
                      <Typography variant="caption" sx={{ color: "text.disabled" }}>
                        외 {activeItems.length - 2}개
                      </Typography>
                    )}
                    {hasCancelledItem && (
                      <Typography variant="caption" sx={{ color: "error.main", display: "block" }}>(일부 취소됨)</Typography>
                    )}
                    {o.status === "CANCELLED" && (
                      <Typography variant="caption" sx={{ color: "error.main", display: "block" }}>전체 취소된 주문입니다</Typography>
                    )}
                  </Box>

                  {/* 금액 */}
                  <Stack direction="row" sx={{ justifyContent: "flex-end", mt: 1 }}>
                    <Typography sx={{
                      fontWeight: 700, fontSize: 16,
                      color: hasActive ? "primary.main" : "text.disabled",
                      textDecoration: !hasActive ? "line-through" : "none",
                    }}>
                      {formatWon(activeTotal(o))}
                    </Typography>
                  </Stack>
                </Box>

                {/* 펼침 상세 */}
                <Collapse in={expanded}>
                  <Divider />
                  <Box sx={{ px: 2, py: 2, bgcolor: "#fafafa" }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      주문 상품
                    </Typography>
                    <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                      {o.items.map((item) => {
                        const cancelled = o.status === "CANCELLED" || item.status === "CANCELLED";
                        const pickedUp = !!item.pickedUpAt;
                        return (
                          <Stack key={item.id} direction="row" spacing={1.5} sx={{ alignItems: "center", opacity: cancelled ? 0.45 : 1 }}>
                            <Avatar
                              src={item.product.imageUrl || undefined}
                              variant="rounded"
                              sx={{ width: 40, height: 40, bgcolor: "#f0f0f0", flexShrink: 0, cursor: cancelled ? "default" : "pointer" }}
                              onClick={() => { if (!cancelled) router.push(`/shop/products/${item.product.id}`); }}
                            >
                              <ImageIcon fontSize="small" color="disabled" />
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600, cursor: cancelled ? "default" : "pointer", color: cancelled ? "text.primary" : "primary.main", textDecoration: cancelled ? "line-through" : "none" }}
                                onClick={() => { if (!cancelled) router.push(`/shop/products/${item.product.id}`); }}
                                noWrap
                              >
                                {item.product.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                {item.quantity}개 × {formatWon(item.price)}
                              </Typography>
                            </Box>
                            <Stack sx={{ alignItems: "flex-end", flexShrink: 0 }} spacing={0.5}>
                              {cancelled ? (
                                <Chip label="취소" size="small" color="error" variant="outlined" sx={{ height: 20, fontSize: 10 }} />
                              ) : pickedUp ? (
                                <>
                                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatWon(item.amount)}</Typography>
                                  {reviewedProductIds.has(item.product.id) ? (
                                    <Chip label="리뷰 완료" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: 10, fontWeight: 700 }} />
                                  ) : (
                                    <Button
                                      size="small" color="primary" variant="outlined"
                                      sx={{ fontSize: 10, py: 0.2, px: 0.75, minWidth: 0, lineHeight: 1.4, fontWeight: 700 }}
                                      onClick={(e) => { e.stopPropagation(); setReviewTarget({ productId: item.product.id, productName: item.product.name, productImageUrl: item.product.imageUrl }); }}
                                    >
                                      리뷰 작성
                                    </Button>
                                  )}
                                </>
                              ) : (
                                <>
                                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatWon(item.amount)}</Typography>
                                  <Stack direction="row" spacing={0.5}>
                                    <Button
                                      size="small" color="success" variant="contained"
                                      sx={{ fontSize: 10, py: 0.2, px: 0.75, minWidth: 0, lineHeight: 1.4, fontWeight: 700 }}
                                      onClick={(e) => { e.stopPropagation(); setPickupTarget({ orderId: o.id, itemId: item.id, name: item.product.name }); }}
                                    >
                                      픽업완료
                                    </Button>
                                    {o.status === "PENDING" && (
                                      <Button
                                        size="small" color="error" variant="outlined"
                                        sx={{ fontSize: 10, py: 0.2, px: 0.75, minWidth: 0, lineHeight: 1.4 }}
                                        onClick={(e) => { e.stopPropagation(); setCancelTarget({ orderId: o.id, itemId: item.id, name: item.product.name }); }}
                                      >
                                        취소
                                      </Button>
                                    )}
                                  </Stack>
                                </>
                              )}
                            </Stack>
                          </Stack>
                        );
                      })}
                    </Stack>

                    {/* 소계 */}
                    {hasCancelledItem && (
                      <Stack direction="row" sx={{ justifyContent: "space-between", mt: 2, pt: 1.5, borderTop: "1px solid #ececec" }}>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>실결제 금액</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>{formatWon(activeTotal(o))}</Typography>
                      </Stack>
                    )}

                    {/* 배송지/메모 */}
                    {(o.deliveryAddr || o.memo) && (
                      <Stack spacing={0.5} sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid #ececec" }}>
                        {o.deliveryAddr && <Typography variant="caption" sx={{ color: "text.secondary" }}>배송지: {o.deliveryAddr}</Typography>}
                        {o.memo && <Typography variant="caption" sx={{ color: "text.secondary" }}>메모: {o.memo}</Typography>}
                      </Stack>
                    )}

                    {/* 전체 픽업완료 / 주문 전체 취소 */}
                    {o.status !== "CANCELLED" && !allPickedUp && (
                      <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid #ececec" }}>
                        <Stack spacing={1}>
                          <Button
                            size="small" color="success" variant="contained" fullWidth
                            sx={{ fontSize: 13, py: 0.9, fontWeight: 700, borderRadius: 2 }}
                            onClick={() => setPickupAllTarget({ orderId: o.id, orderNo: o.orderNo })}
                          >
                            전체 픽업 완료 확인
                          </Button>
                          {o.status === "PENDING" && !anyPickedUp && (
                            <Button
                              size="small" color="error" variant="outlined" fullWidth
                              sx={{ fontSize: 13, py: 0.8 }}
                              onClick={() => setCancelOrderTarget({ orderId: o.id, orderNo: o.orderNo })}
                            >
                              주문 전체 취소
                            </Button>
                          )}
                        </Stack>
                      </Box>
                    )}
                  </Box>
                </Collapse>
              </Paper>
            );
          })}
        </Stack>
      )}

      {/* 전체 픽업 완료 확인 */}
      <Dialog open={!!pickupAllTarget} onClose={() => setPickupAllTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700 }}>전체 픽업 완료 확인</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            <strong>{pickupAllTarget?.orderNo}</strong> 주문의 모든 상품을 픽업 완료로 처리하시겠습니까?
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
            직접 수령한 경우에만 확인해 주세요.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button onClick={() => setPickupAllTarget(null)} sx={{ flex: 1 }}>아니요</Button>
          <Button color="success" variant="contained" onClick={handlePickupAll} disabled={pickingUp} sx={{ flex: 1 }}>
            {pickingUp ? "처리 중..." : "전체 픽업 완료"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 개별 픽업 완료 확인 다이얼로그 */}
      <Dialog open={!!pickupTarget} onClose={() => setPickupTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700 }}>픽업 완료 확인</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            <strong>{pickupTarget?.name}</strong> 상품을 픽업 완료로 처리하시겠습니까?
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
            직접 수령한 경우에만 확인해 주세요.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button onClick={() => setPickupTarget(null)} sx={{ flex: 1 }}>아니요</Button>
          <Button color="success" variant="contained" onClick={handlePickupItem} disabled={pickingUp} sx={{ flex: 1 }}>
            {pickingUp ? "처리 중..." : "픽업 완료"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 주문 전체 취소 확인 */}
      <Dialog open={!!cancelOrderTarget} onClose={() => setCancelOrderTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700 }}>주문 전체 취소</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            <strong>{cancelOrderTarget?.orderNo}</strong> 주문 전체를 취소하시겠습니까?
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
            모든 상품이 취소되며 되돌릴 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button onClick={() => setCancelOrderTarget(null)} sx={{ flex: 1 }}>아니요</Button>
          <Button color="error" variant="contained" onClick={handleCancelOrder} disabled={cancelling} sx={{ flex: 1 }}>
            {cancelling ? "취소 중..." : "전체 취소"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 아이템 취소 확인 */}
      <Dialog open={!!cancelTarget} onClose={() => setCancelTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700 }}>상품 취소</DialogTitle>
        <DialogContent>
          <Typography variant="body2"><strong>{cancelTarget?.name}</strong> 상품을 취소하시겠습니까?</Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>다른 상품의 주문은 유지됩니다.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button onClick={() => setCancelTarget(null)} sx={{ flex: 1 }}>아니요</Button>
          <Button color="error" variant="contained" onClick={handleCancelItem} disabled={cancelling} sx={{ flex: 1 }}>
            {cancelling ? "취소 중..." : "취소 확인"}
          </Button>
        </DialogActions>
      </Dialog>

      <ReviewDrawer
        open={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        productId={reviewTarget?.productId ?? ""}
        productName={reviewTarget?.productName ?? ""}
        productImageUrl={reviewTarget?.productImageUrl}
        userName={userName}
        onSuccess={() => {
          if (reviewTarget) setReviewedProductIds((prev) => new Set(prev).add(reviewTarget.productId));
          setSnack({ open: true, msg: "리뷰가 등록되었습니다!", severity: "success" });
          setReviewTarget(null);
        }}
      />

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
