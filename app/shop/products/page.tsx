"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Box, Grid, Card, CardMedia, CardContent, CardActions, Typography, Button,
  TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem,
  Chip, Stack, Skeleton, Snackbar, Alert, Badge, Pagination, Avatar,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import ImageIcon from "@mui/icons-material/Image";
import { useCart } from "@/components/shop/CartContext";
import { useRouter } from "next/navigation";

interface Category { id: string; name: string }
interface Product {
  id: string; name: string; price: number; salePrice: number | null;
  stock: number; unit: string; isActive: boolean; imageUrl: string | null;
  description: string | null; minQty: number; maxQty: number | null;
  category: { id: string; name: string } | null;
}

const formatWon = (n: number) => `₩${n.toLocaleString()}`;
const PER_PAGE = 12;

export default function ShopProductsPage() {
  const { data: session } = useSession();
  const factoryId = (session?.user as any)?.factoryId || "";
  const router = useRouter();
  const { addItem, count } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [snack, setSnack] = useState<{ open: boolean; name: string }>({ open: false, name: "" });

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories).catch(() => {});
  }, []);

  const load = useCallback(() => {
    if (!factoryId) return;
    setLoading(true);
    const q = new URLSearchParams({
      page: String(page - 1), limit: String(PER_PAGE),
      factoryId, isActive: "true", search,
    });
    fetch(`/api/products?${q}`).then((r) => r.json()).then((d) => {
      setProducts(d.products || []);
      setTotal(d.total || 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [factoryId, page, search]);

  useEffect(() => { load(); }, [load]);

  const filtered = categoryId
    ? products.filter((p) => p.category?.id === categoryId)
    : products;

  const handleAddToCart = (p: Product) => {
    const price = p.salePrice ?? p.price;
    addItem({
      productId: p.id, name: p.name, price,
      imageUrl: p.imageUrl, quantity: p.minQty || 1,
      unit: p.unit, stock: p.stock, maxQty: p.maxQty,
    });
    setSnack({ open: true, name: p.name });
  };

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>제품 목록</Typography>
        <Button
          variant="outlined"
          startIcon={
            <Badge badgeContent={count} color="error" max={99}>
              <ShoppingCartIcon />
            </Badge>
          }
          onClick={() => router.push("/shop/cart")}
          sx={{ borderRadius: 8 }}
        >
          장바구니
        </Button>
      </Stack>

      {/* 검색 & 필터 */}
      <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder="제품명 검색"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          slotProps={{
            input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }
          }}
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

      {/* 제품 그리드 */}
      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 2 }} />
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
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
            전체 {total}개 제품
          </Typography>
          <Grid container spacing={2}>
            {filtered.map((p) => (
              <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Card
                  elevation={0}
                  sx={{
                    border: "1px solid #e8e8e8", borderRadius: 2, height: "100%",
                    display: "flex", flexDirection: "column",
                    transition: "box-shadow 0.2s",
                    "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.1)" },
                  }}
                >
                  <Box
                    sx={{ position: "relative", cursor: "pointer" }}
                    onClick={() => router.push(`/shop/products/${p.id}`)}
                  >
                    {p.imageUrl ? (
                      <CardMedia
                        component="img"
                        image={p.imageUrl}
                        alt={p.name}
                        sx={{ height: 180, objectFit: "cover" }}
                      />
                    ) : (
                      <Box sx={{ height: 180, bgcolor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ImageIcon sx={{ fontSize: 56, color: "#ccc" }} />
                      </Box>
                    )}
                    {p.salePrice && (
                      <Chip
                        label="SALE"
                        size="small"
                        color="error"
                        sx={{ position: "absolute", top: 8, left: 8, fontWeight: 700 }}
                      />
                    )}
                    {p.stock === 0 && (
                      <Box sx={{
                        position: "absolute", inset: 0, bgcolor: "rgba(0,0,0,0.45)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>품절</Typography>
                      </Box>
                    )}
                  </Box>

                  <CardContent sx={{ flex: 1, pb: 1 }}>
                    {p.category && (
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>{p.category.name}</Typography>
                    )}
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 700, mt: 0.5, cursor: "pointer", "&:hover": { color: "primary.main" } }}
                      onClick={() => router.push(`/shop/products/${p.id}`)}
                    >
                      {p.name}
                    </Typography>
                    {p.description && (
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                      >
                        {p.description}
                      </Typography>
                    )}
                    <Box sx={{ mt: 1 }}>
                      {p.salePrice ? (
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                          <Typography sx={{ fontWeight: 800, color: "error.main", fontSize: 16 }}>{formatWon(p.salePrice)}</Typography>
                          <Typography variant="caption" sx={{ color: "text.disabled", textDecoration: "line-through" }}>{formatWon(p.price)}</Typography>
                        </Stack>
                      ) : (
                        <Typography sx={{ fontWeight: 700, color: "primary.main", fontSize: 16 }}>{formatWon(p.price)}</Typography>
                      )}
                      <Typography variant="caption" sx={{ color: p.stock < 10 && p.stock > 0 ? "warning.main" : "text.secondary" }}>
                        재고 {p.stock}{p.unit}
                        {p.stock < 10 && p.stock > 0 && " (소량)"}
                      </Typography>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<AddShoppingCartIcon />}
                      disabled={p.stock === 0}
                      onClick={() => handleAddToCart(p)}
                      sx={{ borderRadius: 8, textTransform: "none" }}
                    >
                      {p.stock === 0 ? "품절" : "담기"}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          {total > PER_PAGE && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Pagination count={Math.ceil(total / PER_PAGE)} page={page} onChange={(_, p) => setPage(p)} color="primary" />
            </Box>
          )}
        </>
      )}

      <Snackbar
        open={snack.open}
        autoHideDuration={2000}
        onClose={() => setSnack({ open: false, name: "" })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled" sx={{ width: "100%" }}>
          <strong>{snack.name}</strong>을(를) 장바구니에 담았습니다
        </Alert>
      </Snackbar>
    </Box>
  );
}
