"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Typography, Chip, Stack, CircularProgress, Button,
  Divider, Grid, IconButton, Tab, Tabs, Paper,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import ImageIcon from "@mui/icons-material/Image";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import InventoryOutlinedIcon from "@mui/icons-material/InventoryOutlined";

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

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <Stack direction="row" sx={{ alignItems: "flex-start", py: 1.5, borderBottom: "1px solid #f0f0f0" }}>
      <Stack direction="row" sx={{ alignItems: "center", gap: 0.75, minWidth: 90, color: "text.secondary" }}>
        {icon}
        <Typography variant="body2" sx={{ color: "text.secondary", fontSize: 13 }}>{label}</Typography>
      </Stack>
      <Box sx={{ flex: 1 }}>{children}</Box>
    </Stack>
  );
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch(`/api/products/${id}`).then((r) => r.json()),
      fetch("/api/factories").then((r) => r.json()),
    ]).then(([p, f]) => {
      setProduct(p);
      setFactories(f);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 12 }}><CircularProgress /></Box>
  );
  if (!product) return (
    <Box sx={{ py: 8, textAlign: "center" }}>
      <Typography color="text.secondary">제품을 찾을 수 없습니다</Typography>
      <Button sx={{ mt: 2 }} onClick={() => router.back()}>돌아가기</Button>
    </Box>
  );

  const allImages = product.images?.length > 0 ? product.images : (product.imageUrl ? [product.imageUrl] : []);
  const hasImages = allImages.length > 0;
  const currentImage = allImages[imgIndex] || null;

  const factoryNames = product.factoryIds.length > 0
    ? product.factoryIds.map((fid) => factories.find((f) => f.id === fid)?.name || fid)
    : [product.factory.name];

  const discountRate = product.salePrice
    ? Math.round((1 - product.salePrice / product.price) * 100)
    : 0;

  const displayPrice = product.salePrice ?? product.price;

  return (
    <Box sx={{ pb: { xs: 10, md: 4 }, maxWidth: 860, mx: "auto" }}>
      {/* 상단 네비 */}
      <Stack direction="row" sx={{ alignItems: "center", mb: 1.5, gap: 1 }}>
        <IconButton onClick={() => router.back()} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          제품 조회
          {product.category && <> &gt; <span style={{ color: "#1976d2" }}>{product.category.name}</span></>}
        </Typography>
      </Stack>

      <Grid container spacing={{ xs: 0, md: 3 }}>
        {/* ── 이미지 섹션 ── */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* 메인 이미지 */}
          <Box sx={{ position: "relative", bgcolor: "#f8f8f8", borderRadius: { xs: 0, md: 2 }, overflow: "hidden", border: { md: "1px solid #e0e0e0" } }}>
            <Box sx={{ width: "100%", aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {currentImage ? (
                <Box component="img" src={currentImage} alt={product.name}
                  sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <ImageIcon sx={{ fontSize: 80, color: "#ccc" }} />
              )}
            </Box>

            {/* 이미지 네비게이션 화살표 */}
            {allImages.length > 1 && (
              <>
                <IconButton
                  onClick={() => setImgIndex((i) => (i - 1 + allImages.length) % allImages.length)}
                  sx={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", bgcolor: "rgba(255,255,255,0.85)", "&:hover": { bgcolor: "#fff" }, boxShadow: 1 }}
                  size="small"
                >
                  <ArrowBackIosNewIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={() => setImgIndex((i) => (i + 1) % allImages.length)}
                  sx={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", bgcolor: "rgba(255,255,255,0.85)", "&:hover": { bgcolor: "#fff" }, boxShadow: 1 }}
                  size="small"
                >
                  <ArrowForwardIosIcon fontSize="small" />
                </IconButton>

                {/* 점 인디케이터 (모바일) */}
                <Stack direction="row" spacing={0.5} sx={{ position: "absolute", bottom: 10, left: 0, right: 0, justifyContent: "center", display: { md: "none" } }}>
                  {allImages.map((_, i) => (
                    <Box key={i} onClick={() => setImgIndex(i)} sx={{ width: i === imgIndex ? 20 : 6, height: 6, borderRadius: 3, bgcolor: i === imgIndex ? "#1976d2" : "rgba(255,255,255,0.7)", cursor: "pointer", transition: "all 0.2s" }} />
                  ))}
                </Stack>
              </>
            )}
          </Box>

          {/* 썸네일 (데스크탑) */}
          {allImages.length > 1 && (
            <Stack direction="row" spacing={1} sx={{ mt: 1.5, display: { xs: "none", md: "flex" }, flexWrap: "wrap" }}>
              {allImages.map((url, i) => (
                <Box
                  key={i} onClick={() => setImgIndex(i)}
                  sx={{
                    width: 64, height: 64, borderRadius: 1, overflow: "hidden", cursor: "pointer", flexShrink: 0,
                    border: i === imgIndex ? "2px solid #1976d2" : "2px solid #e0e0e0",
                    opacity: i === imgIndex ? 1 : 0.65,
                    transition: "all 0.15s",
                    "&:hover": { opacity: 1 },
                  }}
                >
                  <Box component="img" src={url} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </Box>
              ))}
            </Stack>
          )}
        </Grid>

        {/* ── 제품 정보 섹션 ── */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Box sx={{ px: { xs: 2, md: 0 }, pt: { xs: 2, md: 0 } }}>
            {/* 판매 상태 */}
            <Chip
              label={product.isActive ? "판매중" : "판매중지"}
              size="small"
              color={product.isActive ? "success" : "default"}
              sx={{ mb: 1 }}
            />

            {/* 제품명 */}
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.4, mb: 1.5, wordBreak: "keep-all" }}>
              {product.name}
            </Typography>

            <Divider sx={{ mb: 2 }} />

            {/* 가격 블록 */}
            <Box sx={{ mb: 2, p: 1.5, bgcolor: "#f8f9ff", borderRadius: 2 }}>
              {product.salePrice ? (
                <>
                  <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 800, color: "#e53935", fontSize: { xs: 22, md: 20 } }}>
                      {formatWon(product.salePrice)}
                    </Typography>
                    <Chip label={`${discountRate}%`} size="small" sx={{ bgcolor: "#e53935", color: "#fff", fontWeight: 700, fontSize: 12 }} />
                  </Stack>
                  <Stack direction="row" sx={{ alignItems: "center", gap: 0.75 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>정가</Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", textDecoration: "line-through" }}>
                      {formatWon(product.price)}
                    </Typography>
                  </Stack>
                </>
              ) : (
                <Typography sx={{ fontWeight: 800, color: "#1a237e", fontSize: { xs: 22, md: 20 } }}>
                  {formatWon(product.price)}
                </Typography>
              )}
            </Box>

            {/* 정보 행 */}
            <Box>
              <InfoRow icon={<StorefrontOutlinedIcon sx={{ fontSize: 16 }} />} label="소속 매장">
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                  {factoryNames.map((name, i) => (
                    <Chip key={i} label={name} size="small" color="primary" variant="outlined" />
                  ))}
                </Stack>
              </InfoRow>

              <InfoRow icon={<InventoryOutlinedIcon sx={{ fontSize: 16 }} />} label="재고">
                <Typography variant="body2" sx={{ fontWeight: 600, color: product.stock < 10 ? "error.main" : "text.primary" }}>
                  {product.stock} {product.unit}
                  {product.stock < 10 && product.stock > 0 && (
                    <Typography component="span" variant="caption" sx={{ color: "error.main", ml: 1 }}>잔여 수량 적음</Typography>
                  )}
                  {product.stock === 0 && (
                    <Typography component="span" variant="caption" sx={{ color: "error.main", ml: 1 }}>품절</Typography>
                  )}
                </Typography>
              </InfoRow>

              {product.groupBuyStartAt && (
                <InfoRow icon={<CalendarMonthOutlinedIcon sx={{ fontSize: 16 }} />} label="공구기간">
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>
                    {formatDate(product.groupBuyStartAt)}
                    {product.groupBuyEndAt && ` ~ ${formatDate(product.groupBuyEndAt)}`}
                  </Typography>
                </InfoRow>
              )}

              <InfoRow icon={<LocalShippingOutlinedIcon sx={{ fontSize: 16 }} />} label="배송">
                <Typography variant="body2" sx={{ fontWeight: 500 }}>주문 후 매장 확인</Typography>
              </InfoRow>
            </Box>

            {/* 수정하기 버튼 (데스크탑) */}
            <Box sx={{ mt: 3, display: { xs: "none", md: "block" } }}>
              <Button
                variant="contained" fullWidth size="large" startIcon={<EditIcon />}
                onClick={() => router.push("/manage/products")}
                sx={{ py: 1.5, fontSize: 16, borderRadius: 2 }}
              >
                수정하기
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* ── 탭 콘텐츠 ── */}
      <Box sx={{ mt: { xs: 2.5, md: 3 } }}>
        <Paper elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden" }}>
          <Tabs
            value={tab} onChange={(_, v) => setTab(v)}
            sx={{
              borderBottom: "1px solid #e0e0e0",
              "& .MuiTab-root": { fontWeight: 600, fontSize: 14 },
            }}
          >
            <Tab label="상품 소개" />
            <Tab label="상세 내용" disabled={!product.content} />
          </Tabs>

          <Box sx={{ p: { xs: 2, md: 3 }, minHeight: 200 }}>
            {tab === 0 && (
              product.description ? (
                <Typography variant="body1" sx={{ lineHeight: 2, whiteSpace: "pre-wrap", color: "text.primary", wordBreak: "keep-all" }}>
                  {product.description}
                </Typography>
              ) : (
                <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
                  <Typography variant="body2">등록된 상품 소개가 없습니다</Typography>
                </Box>
              )
            )}
            {tab === 1 && (
              <Typography variant="body2" sx={{ lineHeight: 2, whiteSpace: "pre-wrap", color: "text.primary", wordBreak: "keep-all" }}>
                {product.content}
              </Typography>
            )}
          </Box>
        </Paper>
      </Box>

      {/* ── 하단 고정 버튼 (모바일) ── */}
      <Box sx={{
        display: { xs: "flex", md: "none" },
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        bgcolor: "#fff", borderTop: "1px solid #e0e0e0",
        p: 1.5, gap: 1.5,
      }}>
        <Button
          variant="outlined" onClick={() => router.back()}
          sx={{ flex: 1, py: 1.2, borderRadius: 2, fontWeight: 600 }}
        >
          목록으로
        </Button>
        <Button
          variant="contained" startIcon={<EditIcon />}
          onClick={() => router.push("/manage/products")}
          sx={{ flex: 2, py: 1.2, borderRadius: 2, fontWeight: 600 }}
        >
          수정하기
        </Button>
      </Box>
    </Box>
  );
}
