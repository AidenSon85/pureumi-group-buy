"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ko } from "date-fns/locale";
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Chip, Switch, Tooltip,
  Stack, CircularProgress, TextField, FormControl, InputLabel, Select,
  MenuItem, InputAdornment, TablePagination, Avatar, Drawer, Divider,
  Alert, FormControlLabel, Grid, OutlinedInput, Checkbox, ListItemText,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import InventoryIcon from "@mui/icons-material/Inventory";
import ImageIcon from "@mui/icons-material/Image";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

interface Factory { id: string; name: string }
interface Category { id: string; name: string }
interface Product {
  id: string; name: string; price: number; salePrice: number | null;
  stock: number; unit: string; isActive: boolean;
  imageUrl: string | null; images: string[];
  factory: Factory; factoryIds: string[];
  category: Category | null;
  description: string | null; content: string | null;
  groupBuyStartAt: string | null; groupBuyEndAt: string | null;
  createdAt: string;
}

const emptyForm = () => ({
  name: "", description: "", content: "", price: "", salePrice: "", unit: "개",
  stock: "0", imageUrl: "", images: [] as string[], isActive: true,
  factoryIds: [] as string[], categoryId: "",
  groupBuyStartAt: null as Date | null,
  groupBuyEndAt: null as Date | null,
});

const formatWon = (n: number) => `₩${n.toLocaleString()}`;
const formatDateShort = (s: string | null) => s ? new Date(s).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }) : "";
const DRAWER_WIDTH = 700;

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
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setForm(emptyForm());
    setError(""); setDrawerOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditTarget(p);
    setForm({
      name: p.name, description: p.description || "", content: p.content || "",
      price: String(p.price), salePrice: p.salePrice ? String(p.salePrice) : "",
      unit: p.unit, stock: String(p.stock),
      imageUrl: p.imageUrl || "",
      images: p.images || [],
      isActive: p.isActive,
      factoryIds: p.factoryIds.length > 0 ? p.factoryIds : [p.factory.id],
      categoryId: p.category?.id || "",
      groupBuyStartAt: p.groupBuyStartAt ? new Date(p.groupBuyStartAt) : null,
      groupBuyEndAt: p.groupBuyEndAt ? new Date(p.groupBuyEndAt) : null,
    });
    setError(""); setDrawerOpen(true);
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      try {
        // 서버에서 presigned URL 발급
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, contentType: file.type }),
        });
        const { signedUrl, publicUrl, error } = await res.json();
        if (error || !signedUrl) continue;

        // 브라우저에서 Supabase에 직접 업로드 (서버 경유 없음 → 파일 크기 제한 없음)
        const uploadRes = await fetch(signedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        if (uploadRes.ok) uploaded.push(publicUrl);
      } catch { /* skip failed */ }
    }
    if (uploaded.length > 0) {
      setForm((f) => {
        const newImages = [...f.images, ...uploaded];
        return { ...f, images: newImages, imageUrl: f.imageUrl || newImages[0] || "" };
      });
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (url: string) => {
    setForm((f) => {
      const newImages = f.images.filter((u) => u !== url);
      return {
        ...f,
        images: newImages,
        imageUrl: f.imageUrl === url ? (newImages[0] || "") : f.imageUrl,
      };
    });
  };

  const setRepresentative = (url: string) => {
    setForm((f) => ({ ...f, imageUrl: url }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price || form.factoryIds.length === 0) {
      setError("제품명, 가격, 매장은 필수입니다."); return;
    }
    setSaving(true);
    const url = editTarget ? `/api/products/${editTarget.id}` : "/api/products";
    const method = editTarget ? "PUT" : "POST";
    const body = {
      name: form.name,
      description: form.description,
      content: form.content,
      price: Number(form.price),
      salePrice: form.salePrice ? Number(form.salePrice) : null,
      unit: form.unit,
      stock: Number(form.stock),
      imageUrl: form.imageUrl || null,
      images: form.images,
      isActive: form.isActive,
      factoryIds: form.factoryIds,
      categoryId: form.categoryId || null,
      groupBuyStartAt: form.groupBuyStartAt ? form.groupBuyStartAt.toISOString() : null,
      groupBuyEndAt: form.groupBuyEndAt ? form.groupBuyEndAt.toISOString() : null,
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

  const getFactoryNames = (p: Product) => {
    const ids = p.factoryIds.length > 0 ? p.factoryIds : [p.factory.id];
    return ids.map((id) => factories.find((f) => f.id === id)?.name || p.factory.name);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
      <Box sx={{ display: "flex", gap: 0 }}>
        {/* 목록 */}
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
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
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
                    <TableCell>공구일</TableCell>
                    <TableCell align="right">가격</TableCell>
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
                      <TableCell>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {getFactoryNames(p).map((name, i) => (
                            <Chip key={i} label={name} size="small" variant="outlined" sx={{ height: 20, fontSize: 11 }} />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {p.groupBuyStartAt ? (
                          <Typography variant="caption" sx={{ color: "primary.main" }}>
                            {formatDateShort(p.groupBuyStartAt)}
                            {p.groupBuyEndAt ? ` ~ ${formatDateShort(p.groupBuyEndAt)}` : " ~"}
                          </Typography>
                        ) : (
                          <Typography variant="caption" sx={{ color: "text.disabled" }}>-</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>{formatWon(p.price)}</Typography>
                          {p.salePrice && <Typography variant="caption" sx={{ color: "error.main" }}>{formatWon(p.salePrice)}</Typography>}
                        </Box>
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

        {/* 등록/수정 패널 */}
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          variant="persistent"
          sx={{
            "& .MuiDrawer-paper": {
              width: { xs: "100vw", sm: DRAWER_WIDTH },
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

            {/* 기본 정보 */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main", mb: 1.5 }}>기본 정보</Typography>
            <Stack spacing={2}>
              <TextField label="제품명 *" value={form.name} fullWidth onChange={(e) => setForm({ ...form, name: e.target.value })} />

              <FormControl fullWidth>
                <InputLabel>소속 매장 *</InputLabel>
                <Select
                  multiple
                  value={form.factoryIds}
                  onChange={(e) => setForm({ ...form, factoryIds: e.target.value as string[] })}
                  input={<OutlinedInput label="소속 매장 *" />}
                  renderValue={(selected) =>
                    (selected as string[]).map((id) => factories.find((f) => f.id === id)?.name || id).join(", ")
                  }
                >
                  {factories.map((f) => (
                    <MenuItem key={f.id} value={f.id}>
                      <Checkbox checked={form.factoryIds.includes(f.id)} size="small" />
                      <ListItemText primary={f.name} />
                    </MenuItem>
                  ))}
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

            {/* 공구 일정 */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main", mb: 1.5 }}>공구 일정</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.5 }}>
              시작일이 되면 고객에게 자동으로 노출됩니다. 설정하지 않으면 즉시 노출됩니다.
            </Typography>
            <Grid container spacing={2}>
              <Grid size={6}>
                <DatePicker
                  label="공구 시작일"
                  value={form.groupBuyStartAt}
                  onChange={(v) => setForm({ ...form, groupBuyStartAt: v })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid size={6}>
                <DatePicker
                  label="공구 종료일"
                  value={form.groupBuyEndAt}
                  onChange={(v) => setForm({ ...form, groupBuyEndAt: v })}
                  slotProps={{ textField: { fullWidth: true } }}
                  minDate={form.groupBuyStartAt || undefined}
                />
              </Grid>
            </Grid>
            {form.groupBuyStartAt && (
              <Button size="small" variant="text" sx={{ mt: 0.5 }}
                onClick={() => setForm({ ...form, groupBuyStartAt: null, groupBuyEndAt: null })}>
                일정 초기화
              </Button>
            )}

            <Divider sx={{ my: 3 }} />

            {/* 가격 및 재고 */}
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
              <Grid size={6}>
                <TextField label="재고 수량" value={form.stock} fullWidth type="number"
                  onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </Grid>
              <Grid size={6}>
                <TextField label="단위" value={form.unit} fullWidth
                  onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* 이미지 */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main", mb: 0.5 }}>이미지</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.5 }}>
              ★ 클릭 시 대표 이미지로 설정됩니다.
            </Typography>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={(e) => handleImageUpload(e.target.files)}
            />
            <Button
              variant="outlined"
              startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              sx={{ mb: 2 }}
            >
              {uploading ? "업로드 중..." : "이미지 추가"}
            </Button>

            {form.images.length > 0 && (
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, mb: 1 }}>
                {form.images.map((url, i) => {
                  const isRep = form.imageUrl === url;
                  return (
                    <Box
                      key={i}
                      sx={{
                        position: "relative",
                        border: isRep ? "2px solid #1976d2" : "2px solid #e0e0e0",
                        borderRadius: 2,
                        overflow: "hidden",
                        aspectRatio: "1",
                        bgcolor: "#f5f5f5",
                      }}
                    >
                      <Box
                        component="img"
                        src={url}
                        alt={`이미지 ${i + 1}`}
                        sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", p: 0.3, bgcolor: "rgba(0,0,0,0.3)" }}>
                        <IconButton size="small" onClick={() => setRepresentative(url)} sx={{ p: 0.3 }}>
                          {isRep
                            ? <StarIcon fontSize="small" sx={{ color: "#ffc107" }} />
                            : <StarBorderIcon fontSize="small" sx={{ color: "#fff" }} />
                          }
                        </IconButton>
                        <IconButton size="small" onClick={() => removeImage(url)} sx={{ p: 0.3 }}>
                          <CloseIcon fontSize="small" sx={{ color: "#fff" }} />
                        </IconButton>
                      </Box>
                      {isRep && (
                        <Chip label="대표" size="small" color="primary"
                          sx={{ position: "absolute", bottom: 4, left: 4, height: 18, fontSize: 10 }} />
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            {/* 상세 내용 */}
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

        {/* 삭제 확인 */}
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
    </LocalizationProvider>
  );
}
