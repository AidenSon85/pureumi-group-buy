"use client";
import { useState, useEffect } from "react";
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Stack, Alert, CircularProgress, Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CategoryIcon from "@mui/icons-material/Category";

interface Category {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  createdAt: string;
}

const emptyForm = { name: "", sortOrder: "0" };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => { setCategories(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setError("");
    setDialogOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditTarget(c);
    setForm({ name: c.name, sortOrder: String(c.sortOrder) });
    setError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("카테고리명을 입력해주세요."); return; }
    setSaving(true);
    const url = editTarget ? `/api/categories/${editTarget.id}` : "/api/categories";
    const method = editTarget ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name.trim(), sortOrder: Number(form.sortOrder) }),
    });
    setSaving(false);
    if (res.ok) { setDialogOpen(false); load(); }
    else { const d = await res.json(); setError(d.error || "오류가 발생했습니다."); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/categories/${deleteId}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "삭제 실패");
      setDeleteId(null);
      return;
    }
    setDeleteId(null);
    load();
  };

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CategoryIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>카테고리(CATEGORY) 관리</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          카테고리 추가
        </Button>
      </Stack>

      {error && !dialogOpen && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>
      )}

      <Paper elevation={0} sx={{ border: "1px solid #e0e0e0" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "#f5f5f5" } }}>
                <TableCell width={140}>코드</TableCell>
                <TableCell>카테고리명</TableCell>
                <TableCell align="center" width={100}>정렬 순서</TableCell>
                <TableCell align="center" width={100}>관리</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    등록된 카테고리가 없습니다
                  </TableCell>
                </TableRow>
              ) : categories.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell>
                    <Chip label={c.code} size="small" variant="outlined" color="primary"
                      sx={{ fontWeight: 700, fontFamily: "monospace", fontSize: 12 }} />
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }}>{c.name}</Typography>
                  </TableCell>
                  <TableCell align="center">{c.sortOrder}</TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => openEdit(c)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteId(c.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 추가/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editTarget ? "카테고리 수정" : "카테고리 추가"}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Stack spacing={2} sx={{ mt: 1 }}>
            {editTarget && (
              <TextField
                label="코드"
                value={editTarget.code}
                fullWidth
                disabled
                helperText="코드는 자동 부여되며 변경할 수 없습니다"
                slotProps={{ input: { sx: { fontFamily: "monospace", fontWeight: 700 } } }}
              />
            )}
            <TextField
              label="카테고리명 *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
              autoFocus={!editTarget}
              helperText={editTarget ? undefined : "코드(CATE00X)는 저장 시 자동 부여됩니다"}
            />
            <TextField
              label="정렬 순서"
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
              fullWidth
              helperText="숫자가 작을수록 앞에 표시됩니다"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : "저장"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>카테고리 삭제</DialogTitle>
        <DialogContent>
          <Typography>정말로 이 카테고리를 삭제하시겠습니까?</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
            해당 카테고리를 사용 중인 제품이 있으면 삭제되지 않습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>취소</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>삭제</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
