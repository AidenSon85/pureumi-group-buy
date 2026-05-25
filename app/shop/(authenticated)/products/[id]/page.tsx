"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box, Typography, Button, Stack, Chip, Divider, IconButton,
  CircularProgress, Snackbar, Alert, Avatar, Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import ImageIcon from "@mui/icons-material/Image";
import { useCart } from "@/components/shop/CartContext";

interface Product {
  id: string; name: string; description: string | null; content: string | null;
  price: number; salePrice: number | null; unit: string; minQty: number; maxQty: number | null;
  stock: number; imageUrl: string | null; images: string[];
  isActive: boolean; category: { name: string } | null;
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
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setProduct(d);
        setQty(d.minQty || 1);
        setSelectedImg(d.imageUrl);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}><CircularProgress /></Box>;
  }
  if (!product) {
    return (
      <Box sx={{ py: 10, textAlign: "center" }}>
        <Typography color="text.secondary">제품을 찾을 수 없습니다</Typography>
        <Button sx={{ mt: 2 }} onClick={() => router.back()}>돌아가기</Button>
      </Box>
    );
  }

  const price = product.salePrice ?? product.price;
  const minQty = product.minQty || 1;
  const maxQty = Math.min(product.stock, product.maxQty ?? product.stock);

  const changeQty = (delta: number) => {
    setQty((q) => Math.max(minQty, Math.min(maxQty, q + delta)));
  };

  const handleAddToCart = () => {
    addItem({
      productId: product.id, name: product.name, price,
      imageUrl: product.imageUrl, quantity: qty,
      unit: product.unit, stock: product.stock, maxQty: product.maxQty,
    });
    setSnack(true);
  };

  const allImages = [product.imageUrl, ...product.images.filter((img) => img !== product.imageUrl)].filter(Boolean) as string[];

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push("/shop/products")} sx={{ color: "text.secondary" }}>
          목록으로
        </Button>
        <Button
          variant="outlined"
          startIcon={<ShoppingCartIcon />}
          onClick={() => router.push("/shop/cart")}
          sx={{ borderRadius: 8 }}
        >
          장바구니 ({count})
        </Button>
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 4 }}>
        {/* 이미지 */}
        <Box>
          <Box
            sx={{
              bgcolor: "#f5f5f5", borderRadius: 2, overflow: "hidden",
              height: 380, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {selectedImg ? (
              <Box component="img" src={selectedImg} alt={product.name} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <ImageIcon sx={{ fontSize: 96, color: "#ccc" }} />
            )}
          </Box>
          {allImages.length > 1 && (
            <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: "wrap" }}>
              {allImages.map((img, i) => (
                <Avatar
                  key={i}
                  src={img}
                  variant="rounded"
                  sx={{
                    width: 60, height: 60, cursor: "pointer",
                    border: selectedImg === img ? "2px solid #1976d2" : "2px solid transparent",
                    "&:hover": { border: "2px solid #1976d2" },
                  }}
                  onClick={() => setSelectedImg(img)}
                />
              ))}
            </Stack>
          )}
        </Box>

        {/* 정보 */}
        <Box>
          {product.category && (
            <Chip label={product.category.name} size="small" sx={{ mb: 1.5 }} />
          )}
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>{product.name}</Typography>
          {product.description && (
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>{product.description}</Typography>
          )}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ mb: 3 }}>
            {product.salePrice ? (
              <Stack spacing={0.5}>
                <Typography variant="caption" sx={{ color: "text.secondary", textDecoration: "line-through" }}>
                  정가 {formatWon(product.price)}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ alignItems: "baseline" }}>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: "error.main" }}>
                    {formatWon(product.salePrice)}
                  </Typography>
                  <Chip
                    label={`${Math.round((1 - product.salePrice / product.price) * 100)}% 할인`}
                    size="small" color="error" variant="outlined"
                  />
                </Stack>
              </Stack>
            ) : (
              <Typography variant="h4" sx={{ fontWeight: 800, color: "primary.main" }}>
                {formatWon(product.price)}
              </Typography>
            )}
            <Typography variant="body2" sx={{ color: product.stock < 10 && product.stock > 0 ? "warning.main" : "text.secondary", mt: 1 }}>
              재고: {product.stock}{product.unit}
              {product.stock === 0 && " (품절)"}
              {product.stock < 10 && product.stock > 0 && " (소량)"}
            </Typography>
          </Box>

          {/* 수량 조절 */}
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e0e0e0", borderRadius: 2, mb: 3 }}>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>
              수량 (최소 {minQty}{product.unit} / 최대 {maxQty}{product.unit})
            </Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <IconButton
                onClick={() => changeQty(-1)}
                disabled={qty <= minQty}
                sx={{ border: "1px solid #e0e0e0" }}
              >
                <RemoveIcon />
              </IconButton>
              <Typography variant="h6" sx={{ minWidth: 40, textAlign: "center", fontWeight: 700 }}>
                {qty}
              </Typography>
              <IconButton
                onClick={() => changeQty(1)}
                disabled={qty >= maxQty}
                sx={{ border: "1px solid #e0e0e0" }}
              >
                <AddIcon />
              </IconButton>
              <Typography variant="body2" sx={{ color: "text.secondary", ml: 1 }}>{product.unit}</Typography>
            </Stack>
            <Typography variant="body2" sx={{ mt: 1.5, color: "text.secondary" }}>
              소계: <strong style={{ color: "#1976d2", fontSize: 18 }}>{formatWon(price * qty)}</strong>
            </Typography>
          </Paper>

          <Stack spacing={1.5}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<AddShoppingCartIcon />}
              disabled={product.stock === 0}
              onClick={handleAddToCart}
              sx={{ py: 1.5, borderRadius: 8, fontSize: 16, fontWeight: 700 }}
            >
              {product.stock === 0 ? "품절" : "장바구니 담기"}
            </Button>
            <Button
              variant="outlined"
              size="large"
              fullWidth
              disabled={product.stock === 0}
              onClick={() => { handleAddToCart(); router.push("/shop/cart"); }}
              sx={{ py: 1.5, borderRadius: 8, fontSize: 16 }}
            >
              바로 구매
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* 상세 설명 */}
      {product.content && (
        <Paper elevation={0} sx={{ mt: 4, p: 3, border: "1px solid #e0e0e0", borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>제품 상세</Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
            {product.content}
          </Typography>
        </Paper>
      )}

      <Snackbar
        open={snack}
        autoHideDuration={2000}
        onClose={() => setSnack(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled">장바구니에 담았습니다</Alert>
      </Snackbar>
    </Box>
  );
}
