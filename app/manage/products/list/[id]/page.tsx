"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Typography, Chip, Stack, CircularProgress, Button,
  Divider, IconButton, Tab, Tabs, Paper, Grid,
} from "@mui/material";
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
    <Stack direction="row" sx={{ alignItems: "flex-start", py: 1.2, borderBottom: "1px solid #f0f0f0" }}>
      <Stack direction="row" sx={{ alignItems: "center", gap: 0.75, minWidth: 80, color: "text.secondary", flexShrink: 0 }}>
        {icon}
        <Typography variant="caption" sx={{ color: "text.secondary" }}>{label}</Typography>
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
  const [tab, setTab] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch(`/api/products/${id}`).then((r) => r.json()),
      fetch("/api/factories").then((r) => r.json()),
    ]).then(([p, f]) => {
      setProduct(p); setFactories(f); setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", py: 12 }}><CircularProgress /></Box>;
  if (!product) return (
    <Box sx={{ py: 8, textAlign: "center" }}>
      <Typography color="text.secondary">제품을 찾을 수 없습니다</Typography>
      <Button sx={{ mt: 2 }} onClick={() => router.back()}>돌아가기</Button>
    </Box>
  );

  const allImages = product.images?.length > 0 ? product.images : (product.imageUrl ? [product.imageUrl] : []);
  const factoryNames = product.factoryIds.length > 0
    ? product.factoryIds.map((fid) => factories.find((f) => f.id === fid)?.name || fid)
    : [product.factory.name];
  const discountRate = product.salePrice ? Math.round((1 - product.salePrice / product.price) * 100) : 0;

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", pb: { xs: 10, md: 6 } }}>

      {/* 브레드크럼 + 수정 버튼 */}
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Stack direction="row" sx={{ alignItems: "center", gap: 0.5 }}>
          <IconButton size="small" onClick={() => router.back()}><ArrowBackIcon fontSize="small" /></IconButton>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            제품 조회{product.category && <> &gt; <span style={{ color: "#1976d2" }}>{product.category.name}</span></>}
          </Typography>
        </Stack>
        <Button size="small" variant="outlined" startIcon={<EditIcon />}
          onClick={() => router.push("/manage/products")}
          sx={{ display: { xs: "none", md: "flex" } }}>
          수정
        </Button>
      </Stack>

      {/* ── 제품 정보 카드 ── */}
      <Paper elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 2, p: { xs: 2, md: 2.5 }, mb: 2 }}>

        {/* 상태 + 카테고리 */}
        <Stack direction="row" spacing={0.75} sx={{ mb: 1 }}>
          <Chip label={product.isActive ? "판매중" : "판매중지"} size="small"
            color={product.isActive ? "success" : "default"} />
          {product.category && <Chip label={product.category.name} size="small" variant="outlined" />}
        </Stack>

        {/* 제품명 */}
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.4, mb: 1.5, wordBreak: "keep-all" }}>
          {product.name}
        </Typography>

        {/* 가격 */}
        {product.salePrice ? (
          <Stack direction="row" sx={{ alignItems: "baseline", gap: 1, mb: 0.5 }}>
            <Typography sx={{ fontWeight: 800, fontSize: 22, color: "#e53935" }}>
              {formatWon(product.salePrice)}
            </Typography>
            <Chip label={`${discountRate}% 할인`} size="small"
              sx={{ bgcolor: "#e53935", color: "#fff", fontWeight: 700, fontSize: 11 }} />
          </Stack>
        ) : null}
        <Stack direction="row" sx={{ alignItems: "baseline", gap: 1, mb: 2 }}>
          <Typography sx={{ fontWeight: product.salePrice ? 400 : 800, fontSize: product.salePrice ? 13 : 22, color: product.salePrice ? "text.secondary" : "primary.main", textDecoration: product.salePrice ? "line-through" : "none" }}>
            {formatWon(product.price)}
          </Typography>
          {product.salePrice && <Typography variant="caption" sx={{ color: "text.secondary" }}>정가</Typography>}
        </Stack>

        <Divider sx={{ mb: 1.5 }} />

        {/* 정보 행 */}
        <InfoRow icon={<StorefrontOutlinedIcon sx={{ fontSize: 14 }} />} label="소속 매장">
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5 }}>
            {factoryNames.map((name, i) => (
              <Chip key={i} label={name} size="small" color="primary" variant="outlined" />
            ))}
          </Stack>
        </InfoRow>

        <InfoRow icon={<InventoryOutlinedIcon sx={{ fontSize: 14 }} />} label="재고">
          <Typography variant="body2" sx={{ fontWeight: 600, color: product.stock === 0 ? "error.main" : product.stock < 10 ? "warning.main" : "text.primary" }}>
            {product.stock} {product.unit}
            {product.stock === 0 && <Typography component="span" variant="caption" sx={{ ml: 1, color: "error.main" }}>품절</Typography>}
            {product.stock > 0 && product.stock < 10 && <Typography component="span" variant="caption" sx={{ ml: 1, color: "warning.main" }}>잔여 수량 적음</Typography>}
          </Typography>
        </InfoRow>

        {product.groupBuyStartAt && (
          <InfoRow icon={<CalendarMonthOutlinedIcon sx={{ fontSize: 14 }} />} label="공구기간">
            <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>
              {formatDate(product.groupBuyStartAt)}
              {product.groupBuyEndAt && ` ~ ${formatDate(product.groupBuyEndAt)}`}
            </Typography>
          </InfoRow>
        )}

        <InfoRow icon={<LocalShippingOutlinedIcon sx={{ fontSize: 14 }} />} label="배송">
          <Typography variant="body2">주문 후 매장 확인</Typography>
        </InfoRow>
      </Paper>

      {/* ── 상품 설명 / 상세 내용 탭 ── */}
      <Paper elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden" }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: "1px solid #e0e0e0", "& .MuiTab-root": { fontWeight: 600, fontSize: 13 } }}>
          <Tab label="상품 소개" />
          <Tab label="상세 내용" disabled={!product.content} />
        </Tabs>

        <Box sx={{ p: { xs: 2, md: 2.5 }, minHeight: 120 }}>
          {tab === 0 && (
            product.description
              ? <Typography variant="body2" sx={{ lineHeight: 2, whiteSpace: "pre-wrap", wordBreak: "keep-all" }}>{product.description}</Typography>
              : <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", py: 4 }}>등록된 상품 소개가 없습니다</Typography>
          )}
          {tab === 1 && (
            <Typography variant="body2" sx={{ lineHeight: 2, whiteSpace: "pre-wrap", wordBreak: "keep-all" }}>{product.content}</Typography>
          )}
        </Box>

        {/* ── 이미지 목록 (설명 아래) ── */}
        {allImages.length > 0 && (
          <>
            <Divider />
            <Box sx={{ p: { xs: 2, md: 2.5 } }}>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.5 }}>
                상품 이미지 ({allImages.length}장)
              </Typography>
              <Stack spacing={1.5}>
                {allImages.map((url, i) => (
                  <Box key={i}>
                    <Box component="img" src={url} alt={`이미지 ${i + 1}`}
                      sx={{ width: "100%", display: "block", borderRadius: 1.5, border: url === product.imageUrl ? "2px solid #1976d2" : "1px solid #e0e0e0" }} />
                    {url === product.imageUrl && (
                      <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 600, mt: 0.5, display: "block" }}>
                        ★ 대표 이미지
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            </Box>
          </>
        )}
      </Paper>

      <Typography variant="caption" sx={{ color: "text.disabled", display: "block", mt: 2 }}>
        등록일: {formatDate(product.createdAt)}
      </Typography>

      {/* 모바일 하단 고정 버튼 */}
      <Box sx={{
        display: { xs: "flex", md: "none" },
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        bgcolor: "#fff", borderTop: "1px solid #e0e0e0", p: 1.5, gap: 1.5,
      }}>
        <Button variant="outlined" onClick={() => router.back()} sx={{ flex: 1, py: 1.2, borderRadius: 2, fontWeight: 600 }}>
          목록으로
        </Button>
        <Button variant="contained" startIcon={<EditIcon />}
          onClick={() => router.push("/manage/products")}
          sx={{ flex: 2, py: 1.2, borderRadius: 2, fontWeight: 600 }}>
          수정하기
        </Button>
      </Box>
    </Box>
  );
}
