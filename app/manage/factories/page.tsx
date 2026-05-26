"use client";
import { useState, useEffect } from "react";
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Chip, Switch, Tooltip, Stack,
  Alert, CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import StoreIcon from "@mui/icons-material/Store";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LinkIcon from "@mui/icons-material/Link";

interface Factory {
  id: string; name: string; code: string; slug: string | null; address: string | null;
  phone: string | null; mapUrl: string | null; parkingInfo: string | null;
  businessHours: string | null; isActive: boolean; createdAt: string;
  _count?: { users: number; products: number; orders: number };
}

const empty = { name: "", code: "", slug: "", address: "", phone: "", mapUrl: "", parkingInfo: "", businessHours: "" };

export default function FactoriesPage() {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Factory | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const copyUrl = (slug: string) => {
    const url = `${window.location.origin}/shop/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
  };

  const load = () => {
    setLoading(true);
    fetch("/api/factories?counts=true")
      .then((r) => r.json())
      .then((d) => { setFactories(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditTarget(null); setForm(empty); setError(""); setDialogOpen(true); };
  const openEdit = (f: Factory) => {
    setEditTarget(f);
    setForm({ name: f.name, code: f.code, slug: f.slug || "", address: f.address || "", phone: f.phone || "", mapUrl: f.mapUrl || "", parkingInfo: f.parkingInfo || "", businessHours: f.businessHours || "" });
    setError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim()) { setError("매장명과 코드는 필수입니다."); return; }
    if (form.slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug)) {
      setError("영문 URL명은 소문자, 숫자, 하이픈(-)만 사용 가능합니다. (예: gangnam-branch)");
      return;
    }
    setSaving(true);
    const url = editTarget ? `/api/factories/${editTarget.id}` : "/api/factories";
    const method = editTarget ? "PUT" : "POST";
    const body = { ...form, slug: form.slug.trim() || null };
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) { setDialogOpen(false); load(); }
    else { const d = await res.json(); setError(d.error || "오류가 발생했습니다."); }
  };

  const handleToggle = async (f: Factory) => {
    await fetch(`/api/factories/${f.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !f.isActive }),
    });
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/factories/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    load();
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <StoreIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>매장(FACTORY) 관리</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          매장 추가
        </Button>
      </Stack>

      <Paper elevation={0} sx={{ border: "1px solid #e0e0e0" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "#f5f5f5" } }}>
                <TableCell>매장명</TableCell>
                <TableCell>코드</TableCell>
                <TableCell>고객 URL</TableCell>
                <TableCell>주소</TableCell>
                <TableCell>전화번호</TableCell>
                <TableCell align="center">사용자</TableCell>
                <TableCell align="center">제품</TableCell>
                <TableCell align="center">주문</TableCell>
                <TableCell align="center">상태</TableCell>
                <TableCell align="center">관리</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={10} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
              ) : factories.length === 0 ? (
                <TableRow><TableCell colSpan={10} align="center" sx={{ py: 6, color: "text.secondary" }}>등록된 매장이 없습니다</TableCell></TableRow>
              ) : factories.map((f) => (
                <TableRow key={f.id} hover>
                  <TableCell><Typography sx={{ fontWeight: 600 }}>{f.name}</Typography></TableCell>
                  <TableCell><Chip label={f.code} size="small" variant="outlined" /></TableCell>
                  <TableCell>
                    {f.slug ? (
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                        <Typography variant="body2" sx={{ fontFamily: "monospace", color: "primary.main", fontSize: 12 }}>
                          /shop/{f.slug}
                        </Typography>
                        <Tooltip title={copied === f.slug ? "복사됨!" : "URL 복사"}>
                          <IconButton size="small" onClick={() => copyUrl(f.slug!)}>
                            {copied === f.slug
                              ? <LinkIcon sx={{ fontSize: 14, color: "success.main" }} />
                              : <ContentCopyIcon sx={{ fontSize: 14 }} />}
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    ) : (
                      <Typography variant="caption" sx={{ color: "text.disabled" }}>미설정</Typography>
                    )}
                  </TableCell>
                  <TableCell>{f.address || "-"}</TableCell>
                  <TableCell>{f.phone || "-"}</TableCell>
                  <TableCell align="center">{f._count?.users || 0}명</TableCell>
                  <TableCell align="center">{f._count?.products || 0}종</TableCell>
                  <TableCell align="center">{f._count?.orders || 0}건</TableCell>
                  <TableCell align="center">
                    <Tooltip title={f.isActive ? "비활성화" : "활성화"}>
                      <Switch checked={f.isActive} onChange={() => handleToggle(f)} size="small" />
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => openEdit(f)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteId(f.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? "매장 수정" : "매장 추가"}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="매장명 *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
            <TextField label="코드 *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} fullWidth helperText="영문 대문자, 숫자 조합 (예: FACT001)" disabled={!!editTarget} />
            <TextField
              label="영문 URL명"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
              fullWidth
              helperText={form.slug ? `고객 접속 URL: /shop/${form.slug}` : "소문자, 숫자, 하이픈만 사용 (예: gangnam-branch)"}
              slotProps={{ htmlInput: { placeholder: "gangnam-branch" } }}
            />
            <TextField label="주소" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} fullWidth />
            <TextField label="전화번호" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} fullWidth />
            <TextField label="지도 URL (카카오맵, 네이버지도 등)" value={form.mapUrl} onChange={(e) => setForm({ ...form, mapUrl: e.target.value })} fullWidth helperText="찾아오는 길 페이지에서 지도 버튼으로 연결됩니다" />
            <TextField label="주차 안내" value={form.parkingInfo} onChange={(e) => setForm({ ...form, parkingInfo: e.target.value })} fullWidth multiline rows={2} />
            <TextField label="운영 시간" value={form.businessHours} onChange={(e) => setForm({ ...form, businessHours: e.target.value })} fullWidth multiline rows={2} helperText="예: 월-금 09:00~18:00, 토 09:00~13:00" />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : "저장"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>매장 삭제</DialogTitle>
        <DialogContent><Typography>정말로 이 매장을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>취소</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>삭제</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
