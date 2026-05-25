"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Chip, Switch, Tooltip, Stack,
  Alert, CircularProgress, Select, MenuItem, FormControl, InputLabel,
  TablePagination, Avatar,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import PeopleIcon from "@mui/icons-material/People";
import InputAdornment from "@mui/material/InputAdornment";

interface Factory { id: string; name: string }
interface User {
  id: string; email: string; name: string; phone: string | null;
  role: string; isActive: boolean; createdAt: string;
  factory: Factory | null;
}

const ROLES = ["ADMIN", "MANAGER", "CUSTOMER"];
const ROLE_COLORS: Record<string, "error" | "warning" | "default"> = {
  ADMIN: "error", MANAGER: "warning", CUSTOMER: "default",
};
const ROLE_LABELS: Record<string, string> = {
  ADMIN: "관리자", MANAGER: "매니저", CUSTOMER: "고객",
};

const emptyForm = { name: "", email: "", password: "", phone: "", role: "CUSTOMER", factoryId: "", isActive: true };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(page), limit: "20", search, role: roleFilter });
    fetch(`/api/users?${q}`).then((r) => r.json()).then((d) => {
      setUsers(d.users || []); setTotal(d.total || 0); setLoading(false);
    }).catch(() => setLoading(false));
  }, [page, search, roleFilter]);

  useEffect(() => {
    fetch("/api/factories").then((r) => r.json()).then(setFactories);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditTarget(null); setForm(emptyForm); setError(""); setDialogOpen(true); };
  const openEdit = (u: User) => {
    setEditTarget(u);
    setForm({ name: u.name, email: u.email, password: "", phone: u.phone || "", role: u.role, factoryId: u.factory?.id || "", isActive: u.isActive });
    setError(""); setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) { setError("이름과 이메일은 필수입니다."); return; }
    if (!editTarget && !form.password) { setError("비밀번호를 입력해주세요."); return; }
    setSaving(true);
    const url = editTarget ? `/api/users/${editTarget.id}` : "/api/users";
    const method = editTarget ? "PUT" : "POST";
    const body = editTarget ? { ...form, password: form.password || undefined } : form;
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) { setDialogOpen(false); load(); }
    else { const d = await res.json(); setError(d.error || "오류가 발생했습니다."); }
  };

  const handleToggle = async (u: User) => {
    await fetch(`/api/users/${u.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !u.isActive }) });
    load();
  };

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PeopleIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>사용자(USER) 관리</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>사용자 추가</Button>
      </Stack>

      <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #e0e0e0" }}>
        <Stack direction="row" spacing={2}>
          <TextField
            size="small" placeholder="이름, 이메일 검색" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            slotProps={{
              input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }
            }}
            sx={{ width: 280 }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>역할</InputLabel>
            <Select value={roleFilter} label="역할" onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}>
              <MenuItem value="">전체</MenuItem>
              {ROLES.map((r) => <MenuItem key={r} value={r}>{ROLE_LABELS[r]}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: "1px solid #e0e0e0" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "#f5f5f5" } }}>
                <TableCell>이름</TableCell>
                <TableCell>이메일</TableCell>
                <TableCell>전화번호</TableCell>
                <TableCell>역할</TableCell>
                <TableCell>소속 매장</TableCell>
                <TableCell align="center">상태</TableCell>
                <TableCell align="center">관리</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
              ) : users.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>검색 결과가 없습니다</TableCell></TableRow>
              ) : users.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: "#1976d220", color: "#1976d2" }}>{u.name[0]}</Avatar>
                      <Typography sx={{ fontWeight: 500 }}>{u.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.phone || "-"}</TableCell>
                  <TableCell><Chip label={ROLE_LABELS[u.role]} size="small" color={ROLE_COLORS[u.role]} variant="outlined" /></TableCell>
                  <TableCell>{u.factory?.name || "-"}</TableCell>
                  <TableCell align="center">
                    <Tooltip title={u.isActive ? "비활성화" : "활성화"}>
                      <Switch checked={u.isActive} onChange={() => handleToggle(u)} size="small" />
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => openEdit(u)}><EditIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div" count={total} page={page} rowsPerPage={20}
          onPageChange={(_, p) => setPage(p)} rowsPerPageOptions={[20]}
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 전체 ${count}명`}
        />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? "사용자 수정" : "사용자 추가"}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="이름 *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
            <TextField label="이메일 *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} fullWidth disabled={!!editTarget} />
            <TextField
              label={editTarget ? "비밀번호 (변경 시에만 입력)" : "비밀번호 *"}
              type="password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} fullWidth
            />
            <TextField label="전화번호" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} fullWidth />
            <FormControl fullWidth>
              <InputLabel>역할</InputLabel>
              <Select value={form.role} label="역할" onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => <MenuItem key={r} value={r}>{ROLE_LABELS[r]}</MenuItem>)}
              </Select>
            </FormControl>
            {(form.role === "MANAGER" || form.role === "CUSTOMER") && (
              <FormControl fullWidth>
                <InputLabel>소속 매장</InputLabel>
                <Select value={form.factoryId} label="소속 매장" onChange={(e) => setForm({ ...form, factoryId: e.target.value })}>
                  <MenuItem value="">없음</MenuItem>
                  {factories.map((f) => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
                </Select>
              </FormControl>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : "저장"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
