"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box, Typography, Button, Stack, Chip, Divider, IconButton,
  CircularProgress, Snackbar, Alert, Paper, Badge,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ImageIcon from "@mui/icons-material/Image";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { useCart } from "@/components/shop/CartContext";

interface Product {
  id: string; name: string; description: string | null; content: string | null;
  price: number; salePrice: number | null; unit: string; minQty: number; maxQty: number | null;
  stock: number; imageUrl: string | null; images: string[];
  isActive: boolean; category: { name: string } | null;
  pickupStartAt: string | null; groupBuyEndAt: string | null;
}

const formatWon = (n: number) => `₩${n.toLocaleString()}`;

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem, count } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [snack, setSnack] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setProduct(d);
        setQty(d.minQty || 1);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

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

  const handleAddToCart = () => {
    addItem({ productId: product.id, name: product.name, price, imageUrl: product.imageUrl, quantity: qty, unit: product.unit, stock: product.stock, maxQty: product.maxQty });
    setSnack(true);
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", pb: 14 }}>

      {/* 상단 네비 */}
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <IconButton onClick={() => router.push("/shop/products")} size="small">
          <ArrowBackIcon />
        </IconButton>
        <IconButton onClick={() => router.push("/shop/cart")} size="small">
          <Badge badgeContent={count} color="error" max={99}>
            <ShoppingCartIcon />
          </Badge>
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

        {/* 가격 */}
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
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 2, color: "text.secondary" }}>
          수량 선택
        </Typography>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
            <IconButton
              onClick={() => setQty((q) => Math.max(minQty, q - 1))}
              disabled={qty <= minQty}
              size="small"
              sx={{ border: "1.5px solid #e0e0e0", borderRadius: 1.5, width: 36, height: 36 }}
            >
              <RemoveIcon fontSize="small" />
            </IconButton>
            <Typography sx={{ fontWeight: 800, fontSize: 20, minWidth: 32, textAlign: "center" }}>
              {qty}
            </Typography>
            <IconButton
              onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
              disabled={qty >= maxQty}
              size="small"
              sx={{ border: "1.5px solid #e0e0e0", borderRadius: 1.5, width: 36, height: 36 }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>{product.unit}</Typography>
          </Stack>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>소계</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: 20, color: "primary.main" }}>
              {formatWon(price * qty)}
            </Typography>
          </Box>
        </Stack>
        <Typography variant="caption" sx={{ color: "text.disabled", mt: 1, display: "block" }}>
          최소 {minQty}{product.unit} / 최대 {maxQty}{product.unit}
        </Typography>
      </Paper>

      {/* 상세 내용 */}
      {product.content && (
        <Paper elevation={0} sx={{ border: "1px solid #f0f0f0", borderRadius: 2.5, p: 2.5, mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>제품 상세</Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.9, color: "text.secondary" }}>
            {product.content}
          </Typography>
        </Paper>
      )}

      {/* 이미지 전체 나열 */}
      {allImages.length > 1 && (
        <Paper elevation={0} sx={{ border: "1px solid #f0f0f0", borderRadius: 2.5, overflow: "hidden", mb: 2 }}>
          <Box sx={{ px: 2.5, py: 1.5, borderBottom: "1px solid #f0f0f0" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>상품 이미지 ({allImages.length}장)</Typography>
          </Box>
          <Stack spacing={0}>
            {allImages.map((img, i) => (
              <Box key={i} component="img" src={img} alt={`이미지 ${i + 1}`}
                sx={{ width: "100%", display: "block" }} />
            ))}
          </Stack>
        </Paper>
      )}

      {/* 하단 고정 버튼 */}
      <Box sx={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        bgcolor: "#fff", borderTop: "1px solid #f0f0f0",
        p: { xs: 2, sm: "16px max(16px, calc(50% - 284px))" },
        display: "flex", gap: 1.5,
      }}>
        <Button
          variant="outlined"
          size="large"
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          startIcon={<ShoppingCartIcon />}
          sx={{ flex: 1, py: 1.6, borderRadius: 2, fontWeight: 700, fontSize: 15, borderColor: "#1976d2" }}
        >
          장바구니 담기
        </Button>
        <Button
          variant="contained"
          size="large"
          onClick={() => { handleAddToCart(); router.push("/shop/cart"); }}
          disabled={product.stock === 0}
          sx={{ flex: 1, py: 1.6, borderRadius: 2, fontWeight: 700, fontSize: 15 }}
        >
          {product.stock === 0 ? "품절" : "바로 구매"}
        </Button>
      </Box>

      <Snackbar open={snack} autoHideDuration={2000} onClose={() => setSnack(false)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} sx={{ bottom: 100 }}>
        <Alert severity="success" variant="filled">장바구니에 담았습니다</Alert>
      </Snackbar>
    </Box>
  );
}
