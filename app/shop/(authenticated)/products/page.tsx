"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Box, Card, CardMedia, CardContent, CardActions, Typography, Button,
  TextField, InputAdornment, FormControl, Select, MenuItem,
  Chip, Stack, Skeleton, Snackbar, Alert, Pagination, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  ToggleButtonGroup, ToggleButton, Divider, Badge,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ImageIcon from "@mui/icons-material/Image";
import ViewListIcon from "@mui/icons-material/ViewList";
import GridViewIcon from "@mui/icons-material/GridView";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { useRouter } from "next/navigation";
import BannerSlider from "@/components/shop/BannerSlider";

interface Category { id: string; name: string }
interface Product {
  id: string; name: string; price: number; salePrice: number | null;
  stock: number; unit: string; isActive: boolean; imageUrl: string | null;
  description: string | null; minQty: number; maxQty: number | null;
  pickupStartAt: string | null; groupBuyEndAt: string | null;
  category: { id: string; name: string } | null;
}
interface Banner { id: string; imageUrl: string; linkUrl: string | null; title: string | null }

const formatWon = (n: number) => `${n.toLocaleString()}원`;
const PER_PAGE = 20;

function pickupLabel(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}월 ${d.getDate()}일(${days[d.getDay()]})`;
}
function pickupDateKey(iso: string | null) {
  if (!iso) return "미정";
  return new Date(iso).toISOString().slice(0, 10);
}

export default function ShopProductsPage() {
  const { data: session } = useSession();
  const factoryId = (session?.user as any)?.factoryId || "";
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [view, setView] = useState<"list" | "grid">("list");
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [phoneDigits, setPhoneDigits] = useState("");
  const [savedPhoneDigits, setSavedPhoneDigits] = useState<string | null>(null);
  const [savedUserName, setSavedUserName] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState("");
  const [ordering, setOrdering] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: "success" | "error" }>({ open: false, msg: "", severity: "success" });

  useEffect(() => {
    const saved = localStorage.getItem("shopProductView");
    if (saved === "list" || saved === "grid") setView(saved);
  }, []);

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

  useEffect(() => {
    if (!factoryId) return;
    fetch(`/api/banners?factoryId=${factoryId}`)
      .then((r) => r.json()).then((data) => setBanners(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [factoryId]);

  const load = useCallback(() => {
    if (!factoryId) { setLoading(false); return; }
    setLoading(true);
    const q = new URLSearchParams({ page: String(page - 1), limit: String(PER_PAGE), factoryId, isActive: "true", search });
    fetch(`/api/products?${q}`).then((r) => r.json()).then((d) => {
      const prods: Product[] = d.products || [];
      setProducts(prods);
      setTotal(d.total || 0);
      setQtys((prev) => {
        const next = { ...prev };
        prods.forEach((p) => { if (next[p.id] === undefined) next[p.id] = 0; });
        return next;
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [factoryId, page, search]);

  useEffect(() => { load(); }, [load]);

  // 날짜 탭
  const dateCounts = products.reduce<Record<string, number>>((acc, p) => {
    const key = pickupDateKey(p.pickupStartAt);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const dateKeys = Object.keys(dateCounts).sort();

  const filtered = products.filter((p) => {
    const matchCat = !categoryId || p.category?.id === categoryId;
    const matchDate = selectedDate === "all" || pickupDateKey(p.pickupStartAt) === selectedDate;
    return matchCat && matchDate;
  });

  // 장바구니 = qty > 0인 제품들
  const cartItems = products.filter((p) => (qtys[p.id] ?? 0) > 0);
  const cartTotal = cartItems.reduce((sum, p) => sum + (p.salePrice ?? p.price) * (qtys[p.id] ?? 0), 0);

  const getQty = (p: Product) => qtys[p.id] ?? 0;
  const setQty = (p: Product, v: number) => setQtys((prev) => ({ ...prev, [p.id]: Math.max(0, v) }));
  const maxQty = (p: Product) => Math.min(p.stock, p.maxQty ?? p.stock);
  const removeFromCart = (p: Product) => setQty(p, 0);

  const handleViewChange = (_: any, v: "list" | "grid" | null) => {
    if (!v) return;
    setView(v);
    localStorage.setItem("shopProductView", v);
  };

  const handleOrder = async () => {
    const cleaned = phoneDigits.trim();
    if (!/^\d{4}$/.test(cleaned)) { setPhoneError("전화번호 뒷 4자리를 숫자로 입력해주세요"); return; }
    if (cartItems.length === 0) return;
    setPhoneError("");
    setOrdering(true);
    try {
      const meRes = await fetch("/api/users/me").then((r) => r.json());
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems.map((p) => ({ productId: p.id, quantity: qtys[p.id] })),
        }),
      });
      if (!orderRes.ok) {
        const d = await orderRes.json();
        setSnack({ open: true, msg: d.error || "주문 실패", severity: "error" });
        return;
      }
      const order = await orderRes.json();
      // 각 제품마다 댓글 등록
      await Promise.all(cartItems.map((p) =>
        fetch(`/api/products/${p.id}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: meRes?.name || "고객",
            phoneDigits: cleaned,
            content: `${p.name} - ${qtys[p.id]}${p.unit}`,
            userId: meRes?.id || null,
            orderId: order.id,
          }),
        })
      ));
      await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `010-0000-${cleaned}` }),
      });
      setOrderDialogOpen(false);
      setMobileCartOpen(false);
      // 장바구니 초기화
      setQtys((prev) => {
        const next = { ...prev };
        cartItems.forEach((p) => { next[p.id] = 0; });
        return next;
      });
      setSnack({ open: true, msg: "주문이 완료되었습니다!", severity: "success" });
      setTimeout(() => router.push("/shop/orders"), 1200);
    } finally {
      setOrdering(false);
    }
  };

  // 장바구니 패널 컴포넌트
  const CartPanel = ({ compact = false }: { compact?: boolean }) => (
    <Box>
      {cartItems.length === 0 ? (
        <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
          <ShoppingCartIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
          <Typography variant="body2">담은 상품이 없습니다</Typography>
          <Typography variant="caption">담기 버튼을 눌러<br/>담아보세요</Typography>
        </Box>
      ) : (
        <Stack spacing={1}>
          {/* 데스크톱 전용 상단 주문 버튼 */}
          {!compact && (
            <Button
              variant="contained" fullWidth size="large"
              onClick={() => setOrderDialogOpen(true)}
              sx={{ borderRadius: 2, fontWeight: 700, fontSize: 14, bgcolor: "#1a237e", "&:hover": { bgcolor: "#283593" } }}
            >
              주문하기 ({cartItems.length}개 · {formatWon(cartTotal)})
            </Button>
          )}
          {!compact && <Divider />}
          {cartItems.map((p) => (
            <Box key={p.id} sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, bgcolor: "#f8f9fa", borderRadius: 1.5 }}>
              {p.imageUrl && (
                <Box sx={{ width: 40, height: 40, borderRadius: 1, overflow: "hidden", flexShrink: 0 }}>
                  <CardMedia component="img" image={p.imageUrl} alt={p.name} sx={{ width: 40, height: 40, objectFit: "cover" }} />
                </Box>
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" noWrap sx={{ fontWeight: 700, display: "block" }}>{p.name}</Typography>
                <Typography variant="caption" sx={{ color: p.salePrice ? "error.main" : "primary.main", fontWeight: 700 }}>
                  {formatWon((p.salePrice ?? p.price) * (qtys[p.id] ?? 0))}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", ml: 0.5 }}>({qtys[p.id]}{p.unit})</Typography>
              </Box>
              <IconButton size="small" onClick={() => removeFromCart(p)} sx={{ color: "text.disabled", flexShrink: 0 }}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
          <Divider />
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>합계</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: 16, color: "#1a237e" }}>{formatWon(cartTotal)}</Typography>
          </Stack>
        </Stack>
      )}
    </Box>
  );

  return (
    <Box sx={{ pb: cartItems.length > 0 ? { xs: 10, md: 0 } : 0 }}>
      {/* 배너 */}
      {banners.length > 0 && <Box sx={{ mb: 1.5 }}><BannerSlider banners={banners} /></Box>}

      {/* 날짜 탭 */}
      {dateKeys.length > 1 && (
        <Box sx={{ overflowX: "auto", mb: 1.5, mx: -2, px: 2, "&::-webkit-scrollbar": { display: "none" } }}>
          <Stack direction="row" spacing={1} sx={{ width: "max-content" }}>
            {[{ key: "all", label: "전체", count: products.length }, ...dateKeys.map((k) => ({ key: k, label: k === "미정" ? "미정" : pickupLabel(k + "T00:00:00") ?? k, count: dateCounts[k] }))].map(({ key, label, count }) => (
              <Box key={key} onClick={() => setSelectedDate(key)}
                sx={{ px: 2, py: 1, borderRadius: 2, cursor: "pointer", textAlign: "center", minWidth: 80,
                  bgcolor: selectedDate === key ? "#1a237e" : "#f5f5f5",
                  color: selectedDate === key ? "#fff" : "text.primary",
                  border: selectedDate === key ? "2px solid #1a237e" : "2px solid transparent" }}>
                <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{label}</Typography>
                <Typography sx={{ fontSize: 11, opacity: 0.8 }}>{count}개 상품</Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {/* 카테고리 + 검색 + 뷰 토글 */}
      <Stack direction="row" spacing={1} sx={{ mb: 1.5, alignItems: "center" }}>
        <FormControl size="small" sx={{ minWidth: 100, bgcolor: "#fff", flexShrink: 0 }}>
          <Select value={categoryId} displayEmpty onChange={(e) => setCategoryId(e.target.value)}
            renderValue={(v) => v ? (categories.find((c) => c.id === v)?.name ?? "카테고리") : "전체"}>
            <MenuItem value="">전체</MenuItem>
            {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField size="small" placeholder="제품명 검색" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
          sx={{ flex: 1, minWidth: 0, bgcolor: "#fff" }} />
        <ToggleButtonGroup value={view} exclusive onChange={handleViewChange} size="small" sx={{ bgcolor: "#fff", border: "1px solid #e0e0e0", borderRadius: 1, flexShrink: 0 }}>
          <ToggleButton value="list" sx={{ px: 1, py: 0.6, border: "none" }}><ViewListIcon fontSize="small" /></ToggleButton>
          <ToggleButton value="grid" sx={{ px: 1, py: 0.6, border: "none" }}><GridViewIcon fontSize="small" /></ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* 메인: 제품목록 + 오른쪽 장바구니 */}
      <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
        {/* 제품 목록 */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <Stack spacing={0}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Box key={i} sx={{ borderBottom: "1px solid #f0f0f0" }}>
                  <Stack direction="row" spacing={1.5} sx={{ p: 2 }}>
                    <Skeleton variant="rectangular" width={90} height={90} sx={{ borderRadius: 1, flexShrink: 0 }} />
                    <Box sx={{ flex: 1 }}><Skeleton height={20} /><Skeleton height={16} width="60%" /><Skeleton height={16} width="40%" /></Box>
                  </Stack>
                  <Skeleton variant="rectangular" height={36} sx={{ mx: 2, mb: 2, borderRadius: 1 }} />
                </Box>
              ))}
            </Stack>
          ) : filtered.length === 0 ? (
            <Box sx={{ py: 10, textAlign: "center", color: "text.secondary" }}>
              <ImageIcon sx={{ fontSize: 64, opacity: 0.2, mb: 2 }} />
              <Typography>판매 중인 제품이 없습니다</Typography>
            </Box>
          ) : view === "list" ? (
            /* 리스트 뷰 */
            <Box sx={{ bgcolor: "#fff", border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden" }}>
              {filtered.map((p, idx) => {
                const price = p.salePrice ?? p.price;
                const qty = getQty(p);
                const max = maxQty(p);
                const soldOut = p.stock === 0;
                return (
                  <Box key={p.id} sx={{ borderBottom: idx < filtered.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                    <Stack direction="row" spacing={1.5} sx={{ p: 2, alignItems: "flex-start" }}>
                      <Box onClick={() => router.push(`/shop/products/${p.id}`)}
                        sx={{ flexShrink: 0, width: 90, height: 90, borderRadius: 1.5, overflow: "hidden", bgcolor: "#f5f5f5", cursor: "pointer" }}>
                        {p.imageUrl
                          ? <CardMedia component="img" image={p.imageUrl} alt={p.name} sx={{ width: 90, height: 90, objectFit: "cover", opacity: soldOut ? 0.5 : 1 }} />
                          : <Box sx={{ width: 90, height: 90, display: "flex", alignItems: "center", justifyContent: "center" }}><ImageIcon sx={{ fontSize: 32, color: "#ccc" }} /></Box>}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            {p.category && <Typography sx={{ fontSize: 11, color: "text.secondary", mb: 0.3 }}>{p.category.name}</Typography>}
                            <Typography sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.4, color: soldOut ? "text.disabled" : "text.primary", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                              onClick={() => router.push(`/shop/products/${p.id}`)} style={{ cursor: "pointer" }}>
                              {p.name}
                            </Typography>
                          </Box>
                          {soldOut && <Chip label="품절" size="small" sx={{ fontSize: 11, height: 22, bgcolor: "#eee", color: "text.secondary", flexShrink: 0 }} />}
                        </Stack>
                        <Typography sx={{ fontWeight: 800, fontSize: 15, color: p.salePrice ? "error.main" : "primary.main", mt: 0.8 }}>
                          {formatWon(price)}
                          {p.salePrice && (
                            <Typography component="span" sx={{ fontWeight: 400, fontSize: 12, color: "text.disabled", textDecoration: "line-through", ml: 0.8 }}>
                              {formatWon(p.price)}
                            </Typography>
                          )}
                        </Typography>
                        {!soldOut && (
                          <Typography sx={{
                            fontSize: 12, mt: 0.3,
                            color: p.stock <= 10 ? "error.main" : p.stock <= 30 ? "#e65100" : "text.disabled",
                            fontWeight: p.stock <= 30 ? 600 : 400,
                          }}>
                            재고 {p.stock}{p.unit}{p.stock <= 30 ? " 남았어요!" : ""}
                          </Typography>
                        )}
                        {!p.groupBuyEndAt ? (
                          <Chip label="상시판매" size="small" color="info" sx={{ mt: 0.5, height: 20, fontSize: 11, fontWeight: 700 }} />
                        ) : p.pickupStartAt ? (
                          <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.3 }}>픽업 {pickupLabel(p.pickupStartAt)} 가능</Typography>
                        ) : null}
                      </Box>
                    </Stack>
                    {/* 하단: 상세보기 + 수량 */}
                    <Divider />
                    <Stack direction="row" spacing={1} sx={{ px: 2, py: 1.5, alignItems: "center" }}>
                      <Button variant="outlined" size="small" onClick={() => router.push(`/shop/products/${p.id}`)}
                        sx={{ flex: 1, borderRadius: 2, textTransform: "none", fontWeight: 600, fontSize: 13, color: "text.primary", borderColor: "#ddd", "&:hover": { borderColor: "#bbb", bgcolor: "#fafafa" } }}>
                        상세보기
                      </Button>
                      <Stack direction="row" sx={{ alignItems: "center", border: "1px solid #ddd", borderRadius: 2, overflow: "hidden", flexShrink: 0 }}>
                        <IconButton size="small" onClick={() => setQty(p, qty - 1)} disabled={qty <= 0 || soldOut} sx={{ borderRadius: 0, width: 34, height: 34 }}>
                          <RemoveIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                        <Typography sx={{ fontWeight: 700, fontSize: 13, minWidth: 40, textAlign: "center" }}>
                          {qty}{p.unit}
                        </Typography>
                        <IconButton size="small" onClick={() => setQty(p, qty + 1)} disabled={qty >= max || soldOut} sx={{ borderRadius: 0, width: 34, height: 34 }}>
                          <AddIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Box>
                );
              })}
            </Box>
          ) : (
            /* 카드(그리드) 뷰 */
            <Box sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr", md: "1fr 1fr 1fr 1fr" },
              gap: { xs: 1.5, sm: 2 },
            }}>
              {filtered.map((p) => {
                const qty = getQty(p);
                const max = maxQty(p);
                const soldOut = p.stock === 0;
                const inCart = qty > 0;
                return (
                  <Box key={p.id} sx={{
                    border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden",
                    bgcolor: "#fff", display: "flex", flexDirection: "column",
                    "&:hover": { boxShadow: 2, borderColor: "#bbb" },
                  }}>
                    {/* 이미지 - 4:3 비율 */}
                    <Box
                      sx={{ position: "relative", cursor: "pointer", aspectRatio: "4/3", overflow: "hidden", bgcolor: "#f5f5f5", flexShrink: 0 }}
                      onClick={() => router.push(`/shop/products/${p.id}`)}
                    >
                      {p.imageUrl
                        ? <Box component="img" src={p.imageUrl} alt={p.name} sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: soldOut ? 0.5 : 1 }} />
                        : <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><ImageIcon sx={{ fontSize: { xs: 32, sm: 40 }, color: "#ccc" }} /></Box>}
                      {p.salePrice && <Chip label="SALE" size="small" color="error" sx={{ position: "absolute", top: 6, left: 6, fontWeight: 700, height: 18, fontSize: 11 }} />}
                      {soldOut && (
                        <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>품절</Typography>
                        </Box>
                      )}
                    </Box>

                    {/* 콘텐츠 */}
                    <Box sx={{ px: { xs: 1, sm: 1.25 }, pt: 1, pb: 1.25, flex: 1, display: "flex", flexDirection: "column" }}>
                      {/* 카테고리 */}
                      {p.category && (
                        <Typography sx={{ fontSize: 10, color: "text.secondary", mb: 0.3, lineHeight: 1.4 }}>{p.category.name}</Typography>
                      )}
                      {/* 제품명 */}
                      <Typography sx={{
                        fontWeight: 700, fontSize: { xs: 12, sm: 13 }, lineHeight: 1.4, mb: 0.5,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                        cursor: "pointer",
                      }} onClick={() => router.push(`/shop/products/${p.id}`)}>
                        {p.name}
                      </Typography>

                      {/* 픽업일 / 상시판매 */}
                      {!p.groupBuyEndAt ? (
                        <Typography sx={{ fontSize: 10, color: "info.main", fontWeight: 700, mb: 0.3 }}>상시판매</Typography>
                      ) : p.pickupStartAt ? (
                        <Typography sx={{ fontSize: 10, color: "text.secondary", mb: 0.3 }}>픽업 {pickupLabel(p.pickupStartAt)}</Typography>
                      ) : null}

                      {/* 가격 + 수량 — 하단 정렬 */}
                      <Box sx={{ mt: "auto", pt: 0.5 }}>
                        {p.salePrice ? (
                          <>
                            <Typography sx={{ fontWeight: 800, color: "error.main", fontSize: { xs: 13, sm: 15 }, lineHeight: 1.2 }}>
                              {formatWon(p.salePrice)}
                            </Typography>
                            <Typography sx={{ color: "text.disabled", fontSize: 11, textDecoration: "line-through", lineHeight: 1.4 }}>
                              {formatWon(p.price)}
                            </Typography>
                          </>
                        ) : (
                          <Typography sx={{ fontWeight: 800, color: "#1a237e", fontSize: { xs: 13, sm: 15 }, lineHeight: 1.2 }}>
                            {formatWon(p.price)}
                          </Typography>
                        )}

                        {/* 재고 수량 */}
                        {!soldOut && (
                          <Typography sx={{
                            fontSize: 10, mt: 0.3,
                            color: p.stock <= 10 ? "error.main" : p.stock <= 30 ? "#e65100" : "text.disabled",
                            fontWeight: p.stock <= 30 ? 600 : 400,
                          }}>
                            재고 {p.stock}{p.unit}{p.stock <= 30 ? " 남았어요!" : ""}
                          </Typography>
                        )}

                        {/* 구분선 */}
                        <Divider sx={{ my: 1 }} />

                        {/* 수량 + 담기 */}
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                          <Stack direction="row" sx={{ flex: 1, alignItems: "center", border: "1px solid #e0e0e0", borderRadius: 1.5, overflow: "hidden" }}>
                            <IconButton size="small" onClick={() => setQty(p, qty - 1)} disabled={qty <= 0 || soldOut} sx={{ borderRadius: 0, width: 26, height: 28 }}>
                              <RemoveIcon sx={{ fontSize: 11 }} />
                            </IconButton>
                            <Typography sx={{ flex: 1, fontWeight: 700, textAlign: "center", fontSize: 11 }}>{qty}{p.unit}</Typography>
                            <IconButton size="small" onClick={() => setQty(p, qty + 1)} disabled={qty >= max || soldOut} sx={{ borderRadius: 0, width: 26, height: 28 }}>
                              <AddIcon sx={{ fontSize: 11 }} />
                            </IconButton>
                          </Stack>
                          <Button
                            size="small" variant={inCart ? "contained" : "outlined"} disabled={soldOut}
                            onClick={() => { if (!inCart) setQty(p, p.minQty || 1); }}
                            sx={{
                              flexShrink: 0, minWidth: 40, height: 28, borderRadius: 1.5, fontSize: 11, fontWeight: 700, textTransform: "none", px: 0.75,
                              ...(inCart
                                ? { bgcolor: "#1a237e", color: "#fff", "&:hover": { bgcolor: "#283593" } }
                                : { borderColor: "#1a237e", color: "#1a237e", "&:hover": { bgcolor: "#e8eaf6" } }),
                            }}
                          >
                            {soldOut ? "품절" : inCart ? "담김" : "담기"}
                          </Button>
                        </Stack>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}

          {total > PER_PAGE && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <Pagination count={Math.ceil(total / PER_PAGE)} page={page} onChange={(_, p) => setPage(p)} color="primary" size="small" />
            </Box>
          )}
        </Box>

        {/* 오른쪽 장바구니 (데스크탑) */}
        <Box sx={{ display: { xs: "none", md: "block" }, width: 260, flexShrink: 0 }}>
          <Box sx={{ position: "sticky", top: 80, border: "1px solid #e0e0e0", borderRadius: 2, bgcolor: "#fff", p: 2 }}>
            <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 2 }}>
              <ShoppingCartIcon sx={{ fontSize: 20, color: "#1a237e" }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>선택 목록</Typography>
              {cartItems.length > 0 && <Chip label={cartItems.length} size="small" sx={{ bgcolor: "#1a237e", color: "#fff", height: 20, fontSize: 11, ml: "auto" }} />}
            </Stack>
            <CartPanel />
          </Box>
        </Box>
      </Stack>

      {/* 모바일 플로팅 장바구니 버튼 */}
      {cartItems.length > 0 && (
        <Box sx={{ display: { xs: "flex", md: "none" }, position: "fixed", bottom: 20, right: 20, zIndex: 1200 }}>
          <Badge badgeContent={cartItems.length} color="error">
            <Button
              variant="contained" onClick={() => setMobileCartOpen(true)}
              sx={{ borderRadius: "50%", minWidth: 56, height: 56, p: 0, bgcolor: "#1a237e", boxShadow: 4 }}>
              <ShoppingCartIcon />
            </Button>
          </Badge>
        </Box>
      )}

      {/* 모바일 장바구니 패널 */}
      <Dialog open={mobileCartOpen} onClose={() => setMobileCartOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pb: 1 }}>
          <ShoppingCartIcon sx={{ color: "#1a237e", fontSize: 22 }} />
          <Typography sx={{ fontWeight: 700, fontSize: 17, flex: 1 }}>선택 목록</Typography>
          <IconButton size="small" onClick={() => setMobileCartOpen(false)} sx={{ color: "text.secondary" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}><CartPanel compact /></DialogContent>
        {cartItems.length > 0 && (
          <DialogActions sx={{ px: 2, pb: 2, pt: 0 }}>
            <Button
              variant="contained" fullWidth size="large"
              onClick={() => { setMobileCartOpen(false); setOrderDialogOpen(true); }}
              sx={{ borderRadius: 2, fontWeight: 700, fontSize: 15, bgcolor: "#1a237e", "&:hover": { bgcolor: "#283593" }, py: 1.5 }}
            >
              주문하기 ({cartItems.length}개 · {formatWon(cartTotal)})
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* 주문 확인 다이얼로그 */}
      <Dialog open={orderDialogOpen} onClose={() => !ordering && setOrderDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>주문 확인</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Box sx={{ p: 1.5, bgcolor: "#f8f9fa", borderRadius: 2 }}>
              {cartItems.map((p) => (
                <Typography key={p.id} variant="body2" sx={{ py: 0.3 }}>
                  {p.name} <Typography component="span" sx={{ color: "text.secondary" }}>× {qtys[p.id]}{p.unit}</Typography>
                  <Typography component="span" sx={{ float: "right", fontWeight: 700 }}>{formatWon((p.salePrice ?? p.price) * qtys[p.id])}</Typography>
                </Typography>
              ))}
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2" sx={{ fontWeight: 800, textAlign: "right", color: "#1a237e" }}>합계 {formatWon(cartTotal)}</Typography>
            </Box>
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
                label="전화번호 뒷 4자리" value={phoneDigits}
                onChange={(e) => { setPhoneDigits(e.target.value.replace(/\D/g, "").slice(0, 4)); setPhoneError(""); }}
                error={!!phoneError} helperText={phoneError || "구매 내역에 표시됩니다"}
                slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 4 } }}
                fullWidth size="small"
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOrderDialogOpen(false)} disabled={ordering}>취소</Button>
          <Button variant="contained" onClick={handleOrder} disabled={ordering}
            sx={{ fontWeight: 700, bgcolor: "#1a237e", "&:hover": { bgcolor: "#283593" } }}>
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
