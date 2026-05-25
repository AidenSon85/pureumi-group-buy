"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Box, Paper, Typography, Button, Grid, Card, CardContent, CardMedia,
  Chip, FormControl, InputLabel, Select, MenuItem, TextField, InputAdornment,
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
  useEffect(() => { load(); }, [load]);

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <InventoryIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>제품 조회</Typography>
        </Box>
        <Button variant="contained" onClick={() => router.push("/manage/products")}>
          제품 등록/수정
        </Button>
      </Stack>

      <Paper elevation={0} sx={{ p: 2, mb: 3, border: "1px solid #e0e0e0" }}>
        <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
          <TextField
            size="small" placeholder="제품명 검색" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            slotProps={{
              input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }
            }}
            sx={{ width: 280 }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>매장</InputLabel>
            <Select value={factoryFilter} label="매장" onChange={(e) => { setFactoryFilter(e.target.value); setPage(1); }}>
              <MenuItem value="">전체</MenuItem>
              {factories.map((f) => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>상태</InputLabel>
            <Select value={statusFilter} label="상태" onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <MenuItem value="">전체</MenuItem>
              <MenuItem value="true">판매중</MenuItem>
              <MenuItem value="false">중지</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : (
        <>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>전체 {total}개 제품</Typography>
          <Grid container spacing={2}>
            {products.map((p) => (
              <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Card elevation={0} sx={{ border: "1px solid #e0e0e0", height: "100%", display: "flex", flexDirection: "column" }}>
                  {p.imageUrl ? (
                    <CardMedia component="img" image={p.imageUrl} alt={p.name} sx={{ height: 160, objectFit: "cover" }} />
                  ) : (
                    <Box sx={{ height: 160, bgcolor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ImageIcon sx={{ fontSize: 48, color: "#ccc" }} />
                    </Box>
                  )}
                  <CardContent sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={0.5} sx={{ mb: 1 }}>
                      <Chip label={p.factory.name} size="small" color="primary" variant="outlined" />
                      {p.category && <Chip label={p.category.name} size="small" variant="outlined" />}
                    </Stack>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }} gutterBottom>{p.name}</Typography>
                    {p.description && (
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {p.description}
                      </Typography>
                    )}
                    <Box sx={{ mt: 1 }}>
                      {p.salePrice ? (
                        <Stack direction="row" sx={{ alignItems: "center" }} spacing={1}>
                          <Typography variant="body1" sx={{ fontWeight: 700, color: "error.main" }}>{formatWon(p.salePrice)}</Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary", textDecoration: "line-through" }}>{formatWon(p.price)}</Typography>
                        </Stack>
                      ) : (
                        <Typography variant="body1" sx={{ fontWeight: 700, color: "primary.main" }}>{formatWon(p.price)}</Typography>
                      )}
                    </Box>
                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mt: 1 }}>
                      <Typography variant="caption" sx={{ color: p.stock < 10 ? "error.main" : "text.secondary" }}>
                        재고 {p.stock}{p.unit}
                      </Typography>
                      <Chip label={p.isActive ? "판매중" : "중지"} size="small" color={p.isActive ? "success" : "default"} variant="outlined" />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {products.length === 0 && (
              <Grid size={12}>
                <Box sx={{ py: 8, textAlign: "center", color: "text.secondary" }}>
                  <InventoryIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
                  <Typography>검색 결과가 없습니다</Typography>
                </Box>
              </Grid>
            )}
          </Grid>
          {total > PER_PAGE && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Pagination count={Math.ceil(total / PER_PAGE)} page={page} onChange={(_, p) => setPage(p)} color="primary" />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
