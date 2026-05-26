"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Box, Paper, Typography, Button, Grid, Card,
  Chip, FormControl, Select, MenuItem, TextField, InputAdornment,
  Stack, CircularProgress, Pagination,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import InventoryIcon from "@mui/icons-material/Inventory";
import ImageIcon from "@mui/icons-material/Image";
import { useRouter } from "next/navigation";

interface Product {
  id: string; name: string; price: number; salePrice: number | null;
  stock: number; unit: string; isActive: boolean; imageUrl: string | null;
  description: string | null; factory: { id: string; name: string };
  category: { id: string; name: string } | null;
}
interface Factory { id: string; name: string }
const formatWon = (n: number) => `₩${n.toLocaleString()}`;
const PER_PAGE = 12;

export default function ProductListPage() {
  const { data: session } = useSession();
  const isManager = (session?.user as any)?.role === "MANAGER";
  const myFactoryId = (session?.user as any)?.factoryId as string | undefined;

  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [factoryFilter, setFactoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams({
      page: String(page - 1), limit: String(PER_PAGE), search,
      factoryId: factoryFilter, isActive: statusFilter,
    });
    fetch(`/api/products?${q}`).then((r) => r.json()).then((d) => {
      setProducts(d.products || []); setTotal(d.total || 0); setLoading(false);
    }).catch(() => setLoading(false));
  }, [page, search, factoryFilter, statusFilter]);

  useEffect(() => { fetch("/api/factories").then((r) => r.json()).then(setFactories); }, []);
  useEffect(() => { if (isManager && myFactoryId) setFactoryFilter(myFactoryId); }, [isManager, myFactoryId]);
  useEffect(() => { load(); }, [load]);

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      {/* 헤더 */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ alignItems: { xs: "stretch", sm: "center" }, justifyContent: "space-between", mb: 2.5, gap: 1.5 }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <InventoryIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>제품 조회</Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => router.push("/manage/products")}
          sx={{ alignSelf: { xs: "flex-start", sm: "auto" } }}
        >
          제품 등록/수정
        </Button>
      </Stack>

      {/* 조회 조건 - 한 줄 */}
      <Paper elevation={0} sx={{ p: { xs: 1.25, sm: 1.5 }, mb: 2, border: "1px solid #e0e0e0", borderRadius: 2 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <TextField
            size="small" placeholder="제품명 검색" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            slotProps={{
              input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: "text.disabled" }} /></InputAdornment> }
            }}
            sx={{ flex: 1, minWidth: 0 }}
          />
          {!isManager && (
            <FormControl size="small" sx={{ flexShrink: 0, width: { xs: 100, sm: 150 } }}>
              <Select value={factoryFilter} displayEmpty onChange={(e) => { setFactoryFilter(e.target.value); setPage(1); }}>
                <MenuItem value=""><em style={{ fontStyle: "normal", color: "#999" }}>매장 전체</em></MenuItem>
                {factories.map((f) => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
              </Select>
            </FormControl>
          )}
          <FormControl size="small" sx={{ flexShrink: 0, width: { xs: 88, sm: 110 } }}>
            <Select value={statusFilter} displayEmpty onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <MenuItem value=""><em style={{ fontStyle: "normal", color: "#999" }}>상태 전체</em></MenuItem>
              <MenuItem value="true">판매중</MenuItem>
              <MenuItem value="false">중지</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* 결과 */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : (
        <>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>전체 {total}개 제품</Typography>

          <Grid container spacing={{ xs: 1.5, sm: 2 }}>
            {products.map((p) => (
              <Grid key={p.id} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
                <Card
                  elevation={0}
                  onClick={() => router.push(`/manage/products/list/${p.id}`)}
                  sx={{
                    border: "1px solid #e0e0e0", borderRadius: 2, height: "100%",
                    display: "flex", flexDirection: "column",
                    cursor: "pointer",
                    "&:hover": { boxShadow: 3, borderColor: "primary.main" },
                  }}
                >
                  {/* 이미지 - 4:3 고정비율 */}
                  <Box sx={{ aspectRatio: "4/3", overflow: "hidden", bgcolor: "#f5f5f5", flexShrink: 0 }}>
                    {p.imageUrl ? (
                      <Box
                        component="img" src={p.imageUrl} alt={p.name}
                        sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ImageIcon sx={{ fontSize: { xs: 32, sm: 40 }, color: "#ccc" }} />
                      </Box>
                    )}
                  </Box>

                  {/* 콘텐츠 */}
                  <Box sx={{ p: { xs: 1, sm: 1.25 }, flex: 1, display: "flex", flexDirection: "column" }}>
                    {/* 카테고리 칩 */}
                    <Box sx={{ mb: 0.5 }}>
                      <Chip
                        label={p.category?.name || p.factory.name} size="small"
                        sx={{ height: 18, fontSize: 10, bgcolor: "#f0f4ff", color: "#3f51b5", fontWeight: 600, "& .MuiChip-label": { px: 0.75 } }}
                      />
                    </Box>

                    {/* 제품명 */}
                    <Typography sx={{
                      fontWeight: 700, fontSize: { xs: 12, sm: 13 }, lineHeight: 1.4, mb: 0.5,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {p.name}
                    </Typography>

                    {/* 가격 + 재고/상태 - 하단 정렬 */}
                    <Box sx={{ mt: "auto" }}>
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
                        <Typography sx={{ fontWeight: 800, color: "primary.main", fontSize: { xs: 13, sm: 15 }, lineHeight: 1.2 }}>
                          {formatWon(p.price)}
                        </Typography>
                      )}
                      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mt: 0.75 }}>
                        <Typography variant="caption" sx={{ color: p.stock < 10 ? "error.main" : "text.secondary", fontSize: 10 }}>
                          재고 {p.stock}{p.unit}
                        </Typography>
                        <Chip
                          label={p.isActive ? "판매중" : "중지"} size="small"
                          color={p.isActive ? "success" : "default"} variant="outlined"
                          sx={{ height: 18, fontSize: 10, fontWeight: 600, "& .MuiChip-label": { px: 0.75 } }}
                        />
                      </Stack>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}

            {products.length === 0 && (
              <Grid size={12}>
                <Box sx={{ py: 8, textAlign: "center", color: "text.secondary" }}>
                  <InventoryIcon sx={{ fontSize: 64, opacity: 0.3, display: "block", mx: "auto", mb: 2 }} />
                  <Typography>검색 결과가 없습니다</Typography>
                </Box>
              </Grid>
            )}
          </Grid>

          {total > PER_PAGE && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Pagination
                count={Math.ceil(total / PER_PAGE)} page={page}
                onChange={(_, p) => setPage(p)} color="primary"
                size="small"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
