"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box, Typography, Button, Stack, Chip, Divider, IconButton,
  CircularProgress, Snackbar, Alert, Paper, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Tabs, Tab,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import PersonIcon from "@mui/icons-material/Person";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";

interface Product {
  id: string; name: string; description: string | null; content: string | null;
  price: number; salePrice: number | null; unit: string; minQty: number; maxQty: number | null;
  stock: number; imageUrl: string | null; images: string[];
  isActive: boolean; category: { name: string } | null;
  pickupStartAt: string | null; groupBuyEndAt: string | null;
}
interface Comment {
  id: string; name: string; phoneDigits: string; content: string | null;
  isAdminReply: boolean; createdAt: string; userId: string | null; orderId: string | null;
  replies?: Comment[];
}
interface Review {
  id: string; name: string; content: string | null; createdAt: string; userId: string | null;
}

const formatWon = (n: number) => `₩${n.toLocaleString()}`;
const formatDT = (s: string) => new Date(s).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userPhoneDigits, setUserPhoneDigits] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);

  const [tab, setTab] = useState(0);
  const [canReview, setCanReview] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [phoneDigits, setPhoneDigits] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [ordering, setOrdering] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: "success" | "error" }>({ open: false, msg: "", severity: "success" });

  useEffect(() => {
    Promise.all([
      fetch(`/api/products/${id}`).then((r) => r.json()),
      fetch(`/api/products/${id}/comments`).then((r) => r.json()),
      fetch(`/api/products/${id}/comments?type=reviews`).then((r) => r.json()),
      fetch("/api/users/me").then((r) => r.json()),
      fetch(`/api/shop/orders/picked?productId=${id}`).then((r) => r.json()),
    ]).then(([p, c, rv, u, picked]) => {
      setProduct(p);
      setQty(p.minQty || 1);
      setComments(c || []);
      setReviews(rv || []);
      setCanReview(picked?.canReview ?? false);
      setAlreadyReviewed(picked?.alreadyReviewed ?? false);
      if (u?.id) setCurrentUserId(u.id);
      if (u?.name) setUserName(u.name);
      if (u?.phone) {
        const digits = u.phone.replace(/\D/g, "").slice(-4);
        setPhoneDigits(digits);
        setUserPhoneDigits(digits);
      }
      fetch(`/api/shop/orders/pending?productId=${id}`).then((r) => r.json()).then((o) => {
        if (o?.id) { setPendingOrderId(o.id); setPendingItemId(o.itemId ?? null); }
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const loadComments = () =>
    fetch(`/api/products/${id}/comments`).then((r) => r.json()).then((c) => setComments(c || []));

  const loadReviews = () =>
    fetch(`/api/products/${id}/comments?type=reviews`).then((r) => r.json()).then((rv) => setReviews(rv || []));

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}><CircularProgress /></Box>;
  if (!product) return (
    <Box sx={{ py: 10, textAlign: "center" }}>
      <Typography color="text.secondary">제품을 찾을 수 없습니다</Typography>
      <Button sx={{ mt: 2 }} onClick={() => router.back()}>돌아가기</Button>
    </Box>
  );

  const price = product.salePrice ?? product.price;
  const minQty = product.minQty || 1;
  const maxQty = Math.min(product.stock, product.maxQty ?? product.stock);
  const discountRate = product.salePrice ? Math.round((1 - product.salePrice / product.price) * 100) : 0;
  const allImages = [product.imageUrl, ...product.images.filter((img) => img !== product.imageUrl)].filter(Boolean) as string[];

  const handleOrder = async () => {
    const cleaned = phoneDigits.trim();
    if (!/^\d{4}$/.test(cleaned)) {
      setPhoneError("전화번호 뒷 4자리를 숫자로 입력해주세요");
      return;
    }
    setPhoneError("");
    setOrdering(true);
    try {
      const meRes = await fetch("/api/users/me").then((r) => r.json());
      const userName = meRes?.name || "고객";
      const uid = meRes?.id || null;

      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ productId: product.id, quantity: qty }] }),
      });
      if (!orderRes.ok) {
        const d = await orderRes.json();
        setSnack({ open: true, msg: d.error || "주문 실패", severity: "error" });
        return;
      }
      const order = await orderRes.json();

      await fetch(`/api/products/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userName,
          phoneDigits: cleaned,
          content: `${product.name} - ${qty}${product.unit}`,
          userId: uid,
          orderId: order.id,
        }),
      });

      await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `010-0000-${cleaned}` }),
      });

      await loadComments();
      setDialogOpen(false);
      setSnack({ open: true, msg: "주문이 완료되었습니다!", severity: "success" });
      setTimeout(() => router.push("/shop/orders"), 1200);
    } finally {
      setOrdering(false);
    }
  };

  const refreshPending = () =>
    fetch(`/api/shop/orders/pending?productId=${id}`).then((r) => r.json()).then((o) => {
      setPendingOrderId(o?.id || null);
      setPendingItemId(o?.itemId || null);
    });

  const handleCancelOrder = async (comment: Comment) => {
    const targetOrderId = comment.orderId || pendingOrderId;
    if (!targetOrderId) return;

    const targetItemId = pendingItemId;
    setCancellingId(comment.id);
    try {
      let res: Response;
      if (targetItemId) {
        res = await fetch(`/api/shop/orders/${targetOrderId}/items/${targetItemId}`, { method: "PATCH" });
      } else {
        res = await fetch(`/api/shop/orders/${targetOrderId}`, { method: "PATCH" });
      }
      if (res.ok) {
        await fetch(`/api/products/${id}/comments?commentId=${comment.id}`, { method: "DELETE" });
        setComments((prev) => prev.filter((c) => c.id !== comment.id));
        await refreshPending();
        setSnack({ open: true, msg: "주문이 취소되었습니다", severity: "success" });
      } else {
        const d = await res.json();
        setSnack({ open: true, msg: d.error || "취소 실패", severity: "error" });
      }
    } finally {
      setCancellingId(null);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewText.trim()) return;
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/products/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userName || "고객", content: reviewText.trim(), isReview: true }),
      });
      if (res.ok) {
        setReviewText("");
        setCanReview(false);
        setAlreadyReviewed(true);
        await loadReviews();
        setSnack({ open: true, msg: "리뷰가 등록되었습니다!", severity: "success" });
      } else {
        const d = await res.json();
        setSnack({ open: true, msg: d.error || "리뷰 등록 실패", severity: "error" });
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", pb: 14 }}>

      {/* 상단 네비 */}
      <Stack direction="row" sx={{ alignItems: "center", mb: 1 }}>
        <IconButton onClick={() => router.push("/shop/products")} size="small">
          <ArrowBackIcon />
        </IconButton>
      </Stack>

      {/* 제품 정보 카드 */}
      <Paper elevation={0} sx={{ border: "1px solid #f0f0f0", borderRadius: 2.5, p: 2.5, mb: 2 }}>
        <Stack direction="row" spacing={0.75} sx={{ mb: 1.5, flexWrap: "wrap" }}>
          {product.category && <Chip label={product.category.name} size="small" variant="outlined" sx={{ fontSize: 11 }} />}
          {!product.isActive && <Chip label="마감" size="small" color="default" sx={{ fontSize: 11 }} />}
          {product.stock === 0 && <Chip label="품절" size="small" color="error" sx={{ fontSize: 11 }} />}
          {product.stock > 0 && product.stock < 10 && <Chip label="소량" size="small" color="warning" sx={{ fontSize: 11 }} />}
        </Stack>

        <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.4, mb: 0.75, wordBreak: "keep-all" }}>
          {product.name}
        </Typography>

        {product.description && (
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2, lineHeight: 1.6 }}>
            {product.description}
          </Typography>
        )}

        <Divider sx={{ mb: 2 }} />

        {product.salePrice ? (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ color: "text.disabled", textDecoration: "line-through", fontSize: 13 }}>
              정가 {formatWon(product.price)}
            </Typography>
            <Stack direction="row" sx={{ alignItems: "center", gap: 1, mt: 0.25 }}>
              <Typography sx={{ fontWeight: 900, fontSize: 28, color: "#e53935", lineHeight: 1 }}>
                {formatWon(product.salePrice)}
              </Typography>
              <Chip label={`${discountRate}%`} size="small" sx={{ bgcolor: "#e53935", color: "#fff", fontWeight: 800, fontSize: 12, height: 22 }} />
            </Stack>
          </Box>
        ) : (
          <Typography sx={{ fontWeight: 900, fontSize: 28, color: "primary.main", mb: 1 }}>
            {formatWon(product.price)}
          </Typography>
        )}

        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          재고 {product.stock}{product.unit}
        </Typography>

        {(product.pickupStartAt || product.groupBuyEndAt) && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Stack spacing={0.75}>
              {product.pickupStartAt && (
                <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
                  <LocalShippingOutlinedIcon sx={{ fontSize: 15, color: "text.secondary" }} />
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>픽업 시작일</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main" }}>
                    {new Date(product.pickupStartAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                  </Typography>
                </Stack>
              )}
              {product.groupBuyEndAt && (
                <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
                  <CalendarMonthOutlinedIcon sx={{ fontSize: 15, color: "text.secondary" }} />
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>공구 마감일</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "error.main" }}>
                    {new Date(product.groupBuyEndAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </>
        )}
      </Paper>

      {/* 수량 선택 */}
      <Paper elevation={0} sx={{ border: "1px solid #f0f0f0", borderRadius: 2.5, p: 2.5, mb: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 2, color: "text.secondary" }}>수량 선택</Typography>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
            <IconButton onClick={() => setQty((q) => Math.max(minQty, q - 1))} disabled={qty <= minQty} size="small"
              sx={{ border: "1.5px solid #e0e0e0", borderRadius: 1.5, width: 36, height: 36 }}>
              <RemoveIcon fontSize="small" />
            </IconButton>
            <Typography sx={{ fontWeight: 800, fontSize: 20, minWidth: 32, textAlign: "center" }}>{qty}</Typography>
            <IconButton onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty} size="small"
              sx={{ border: "1.5px solid #e0e0e0", borderRadius: 1.5, width: 36, height: 36 }}>
              <AddIcon fontSize="small" />
            </IconButton>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>{product.unit}</Typography>
          </Stack>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>소계</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: 20, color: "primary.main" }}>{formatWon(price * qty)}</Typography>
          </Box>
        </Stack>
        <Typography variant="caption" sx={{ color: "text.disabled", mt: 1, display: "block" }}>
          최소 {minQty}{product.unit} / 최대 {maxQty}{product.unit}
        </Typography>
      </Paper>

      {/* 탭: 상품 정보 / 리뷰 */}
      <Paper elevation={0} sx={{ border: "1px solid #f0f0f0", borderRadius: 2.5, overflow: "hidden", mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="fullWidth"
          sx={{ borderBottom: "1px solid #f0f0f0", minHeight: 44, "& .MuiTabs-indicator": { height: 3 } }}
        >
          <Tab label="상품 정보" sx={{ fontWeight: 700, fontSize: 14, minHeight: 44 }} />
          <Tab
            label={`리뷰 (${reviews.length}건)`}
            icon={<RateReviewOutlinedIcon sx={{ fontSize: 15 }} />}
            iconPosition="start"
            sx={{ fontWeight: 700, fontSize: 14, minHeight: 44 }}
          />
        </Tabs>

        {/* 상품 정보 탭 */}
        {tab === 0 && (
          <Box>
            {product.content ? (
              <Box sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>제품 상세</Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.9, color: "text.secondary" }}>
                  {product.content}
                </Typography>
              </Box>
            ) : null}

            {allImages.length > 0 && (
              <Box>
                {product.content && <Divider />}
                <Box sx={{ px: 2.5, py: 1.5, borderBottom: allImages.length > 0 ? "1px solid #f0f0f0" : undefined }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>상품 이미지 ({allImages.length}장)</Typography>
                </Box>
                <Stack>
                  {allImages.map((img, i) => (
                    <Box key={i} component="img" src={img} alt={`이미지 ${i + 1}`} sx={{ width: "100%", display: "block" }} />
                  ))}
                </Stack>
              </Box>
            )}

            {!product.content && allImages.length === 0 && (
              <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
                <Typography variant="body2">상세 정보가 없습니다</Typography>
              </Box>
            )}
          </Box>
        )}

        {/* 리뷰 탭 */}
        {tab === 1 && (
          <Box>
            {/* 리뷰 작성 폼 */}
            {canReview && (
              <Box sx={{ p: 2.5, borderBottom: "1px solid #f0f0f0", bgcolor: "#fafffe" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: "success.main" }}>
                  리뷰 작성
                </Typography>
                <TextField
                  multiline rows={3} fullWidth size="small"
                  placeholder="상품에 대한 솔직한 리뷰를 남겨주세요"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  sx={{ mb: 1.5 }}
                />
                <Button
                  variant="contained" color="success" size="small"
                  onClick={handleSubmitReview}
                  disabled={submittingReview || !reviewText.trim()}
                  sx={{ fontWeight: 700 }}
                >
                  {submittingReview ? <CircularProgress size={16} color="inherit" /> : "리뷰 등록"}
                </Button>
              </Box>
            )}

            {alreadyReviewed && (
              <Box sx={{ px: 2.5, py: 1.5, borderBottom: "1px solid #f0f0f0", bgcolor: "#f0fff4" }}>
                <Typography variant="caption" sx={{ color: "success.main", fontWeight: 600 }}>
                  리뷰를 작성하셨습니다. 감사합니다!
                </Typography>
              </Box>
            )}

            {/* 리뷰 목록 */}
            {reviews.length === 0 ? (
              <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
                <RateReviewOutlinedIcon sx={{ fontSize: 40, opacity: 0.3, display: "block", mx: "auto", mb: 1 }} />
                <Typography variant="body2">아직 리뷰가 없습니다</Typography>
                {!canReview && !alreadyReviewed && (
                  <Typography variant="caption" sx={{ mt: 0.5, display: "block" }}>
                    픽업 완료 후 첫 리뷰를 남겨보세요
                  </Typography>
                )}
              </Box>
            ) : (
              <Stack divider={<Divider />}>
                {reviews.map((rv) => (
                  <Box key={rv.id} sx={{ px: 2.5, py: 2 }}>
                    <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 0.75 }}>
                      <Avatar sx={{ width: 28, height: 28, bgcolor: "#e8f5e9", flexShrink: 0 }}>
                        <PersonIcon sx={{ fontSize: 15, color: "#388e3c" }} />
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{rv.name}</Typography>
                      <Typography variant="caption" sx={{ color: "text.disabled", ml: "auto" }}>
                        {formatDT(rv.createdAt)}
                      </Typography>
                    </Stack>
                    {rv.content && (
                      <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.7, pl: 4.5 }}>
                        {rv.content}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        )}
      </Paper>

      {/* 구매 내역 댓글 */}
      <Paper elevation={0} sx={{ border: "1px solid #f0f0f0", borderRadius: 2.5, overflow: "hidden", mb: 2 }}>
        <Stack direction="row" sx={{ alignItems: "center", gap: 1, px: 2.5, py: 1.5, borderBottom: "1px solid #f0f0f0", bgcolor: "#fafafa" }}>
          <ChatBubbleOutlineOutlinedIcon sx={{ fontSize: 15, color: "primary.main" }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            구매 내역
            <Typography component="span" variant="caption" sx={{ color: "text.secondary", ml: 1 }}>({comments.length}건)</Typography>
          </Typography>
        </Stack>

        {comments.length === 0 ? (
          <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", py: 4 }}>
            등록된 구매 내역이 없습니다
          </Typography>
        ) : (
          <Stack divider={<Divider />}>
            {comments.map((c) => (
              <Box key={c.id}>
                <Stack direction="row" sx={{ alignItems: "flex-start", px: 2.5, py: 1.5, gap: 1.5 }}>
                  <Avatar sx={{ width: 30, height: 30, bgcolor: "#e3f2fd", flexShrink: 0 }}>
                    <PersonIcon sx={{ fontSize: 16, color: "#1976d2" }} />
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {(() => {
                      const isMyComment =
                        (currentUserId && c.userId === currentUserId && (c.orderId || pendingOrderId)) ||
                        (userPhoneDigits && c.phoneDigits === userPhoneDigits && !!pendingOrderId);
                      return (
                        <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 0.3 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{c.name}</Typography>
                          <Chip label={`***-****-${c.phoneDigits}`} size="small" variant="outlined"
                            sx={{ height: 18, fontSize: 10, "& .MuiChip-label": { px: 0.75 } }} />
                          <Stack direction="row" sx={{ alignItems: "center", gap: 0.5, ml: "auto" }}>
                            <Typography variant="caption" sx={{ color: "text.disabled" }}>{formatDT(c.createdAt)}</Typography>
                            {isMyComment && (
                              <Button
                                size="small" color="error" variant="outlined"
                                onClick={() => handleCancelOrder(c)}
                                disabled={cancellingId === c.id}
                                sx={{ px: 1, py: 0.2, fontSize: 11, lineHeight: 1.5, borderRadius: 1.5, minWidth: 0 }}
                              >
                                {cancellingId === c.id ? "취소 중..." : "주문 취소"}
                              </Button>
                            )}
                          </Stack>
                        </Stack>
                      );
                    })()}
                    {c.content && (
                      <Typography variant="body2" sx={{ color: "text.secondary", fontSize: 13 }}>{c.content}</Typography>
                    )}
                  </Box>
                </Stack>

                {c.replies && c.replies.length > 0 && (
                  <Stack sx={{ ml: { xs: 5, sm: 6 }, mr: 2.5, mb: 1.5 }} spacing={0.5}>
                    {c.replies.map((r) => (
                      <Stack key={r.id} direction="row" sx={{ alignItems: "flex-start", gap: 1, p: 1.5, bgcolor: "#f0f4ff", borderRadius: 2, border: "1px solid #c5cae9" }}>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: "#1a237e", flexShrink: 0 }}>
                          <PersonIcon sx={{ fontSize: 13, color: "#fff" }} />
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack direction="row" sx={{ alignItems: "center", gap: 0.75, mb: 0.3 }}>
                            <Chip label="관리자" size="small" sx={{ bgcolor: "#1a237e", color: "#fff", fontWeight: 700, fontSize: 10, height: 18, "& .MuiChip-label": { px: 0.75 } }} />
                            <Typography variant="caption" sx={{ color: "text.disabled", ml: "auto" }}>{formatDT(r.createdAt)}</Typography>
                          </Stack>
                          <Typography variant="body2" sx={{ fontSize: 13 }}>{r.content}</Typography>
                        </Box>
                      </Stack>
                    ))}
                  </Stack>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      {/* 하단 고정 버튼 */}
      <Box sx={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        bgcolor: "#fff", borderTop: "1px solid #f0f0f0",
        p: { xs: 2, sm: "16px max(16px, calc(50% - 284px))" },
      }}>
        <Button
          variant="contained" size="large" fullWidth
          onClick={() => setDialogOpen(true)}
          disabled={product.stock === 0}
          sx={{ py: 1.6, borderRadius: 2, fontWeight: 700, fontSize: 16 }}
        >
          {product.stock === 0 ? "품절" : "바로 구매"}
        </Button>
      </Box>

      {/* 주문 확인 다이얼로그 */}
      <Dialog open={dialogOpen} onClose={() => !ordering && setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>주문하기</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Box sx={{ p: 1.5, bgcolor: "#f8f9fa", borderRadius: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{product.name}</Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {qty}{product.unit} × {formatWon(price)} = <strong>{formatWon(price * qty)}</strong>
              </Typography>
              {product.pickupStartAt && (
                <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 600, display: "block", mt: 0.5 }}>
                  픽업 {new Date(product.pickupStartAt).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}~
                </Typography>
              )}
            </Box>
            {userPhoneDigits ? (
              <Box sx={{ p: 1.5, bgcolor: "#f0f4ff", borderRadius: 2, border: "1px solid #c5cae9" }}>
                <Stack direction="row" spacing={3}>
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>이름</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{userName || "고객"}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>전화번호</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>***-****-{userPhoneDigits}</Typography>
                  </Box>
                </Stack>
              </Box>
            ) : (
              <TextField
                label="전화번호 뒷 4자리"
                value={phoneDigits}
                onChange={(e) => { setPhoneDigits(e.target.value.replace(/\D/g, "").slice(0, 4)); setPhoneError(""); }}
                error={!!phoneError}
                helperText={phoneError || "구매 내역에 표시됩니다"}
                slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 4 } }}
                fullWidth size="small"
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={ordering}>취소</Button>
          <Button variant="contained" onClick={handleOrder} disabled={ordering} sx={{ fontWeight: 700 }}>
            {ordering ? <CircularProgress size={20} color="inherit" /> : "주문 확정"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={2500} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} sx={{ bottom: 100 }}>
        <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
