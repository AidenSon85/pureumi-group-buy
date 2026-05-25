"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Chip, Switch, Tooltip,
  Stack, CircularProgress, TextField, FormControl, InputLabel, Select,
  MenuItem, InputAdornment, TablePagination, Avatar, Drawer, Divider,
  Alert, FormControlLabel, Grid,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import InventoryIcon from "@mui/icons-material/Inventory";
import ImageIcon from "@mui/icons-material/Image";

interface Factory { id: string; name: string }
interface Category { id: string; name: string }
interface Product {
  id: string; name: string; price: number; salePrice: number | null;
  stock: number; unit: string; isActive: boolean; sortOrder: number;
  imageUrl: string | null; factory: Factory; category: Category | null;
  minQty: number; maxQty: number | null; description: string | null; content: string | null;
  createdAt: string;
}

const emptyForm = {
  name: "", description: "", content: "", price: "", salePrice: "", unit: "개",
  minQty: "1", maxQty: "", stock: "0", imageUrl: "", isActive: true,
  sortOrder: "0", factoryId: "", categoryId: "",
};

const formatWon = (n: number) => `₩${n.toLocaleString()}`;
const DRAWER_WIDTH = 680;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [factoryFilter, setFactoryFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(page), limit: "20", search, factoryId: factoryFilter });
    fetch(`/api/products?${q}`).then((r) => r.json()).then((d) => {
      setProducts(d.products || []); setTotal(d.total || 0); setLoading(false);
    }).catch(() => setLoading(false));
  }, [page, search, factoryFilter]);

  useEffect(() => {
    Promise.all([
      fetch("/api/factories").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([f, c]) => { setFactories(f); setCategories(c); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...emptyForm, factoryId: factories[0]?.id || "" });
    setError(""); setDrawerOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditTarget(p);
    setForm({
      name: p.name, description: p.description || "", content: p.content || "",
      price: String(p.price), salePrice: p.salePrice ? String(p.salePrice) : "",
      unit: p.unit, minQty: String(p.minQty), maxQty: p.maxQty ? String(p.maxQty) : "",
      stock: String(p.stock), imageUrl: p.imageUrl || "", isActive: p.isActive,
      sortOrder: String(p.sortOrder), factoryId: p.factory.id, categoryId: p.category?.id || "",
    });
    setError(""); setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price || !form.factoryId) {
      setError("제품명, 가격, 매장은 필수입니다."); return;
    }
    setSaving(true);
    const url = editTarget ? `/api/products/${editTarget.id}` : "/api/products";
    const method = editTarget ? "PUT" : "POST";
    const body = {
      ...form, price: Number(form.price),
      salePrice: form.salePrice ? Number(form.salePrice) : null,
      minQty: Number(form.minQty), maxQty: form.maxQty ? Number(form.maxQty) : null,
      stock: Number(form.stock), sortOrder: Number(form.sortOrder),
      categoryId: form.categoryId || null,
    };
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) { setDrawerOpen(false); load(); }
    else { const d = await res.json(); setError(d.error || "오류가 발생했습니다."); }
  };

  const handleToggle = async (p: Product) => {
    await fetch(`/api/products/${p.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !p.isActive }) });
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/products/${deleteId}`, { method: "DELETE" });
    setDeleteId(null); load();
  };

  return (
    <Box sx={{ display: "flex", gap: 0 }}>
      {/* 좌측: 목록 */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <InventoryIcon color="primary" />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>제품(PRODUCT) 관리</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>제품 등록</Button>
        </Stack>

        <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #e0e0e0" }}>
          <Stack direction="row" spacing={2}>
            <TextField
              size="small" placeholder="제품명 검색" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              slotProps={{
                input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }
              }}
              sx={{ width: 280 }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>매장</InputLabel>
              <Select value={factoryFilter} label="매장" onChange={(e) => { setFactoryFilter(e.target.value); setPage(0); }}>
                <MenuItem value="">전체</MenuItem>
                {factories.map((f) => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ border: "1px solid #e0e0e0" }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "#f5f5f5" } }}>
                  <TableCell>제품명</TableCell>
                  <TableCell>매장</TableCell>
                  <TableCell align="right">가격</TableCell>
                  <TableCell align="right">재고</TableCell>
                  <TableCell align="center">상태</TableCell>
                  <TableCell align="center">관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
                ) : products.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>등록된 제품이 없습니다</TableCell></TableRow>
                ) : products.map((p) => (
                  <TableRow key={p.id} hover selected={editTarget?.id === p.id}
                    sx={{ "&.Mui-selected": { bgcolor: "#e3f2fd" } }}>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar src={p.imageUrl || undefined} variant="rounded" sx={{ width: 40, height: 40, bgcolor: "#f5f5f5" }}>
                          <ImageIcon color="disabled" />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.name}</Typography>
                          {p.category && <Typography variant="caption" sx={{ color: "text.secondary" }}>{p.category.name}</Typography>}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2">{p.factory.name}</Typography></TableCell>
                    <TableCell align="right">
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>{formatWon(p.price)}</Typography>
                        {p.salePrice && <Typography variant="caption" sx={{ color: "error.main" }}>{formatWon(p.salePrice)}</Typography>}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ color: p.stock < 10 ? "error.main" : "text.primary", fontWeight: p.stock < 10 ? 700 : 400 }}>
                        {p.stock} {p.unit}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={p.isActive ? "비활성화" : "활성화"}>
                        <Switch checked={p.isActive} onChange={() => handleToggle(p)} size="small" />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => openEdit(p)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => setDeleteId(p.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div" count={total} page={page} rowsPerPage={20}
            onPageChange={(_, p) => setPage(p)} rowsPerPageOptions={[20]}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 전체 ${count}개`}
          />
        </Paper>
      </Box>

      {/* 우측: 등록/수정 패널 */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        variant="persistent"
        sx={{
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            position: "fixed",
            top: 64,
            height: "calc(100vh - 64px)",
            boxShadow: "-4px 0 20px rgba(0,0,0,0.1)",
            borderLeft: "1px solid #e0e0e0",
          },
        }}
      >
        <Box sx={{ px: 3, py: 2, bgcolor: "#1a237e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {editTarget ? "제품 수정" : "새 제품 등록"}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}
              sx={{ bgcolor: "#fff", color: "#1a237e", "&:hover": { bgcolor: "#e8eaf6" } }}
            >
              {saving ? <CircularProgress size={18} /> : "저장"}
            </Button>
            <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: "#fff" }}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>

        <Box sx={{ overflowY: "auto", height: "100%", px: 3, py: 2.5 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main", mb: 1.5 }}>기본 정보</Typography>
          <Stack spacing={2}>
            <TextField label="제품명 *" value={form.name} fullWidth onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel>매장 *</InputLabel>
              <Select value={form.factoryId} label="매장 *" onChange={(e) => setForm({ ...form, factoryId: e.target.value })}>
                {factories.map((f) => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>카테고리</InputLabel>
              <Select value={form.categoryId} label="카테고리" onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <MenuItem value="">없음</MenuItem>
                {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="제품 설명 (요약)" value={form.description} fullWidth multiline rows={2}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main", mb: 1.5 }}>가격 및 재고</Typography>
          <Grid container spacing={2}>
            <Grid size={6}>
              <TextField label="정가 *" value={form.price} fullWidth type="number"
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                slotProps={{ input: { startAdornment: <InputAdornment position="start">₩</InputAdornment> } }}
              />
            </Grid>
            <Grid size={6}>
              <TextField label="판매가" value={form.salePrice} fullWidth type="number"
                onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                slotProps={{ input: { startAdornment: <InputAdornment position="start">₩</InputAdornment> } }}
                helperText="비워두면 정가로 판매"
              />
            </Grid>
            <Grid size={4}>
              <TextField label="재고 수량" value={form.stock} fullWidth type="number"
                onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </Grid>
            <Grid size={4}>
              <TextField label="단위" value={form.unit} fullWidth onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </Grid>
            <Grid size={4}>
              <TextField label="정렬 순서" value={form.sortOrder} fullWidth type="number"
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
            </Grid>
            <Grid size={6}>
              <TextField label="최소 주문 수량" value={form.minQty} fullWidth type="number"
                onChange={(e) => setForm({ ...form, minQty: e.target.value })} />
            </Grid>
            <Grid size={6}>
              <TextField label="최대 주문 수량" value={form.maxQty} fullWidth type="number"
                onChange={(e) => setForm({ ...form, maxQty: e.target.value })}
                helperText="비워두면 제한 없음"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main", mb: 1.5 }}>이미지</Typography>
          <TextField label="대표 이미지 URL" value={form.imageUrl} fullWidth
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
          {form.imageUrl && (
            <Box sx={{ mt: 1.5, border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden", height: 180 }}>
              <Box component="img" src={form.imageUrl} alt="미리보기"
                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main", mb: 1.5 }}>상세 내용</Typography>
          <TextField label="상세 설명" value={form.content} fullWidth multiline rows={10}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="제품 상세 내용을 입력하세요..."
            sx={{ "& .MuiOutlinedInput-root": { fontFamily: "monospace", fontSize: 13 } }}
          />

          <Divider sx={{ my: 3 }} />

          <FormControlLabel
            control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />}
            label="판매 활성화"
          />

          <Box sx={{ mt: 3, mb: 4 }}>
            <Button variant="contained" fullWidth size="large" startIcon={<SaveIcon />}
              onClick={handleSave} disabled={saving} sx={{ py: 1.5, fontSize: 16 }}>
              {saving ? <CircularProgress size={22} /> : editTarget ? "수정 저장" : "제품 등록"}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {deleteId && (
        <Box sx={{ position: "fixed", inset: 0, bgcolor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}
          onClick={() => setDeleteId(null)}>
          <Paper sx={{ p: 3, minWidth: 320 }} onClick={(e) => e.stopPropagation()}>
            <Typography variant="h6" sx={{ mb: 1 }}>제품 삭제</Typography>
            <Typography sx={{ color: "text.secondary", mb: 3 }}>정말로 이 제품을 삭제하시겠습니까?</Typography>
            <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
              <Button onClick={() => setDeleteId(null)}>취소</Button>
              <Button variant="contained" color="error" onClick={handleDelete}>삭제</Button>
            </Stack>
          </Paper>
        </Box>
      )}
    </Box>
  );
}
