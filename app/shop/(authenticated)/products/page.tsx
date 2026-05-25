"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Box, Grid, Card, CardMedia, CardContent, CardActions, Typography, Button,
  TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem,
  Chip, Stack, Skeleton, Snackbar, Alert, Pagination, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ImageIcon from "@mui/icons-material/Image";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { useRouter } from "next/navigation";

interface Category { id: string; name: string }
interface Product {
  id: string; name: string; price: number; salePrice: number | null;
  stock: number; unit: string; isActive: boolean; imageUrl: string | null;
  description: string | null; minQty: number; maxQty: number | null;
  pickupStartAt: string | null;
  category: { id: string; name: string } | null;
}

const formatWon = (n: number) => `₩${n.toLocaleString()}`;
const PER_PAGE = 12;

export default function ShopProductsPage() {
  const { data: session } = useSession();
  const factoryId = (session?.user as any)?.factoryId || "";
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [qtys, setQtys] = useState<Record<string, number>>({});

  const [dialogProduct, setDialogProduct] = useState<Product | null>(null);
  const [phoneDigits, setPhoneDigits] = useState("");
  const [savedPhoneDigits, setSavedPhoneDigits] = useState<string | null>(null);
  const [savedUserName, setSavedUserName] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState("");
  const [ordering, setOrdering] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: "success" | "error" }>({ open: false, msg: "", severity: "success" });

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories).catch(() => {});
    fetch("/api/users/me").then((r) => r.json()).then((u) => {
      if (u?.phone) {
        const d = u.phone.replace(/\D/g, "").slice(-4);
        setPhoneDigits(d);
        setSavedPhoneDigits(d);
      }
      if (u?.name) setSavedUserName(u.name);
    }).catch(() => {});
  }, []);

  const load = useCallback(() => {
    if (!factoryId) return;
    setLoading(true);
    const q = new URLSearchParams({ page: String(page - 1), limit: String(PER_PAGE), factoryId, isActive: "true", search });
    fetch(`/api/products?${q}`).then((r) => r.json()).then((d) => {
      const prods: Product[] = d.products || [];
      setProducts(prods);
      setTotal(d.total || 0);
      setQtys((prev) => {
        const next = { ...prev };
        prods.forEach((p) => { if (!next[p.id]) next[p.id] = p.minQty || 1; });
        return next;
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [factoryId, page, search]);

  useEffect(() => { load(); }, [load]);

  const filtered = categoryId ? products.filter((p) => p.category?.id === categoryId) : products;

  const getQty = (p: Product) => qtys[p.id] ?? (p.minQty || 1);
  const setQty = (p: Product, v: number) => setQtys((prev) => ({ ...prev, [p.id]: v }));
  const maxQty = (p: Product) => Math.min(p.stock, p.maxQty ?? p.stock);

  const handleOrder = async () => {
    if (!dialogProduct) return;
    const cleaned = phoneDigits.trim();
    if (!/^\d{4}$/.test(cleaned)) { setPhoneError("전화번호 뒷 4자리를 숫자로 입력해주세요"); return; }
    setPhoneError("");
    setOrdering(true);
    const qty = getQty(dialogProduct);
    try {
      const meRes = await fetch("/api/users/me").then((r) => r.json());
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ productId: dialogProduct.id, quantity: qty }] }),
      });
      if (!orderRes.ok) {
        const d = await orderRes.json();
        setSnack({ open: true, msg: d.error || "주문 실패", severity: "error" });
        return;
      }
      const order = await orderRes.json();
      await fetch(`/api/products/${dialogProduct.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: meRes?.name || "고객",
          phoneDigits: cleaned,
          content: `${dialogProduct.name} - ${qty}${dialogProduct.unit}`,
          userId: meRes?.id || null,
          orderId: order.id,
        }),
      });
      await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `010-0000-${cleaned}` }),
      });
      setDialogProduct(null);
      setSnack({ open: true, msg: "주문이 완료되었습니다!", severity: "success" });
      setTimeout(() => router.push("/shop/orders"), 1200);
    } finally {
      setOrdering(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>제품 목록</Typography>
        <Button variant="outlined" startIcon={<ReceiptLongIcon />} onClick={() => router.push("/shop/orders")}
          sx={{ borderRadius: 8, textTransform: "none" }}>
          주문 조회
        </Button>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: "wrap" }}>
        <TextField
          size="small" placeholder="제품명 검색" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
          sx={{ width: 280, bgcolor: "#fff" }}
        />
        <FormControl size="small" sx={{ minWidth: 160, bgcolor: "#fff" }}>
          <InputLabel>카테고리</InputLabel>
          <Select value={categoryId} label="카테고리" onChange={(e) => setCategoryId(e.target.value)}>
            <MenuItem value="">전체</MenuItem>
            {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>

      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Skeleton variant="rectangular" height={360} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      ) : filtered.length === 0 ? (
        <Box sx={{ py: 10, textAlign: "center", color: "text.secondary" }}>
          <ImageIcon sx={{ fontSize: 64, opacity: 0.2, mb: 2 }} />
          <Typography>판매 중인 제품이 없습니다</Typography>
        </Box>
      ) : (
        <>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>전체 {total}개 제품</Typography>
          <Grid container spacing={2}>
            {filtered.map((p) => {
              const price = p.salePrice ?? p.price;
              const qty = getQty(p);
              const max = maxQty(p);
              const min = p.minQty || 1;
              return (
                <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <Card elevation={0} sx={{ border: "1px solid #e8e8e8", borderRadius: 2, height: "100%", display: "flex", flexDirection: "column", transition: "box-shadow 0.2s", "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.1)" } }}>
                    <Box sx={{ position: "relative", cursor: "pointer", height: 180, overflow: "hidden" }} onClick={() => router.push(`/shop/products/${p.id}`)}>
                      {p.imageUrl ? (
                        <CardMedia component="img" image={p.imageUrl} alt={p.name} sx={{ width: "100%", height: 180, objectFit: "cover" }} />
                      ) : (
                        <Box sx={{ height: 180, bgcolor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <ImageIcon sx={{ fontSize: 56, color: "#ccc" }} />
                        </Box>
                      )}
                      {p.salePrice && <Chip label="SALE" size="small" color="error" sx={{ position: "absolute", top: 8, left: 8, fontWeight: 700 }} />}
                      {p.stock === 0 && (
                        <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>품절</Typography>
                        </Box>
                      )}
                    </Box>

                    <CardContent sx={{ flex: 1, pb: 1, display: "flex", flexDirection: "column", gap: 0 }}>
                      {/* 구역 1: 카테고리 + 픽업일 */}
                      <Box sx={{ pb: 1, borderBottom: "1px solid #f0f0f0" }}>
                        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>{p.category?.name || ""}</Typography>
                          <Typography variant="caption" sx={{ color: p.pickupStartAt ? "primary.main" : "text.disabled", fontWeight: p.pickupStartAt ? 600 : 400 }}>
                            {p.pickupStartAt
                              ? `픽업 ${new Date(p.pickupStartAt).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}~`
                              : "픽업일 미정"}
                          </Typography>
                        </Stack>
                      </Box>

                      {/* 구역 2: 제품명 + 설명 */}
                      <Box sx={{ py: 1.5, borderBottom: "1px solid #f0f0f0", flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, cursor: "pointer", "&:hover": { color: "primary.main" }, mb: 0.5 }} onClick={() => router.push(`/shop/products/${p.id}`)}>
                          {p.name}
                        </Typography>
                        {p.description && (
                          <Typography variant="caption" sx={{ color: "text.secondary", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {p.description}
                          </Typography>
                        )}
                      </Box>

                      {/* 구역 3: 가격 + 재고 */}
                      <Box sx={{ pt: 1.5 }}>
                        {p.salePrice ? (
                          <>
                            <Typography variant="caption" sx={{ color: "text.disabled", textDecoration: "line-through", display: "block" }}>{formatWon(p.price)}</Typography>
                            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                              <Typography sx={{ fontWeight: 900, color: "error.main", fontSize: 22, lineHeight: 1.2 }}>{formatWon(p.salePrice)}</Typography>
                              <Chip label={`${Math.round((1 - p.salePrice / p.price) * 100)}%`} size="small"
                                sx={{ bgcolor: "#e53935", color: "#fff", fontWeight: 800, fontSize: 11, height: 20 }} />
                            </Stack>
                          </>
                        ) : (
                          <Typography sx={{ fontWeight: 900, color: "primary.main", fontSize: 22, lineHeight: 1.2 }}>{formatWon(p.price)}</Typography>
                        )}
                        <Typography variant="caption" sx={{ color: p.stock < 10 && p.stock > 0 ? "warning.main" : "text.secondary" }}>
                          재고 {p.stock}{p.unit}{p.stock < 10 && p.stock > 0 && " (소량)"}
                        </Typography>
                      </Box>
                    </CardContent>

                    <CardActions sx={{ pt: 0, px: 2, pb: 2, flexDirection: "column", gap: 1 }}>
                      {/* 수량 선택 */}
                      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                        <Stack direction="row" sx={{ alignItems: "center", gap: 0.5 }}>
                          <IconButton size="small" onClick={() => setQty(p, Math.max(min, qty - 1))} disabled={qty <= min || p.stock === 0}
                            sx={{ border: "1px solid #e0e0e0", width: 28, height: 28 }}>
                            <RemoveIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                          <Typography sx={{ fontWeight: 700, minWidth: 28, textAlign: "center", fontSize: 15 }}>{qty}</Typography>
                          <IconButton size="small" onClick={() => setQty(p, Math.min(max, qty + 1))} disabled={qty >= max || p.stock === 0}
                            sx={{ border: "1px solid #e0e0e0", width: 28, height: 28 }}>
                            <AddIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                          <Typography variant="caption" sx={{ color: "text.secondary", ml: 0.5 }}>{p.unit}</Typography>
                        </Stack>
                        <Typography sx={{ fontWeight: 800, fontSize: 15, color: "primary.main" }}>{formatWon(price * qty)}</Typography>
                      </Stack>
                      {/* 바로 구매 버튼 */}
                      <Button variant="contained" fullWidth disabled={p.stock === 0}
                        onClick={() => setDialogProduct(p)}
                        sx={{ borderRadius: 8, textTransform: "none", fontWeight: 700 }}>
                        {p.stock === 0 ? "품절" : "바로 구매"}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
          {total > PER_PAGE && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Pagination count={Math.ceil(total / PER_PAGE)} page={page} onChange={(_, p) => setPage(p)} color="primary" />
            </Box>
          )}
        </>
      )}

      {/* 주문 확인 다이얼로그 */}
      <Dialog open={!!dialogProduct} onClose={() => !ordering && setDialogProduct(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>주문하기</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {dialogProduct && (
              <Box sx={{ p: 1.5, bgcolor: "#f8f9fa", borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{dialogProduct.name}</Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {getQty(dialogProduct)}{dialogProduct.unit} × {formatWon(dialogProduct.salePrice ?? dialogProduct.price)} = <strong>{formatWon((dialogProduct.salePrice ?? dialogProduct.price) * getQty(dialogProduct))}</strong>
                </Typography>
                {dialogProduct.pickupStartAt && (
                  <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 600, display: "block", mt: 0.5 }}>
                    픽업 {new Date(dialogProduct.pickupStartAt).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}~
                  </Typography>
                )}
              </Box>
            )}
            {savedPhoneDigits ? (
              <Box sx={{ p: 1.5, bgcolor: "#f0f4ff", borderRadius: 2, border: "1px solid #c5cae9" }}>
                <Stack direction="row" spacing={3}>
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>이름</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{savedUserName || "고객"}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>전화번호</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>***-****-{savedPhoneDigits}</Typography>
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
          <Button onClick={() => setDialogProduct(null)} disabled={ordering}>취소</Button>
          <Button variant="contained" onClick={handleOrder} disabled={ordering} sx={{ fontWeight: 700 }}>
            {ordering ? <CircularProgress size={20} color="inherit" /> : "주문 확정"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={2500} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
