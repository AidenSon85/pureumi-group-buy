"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Box, Paper, Typography, TextField, Button, Alert, CircularProgress,
  InputAdornment, IconButton, Stack, Divider,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

export default function AdminSignInPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await signIn("credentials", { redirect: false, email: form.email, password: form.password });
    setLoading(false);
    if (res?.ok) router.push("/");
    else setError("이메일 또는 비밀번호가 올바르지 않습니다.");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%)",
      }}
    >
      <Paper
        elevation={24}
        sx={{ p: 5, width: "100%", maxWidth: 420, borderRadius: 3 }}
        component="form"
        onSubmit={handleSubmit}
      >
        <Stack alignItems="center" spacing={1} mb={4}>
          <Box sx={{ bgcolor: "#1a237e", borderRadius: "50%", p: 1.5, mb: 1 }}>
            <AdminPanelSettingsIcon sx={{ fontSize: 36, color: "#fff" }} />
          </Box>
          <Typography variant="h5" fontWeight={800} color="#1a237e">
            PUREUMI 관리자
          </Typography>
          <Typography variant="body2" color="text.secondary">
            관리자 계정으로 로그인하세요
          </Typography>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Stack spacing={2.5}>
          <TextField
            label="이메일"
            type="email"
            fullWidth
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            InputProps={{
              startAdornment: <InputAdornment position="start"><EmailIcon color="action" /></InputAdornment>,
            }}
            autoComplete="email"
          />
          <TextField
            label="비밀번호"
            type={showPw ? "text" : "password"}
            fullWidth
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            InputProps={{
              startAdornment: <InputAdornment position="start"><LockIcon color="action" /></InputAdornment>,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPw(!showPw)} edge="end" size="small">
                    {showPw ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            autoComplete="current-password"
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
            sx={{ py: 1.5, fontSize: 16, fontWeight: 700, bgcolor: "#1a237e", "&:hover": { bgcolor: "#283593" } }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "로그인"}
          </Button>
        </Stack>

        <Divider sx={{ my: 3 }} />
        <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
          PUREUMI 그룹구매 관리 시스템 v1.0
        </Typography>
      </Paper>
    </Box>
  );
}
