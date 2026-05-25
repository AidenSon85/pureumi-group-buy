"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import {
  Box, Paper, Typography, Button, Stack, CircularProgress, Divider,
} from "@mui/material";
import StorefrontIcon from "@mui/icons-material/Storefront";

export default function FactoryLandingClient({
  factoryName,
  factoryCode,
}: {
  factoryName: string;
  factoryCode: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleKakaoLogin = () => {
    setLoading(true);
    signIn("kakao", { callbackUrl: `/shop/setup?f=${factoryCode}` });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #FEE500 0%, #FFDC00 60%, #f5c400 100%)",
        px: 2,
      }}
    >
      <Paper elevation={8} sx={{ p: { xs: 4, sm: 5 }, width: "100%", maxWidth: 400, borderRadius: 3 }}>
        <Stack sx={{ alignItems: "center", mb: 3 }} spacing={1.5}>
          <Box sx={{ bgcolor: "#FEE500", borderRadius: "50%", p: 1.5, border: "3px solid #3C1E1E20" }}>
            <StorefrontIcon sx={{ fontSize: 40, color: "#3C1E1E" }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#3C1E1E", textAlign: "center", fontSize: 20 }}>
            {factoryName}
          </Typography>
          <Typography variant="body2" sx={{ color: "#5a4a2a", textAlign: "center" }}>
            카카오 계정으로 간편하게 로그인하세요
          </Typography>
        </Stack>

        <Button
          fullWidth
          size="large"
          onClick={handleKakaoLogin}
          disabled={loading}
          sx={{
            py: 1.6,
            bgcolor: "#FEE500",
            color: "#3C1E1E",
            fontWeight: 800,
            fontSize: 16,
            borderRadius: 2,
            border: "1px solid #3C1E1E20",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            "&:hover": { bgcolor: "#F6D800" },
            "&:disabled": { bgcolor: "#FEE500", opacity: 0.7 },
          }}
        >
          {loading ? (
            <CircularProgress size={22} sx={{ color: "#3C1E1E" }} />
          ) : (
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <KakaoIcon />
              <span>카카오로 로그인</span>
            </Stack>
          )}
        </Button>

        <Divider sx={{ my: 3 }} />
        <Typography variant="caption" sx={{ color: "#8a7a5a", display: "block", textAlign: "center" }}>
          {factoryName} 공동구매
        </Typography>
      </Paper>
    </Box>
  );
}

function KakaoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#3C1E1E">
      <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.556 5.078 3.938 6.538L5 21l4.188-2.238A11.4 11.4 0 0 0 12 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z" />
    </svg>
  );
}
