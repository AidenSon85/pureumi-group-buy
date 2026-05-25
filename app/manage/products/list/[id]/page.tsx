"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Paper, Typography, Chip, Stack, CircularProgress, Button,
  Divider, Grid, IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import ImageIcon from "@mui/icons-material/Image";
import StoreIcon from "@mui/icons-material/Store";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import InventoryIcon from "@mui/icons-material/Inventory";

interface Product {
  id: string; name: string; description: string | null; content: string | null;
  price: number; salePrice: number | null; unit: string; stock: number;
  imageUrl: string | null; images: string[]; isActive: boolean;
  factoryIds: string[]; groupBuyStartAt: string | null; groupBuyEndAt: string | null;
  factory: { id: string; name: string };
  category: { id: string; name: string } | null;
  createdAt: string;
}
interface Factory { id: string; name: string }

const formatWon = (n: number) => `₩${n.toLocaleString()}`;
const formatDate = (s: string) => new Date(s).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/products/${id}`).then((r) => r.json()),
      fetch("/api/factories").then((r) => r.json()),
    ]).then(([p, f]) => {
      setProduct(p);
      setFactories(f);
      const allImages = p.images?.length > 0 ? p.images : (p.imageUrl ? [p.imageUrl] : []);
      setMainImage(p.imageUrl || allImages[0] || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}><CircularProgress /></Box>;
  }
  if (!product) {
    return (
      <Box sx={{ py: 8, textAlign: "center" }}>
        <Typography color="text.secondary">제품을 찾을 수 없습니다</Typography>
        <Button sx={{ mt: 2 }} onClick={() => router.back()}>돌아가기</Button>
      </Box>
    );
  }

  const allImages = product.images?.length > 0
    ? product.images
    : (product.imageUrl ? [product.imageUrl] : []);

  const factoryNames = product.factoryIds.length > 0
    ? product.factoryIds.map((fid) => factories.find((f) => f.id === fid)?.name || fid)
    : [product.factory.name];

  return (
    <Box>
      {/* 상단 헤더 */}
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()} variant="text">
          목록으로
        </Button>
        <Button
          variant="contained" startIcon={<EditIcon />}
          onClick={() => router.push("/manage/products")}
        >
          수정하기
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {/* 좌측: 이미지 */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={0} sx={{ border: "1px solid #e0e0e0", overflow: "hidden", borderRadius: 2 }}>
            {/* 메인 이미지 */}
            <Box sx={{ width: "100%", aspectRatio: "1", bgcolor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {mainImage ? (
                <Box component="img" src={mainImage} alt={product.name}
                  sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <ImageIcon sx={{ fontSize: 80, color: "#ccc" }} />
              )}
            </Box>

            {/* 썸네일 목록 */}
            {allImages.length > 1 && (
              <Box sx={{ p: 1.5, display: "flex", gap: 1, flexWrap: "wrap", borderTop: "1px solid #e0e0e0" }}>
                {allImages.map((url, i) => (
                  <Box
                    key={i}
                    onClick={() => setMainImage(url)}
                    sx={{
                      width: 64, height: 64, borderRadius: 1, overflow: "hidden", cursor: "pointer",
                      border: mainImage === url ? "2px solid #1976d2" : "2px solid #e0e0e0",
                      flexShrink: 0,
                    }}
                  >
                    <Box component="img" src={url} alt={`이미지 ${i + 1}`}
                      sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* 우측: 기본 정보 */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={0} sx={{ border: "1px solid #e0e0e0", p: 3, borderRadius: 2, height: "100%" }}>
            {/* 상태 + 카테고리 */}
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Chip
                label={product.isActive ? "판매중" : "판매중지"}
                color={product.isActive ? "success" : "default"}
                size="small"
              />
              {product.category && (
                <Chip label={product.category.name} size="small" variant="outlined" />
              )}
            </Stack>

            {/* 제품명 */}
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, lineHeight: 1.4 }}>
              {product.name}
            </Typography>

            {/* 가격 */}
            <Box sx={{ mb: 2.5 }}>
              {product.salePrice ? (
                <Stack direction="row" sx={{ alignItems: "baseline" }} spacing={1.5}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: "error.main" }}>
                    {formatWon(product.salePrice)}
                  </Typography>
                  <Typography variant="body1" sx={{ color: "text.secondary", textDecoration: "line-through" }}>
                    {formatWon(product.price)}
                  </Typography>
                  <Chip
                    label={`${Math.round((1 - product.salePrice / product.price) * 100)}% 할인`}
                    size="small" color="error" variant="outlined"
                  />
                </Stack>
              ) : (
                <Typography variant="h4" sx={{ fontWeight: 700, color: "primary.main" }}>
                  {formatWon(product.price)}
                </Typography>
              )}
            </Box>

            <Divider sx={{ mb: 2.5 }} />

            {/* 상세 정보 목록 */}
            <Stack spacing={1.5}>
              <Stack direction="row" sx={{ alignItems: "flex-start", gap: 1.5 }}>
                <StoreIcon fontSize="small" sx={{ color: "text.secondary", mt: 0.3, flexShrink: 0 }} />
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>소속 매장</Typography>
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                    {factoryNames.map((name, i) => (
                      <Chip key={i} label={name} size="small" color="primary" variant="outlined" />
                    ))}
                  </Stack>
                </Box>
              </Stack>

              <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
                <InventoryIcon fontSize="small" sx={{ color: "text.secondary", flexShrink: 0 }} />
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>재고</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: product.stock < 10 ? "error.main" : "text.primary" }}>
                    {product.stock} {product.unit}
                  </Typography>
                </Box>
              </Stack>

              {product.groupBuyStartAt && (
                <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
                  <CalendarTodayIcon fontSize="small" sx={{ color: "text.secondary", flexShrink: 0 }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>공구 일정</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>
                      {formatDate(product.groupBuyStartAt)}
                      {product.groupBuyEndAt && ` ~ ${formatDate(product.groupBuyEndAt)}`}
                    </Typography>
                  </Box>
                </Stack>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* 제품 요약 설명 */}
      {product.description && (
        <Paper elevation={0} sx={{ border: "1px solid #e0e0e0", p: 3, mt: 3, borderRadius: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: "primary.main" }}>제품 소개</Typography>
          <Typography variant="body1" sx={{ color: "text.secondary", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
            {product.description}
          </Typography>
        </Paper>
      )}

      {/* 상세 내용 */}
      {product.content && (
        <Paper elevation={0} sx={{ border: "1px solid #e0e0e0", p: 3, mt: 3, borderRadius: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: "primary.main" }}>상세 내용</Typography>
          <Typography
            variant="body2"
            sx={{ lineHeight: 1.9, whiteSpace: "pre-wrap", color: "text.primary" }}
          >
            {product.content}
          </Typography>
        </Paper>
      )}

      <Box sx={{ mt: 3, pb: 4 }}>
        <Typography variant="caption" sx={{ color: "text.disabled" }}>
          등록일: {formatDate(product.createdAt)}
        </Typography>
      </Box>
    </Box>
  );
}
