"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Chip, Switch, Tooltip, Stack,
  Alert, CircularProgress, Select, MenuItem, FormControl, InputLabel,
  TablePagination, Avatar, TextField, InputAdornment, Drawer, Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import PeopleIcon from "@mui/icons-material/People";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";

interface Factory { id: string; name: string }
interface User {
  id: string; email: string; name: string; nickname: string | null;
  phone: string | null; role: string; isActive: boolean; createdAt: string;
  factory: Factory | null; gender: string | null; ageRange: string | null; birthyear: string | null;
}

const ROLES = ["ADMIN", "MANAGER", "CUSTOMER"];
const ROLE_COLORS: Record<string, "error" | "warning" | "default"> = {
  ADMIN: "error", MANAGER: "warning", CUSTOMER: "default",
};
const ROLE_LABELS: Record<string, string> = {
  ADMIN: "관리자", MANAGER: "매니저", CUSTOMER: "고객",
};
const GENDER_LABELS: Record<string, string> = { male: "남성", female: "여성" };
const DRAWER_WIDTH = 480;

const emptyForm = () => ({
  name: "", nickname: "", email: "", password: "", phone: "",
  role: "CUSTOMER", factoryId: "", isActive: true,
  gender: "", ageRange: "", birthyear: "",
});

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

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

  const openCreate = () => {
    setEditTarget(null); setForm(emptyForm()); setError(""); setDrawerOpen(true);
  };
  const openEdit = (u: User) => {
    setEditTarget(u);
    setForm({
      name: u.name, nickname: u.nickname || "", email: u.email, password: "",
      phone: u.phone || "", role: u.role, factoryId: u.factory?.id || "",
      isActive: u.isActive, gender: u.gender || "", ageRange: u.ageRange || "", birthyear: u.birthyear || "",
    });
    setError(""); setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) { setError("이름과 이메일은 필수입니다."); return; }
    if (!editTarget && !form.password) { setError("비밀번호를 입력해주세요."); return; }
    setSaving(true);
    const url = editTarget ? `/api/users/${editTarget.id}` : "/api/users";
    const method = editTarget ? "PUT" : "POST";
    const payload: any = {
      name: form.name, nickname: form.nickname || null,
      email: form.email, phone: form.phone || null,
      role: form.role, factoryId: form.factoryId || "",
      isActive: form.isActive,
      gender: form.gender || null, ageRange: form.ageRange || null, birthyear: form.birthyear || null,
    };
    if (form.password) payload.password = form.password;
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (res.ok) { setDrawerOpen(false); load(); }
    else { const d = await res.json(); setError(d.error || "오류가 발생했습니다."); }
  };

  const handleToggle = async (u: User) => {
    await fetch(`/api/users/${u.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !u.isActive }) });
    load();
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PeopleIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>사용자 관리</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
          sx={{ bgcolor: "#1a237e", "&:hover": { bgcolor: "#283593" }, textTransform: "none", fontWeight: 700 }}>
          사용자 추가
        </Button>
      </Stack>

      <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #e0e0e0" }}>
        <Stack direction="row" spacing={2}>
          <TextField
            size="small" placeholder="이름, 이메일 검색" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
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
          <Table size="small">
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "#f5f5f5", py: 1.5 } }}>
                <TableCell>이름 / 닉네임</TableCell>
                <TableCell>연락처</TableCell>
                <TableCell>역할</TableCell>
                <TableCell>소속 매장</TableCell>
                <TableCell>성별 / 나이대</TableCell>
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
                      <Avatar sx={{ width: 30, height: 30, fontSize: 13, bgcolor: "#1976d220", color: "#1976d2" }}>{u.name[0]}</Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{u.name}</Typography>
                        {u.nickname && <Typography variant="caption" sx={{ color: "text.secondary" }}>{u.nickname}</Typography>}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 13 }}>{u.phone || "-"}</Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>{u.email}</Typography>
                  </TableCell>
                  <TableCell><Chip label={ROLE_LABELS[u.role]} size="small" color={ROLE_COLORS[u.role]} variant="outlined" /></TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{u.factory?.name || "-"}</TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 13 }}>{u.gender ? GENDER_LABELS[u.gender] || u.gender : "-"}</Typography>
                    {u.ageRange && <Typography variant="caption" sx={{ color: "text.secondary" }}>{u.ageRange}</Typography>}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title={u.isActive ? "비활성화" : "활성화"}>
                      <Switch checked={u.isActive} onChange={() => handleToggle(u)} size="small" />
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => openEdit(u)} sx={{ color: "primary.main" }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
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

      {/* Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        variant="persistent"
        sx={{
          "& .MuiDrawer-paper": {
            width: { xs: "100vw", sm: DRAWER_WIDTH },
            position: "fixed", top: 64,
            height: "calc(100vh - 64px)",
            boxShadow: "-4px 0 20px rgba(0,0,0,0.1)",
            borderLeft: "1px solid #e0e0e0",
          },
        }}
      >
        {/* 헤더 */}
        <Box sx={{ px: 3, py: 2, bgcolor: "#1a237e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {editTarget ? "사용자 수정" : "사용자 추가"}
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
              {editTarget ? editTarget.name : "새 사용자를 등록합니다"}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained" startIcon={saving ? undefined : <SaveIcon />} onClick={handleSave} disabled={saving}
              sx={{ bgcolor: "#fff", color: "#1a237e", "&:hover": { bgcolor: "#e8eaf6" }, textTransform: "none", fontWeight: 700 }}
            >
              {saving ? <CircularProgress size={18} color="inherit" /> : "저장"}
            </Button>
            <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: "#fff" }}><CloseIcon /></IconButton>
          </Stack>
        </Box>

        {/* 내용 */}
        <Box sx={{ overflowY: "auto", flex: 1, px: 3, py: 2.5 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

          {/* 기본 정보 */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main", mb: 1.5 }}>기본 정보</Typography>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <TextField label="이름 *" size="small" fullWidth value={form.name} onChange={(e) => set("name", e.target.value)} />
              <TextField label="닉네임" size="small" fullWidth value={form.nickname} onChange={(e) => set("nickname", e.target.value)} />
            </Stack>
            <TextField label="전화번호" size="small" fullWidth value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="010-0000-0000" />
            <TextField label="이메일 *" size="small" type="email" fullWidth value={form.email} onChange={(e) => set("email", e.target.value)} disabled={!!editTarget} />
            <TextField
              label={editTarget ? "비밀번호 (변경 시에만 입력)" : "비밀번호 *"}
              size="small" type="password" fullWidth value={form.password}
              onChange={(e) => set("password", e.target.value)}
            />
          </Stack>

          <Divider sx={{ my: 3 }} />

          {/* 권한 & 소속 */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main", mb: 1.5 }}>권한 & 소속</Typography>
          <Stack spacing={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>역할</InputLabel>
              <Select value={form.role} label="역할" onChange={(e) => set("role", e.target.value)}>
                {ROLES.map((r) => (
                  <MenuItem key={r} value={r}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <Chip label={ROLE_LABELS[r]} size="small" color={ROLE_COLORS[r]} variant="outlined" sx={{ fontWeight: 700 }} />
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {(form.role === "MANAGER" || form.role === "CUSTOMER") && (
              <FormControl size="small" fullWidth>
                <InputLabel>소속 매장</InputLabel>
                <Select value={form.factoryId} label="소속 매장" onChange={(e) => set("factoryId", e.target.value)}>
                  <MenuItem value="">없음</MenuItem>
                  {factories.map((f) => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
                </Select>
              </FormControl>
            )}
            <FormControl size="small" fullWidth>
              <InputLabel>계정 상태</InputLabel>
              <Select value={form.isActive ? "active" : "inactive"} label="계정 상태"
                onChange={(e) => set("isActive", e.target.value === "active")}>
                <MenuItem value="active">활성</MenuItem>
                <MenuItem value="inactive">비활성</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Divider sx={{ my: 3 }} />

          {/* 개인 정보 */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main", mb: 1.5 }}>개인 정보</Typography>
          <Stack spacing={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>성별</InputLabel>
              <Select value={form.gender} label="성별" onChange={(e) => set("gender", e.target.value)}>
                <MenuItem value="">미설정</MenuItem>
                <MenuItem value="male">남성</MenuItem>
                <MenuItem value="female">여성</MenuItem>
              </Select>
            </FormControl>
            <Stack direction="row" spacing={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>나이대</InputLabel>
                <Select value={form.ageRange} label="나이대" onChange={(e) => set("ageRange", e.target.value)}>
                  <MenuItem value="">미설정</MenuItem>
                  {["10~19", "20~29", "30~39", "40~49", "50~59", "60~69", "70~"].map((r) => (
                    <MenuItem key={r} value={r}>{r}세</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField label="출생연도" size="small" fullWidth value={form.birthyear}
                onChange={(e) => set("birthyear", e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="예: 1990" slotProps={{ htmlInput: { inputMode: "numeric" } }} />
            </Stack>
          </Stack>
        </Box>
      </Drawer>
    </Box>
  );
}
