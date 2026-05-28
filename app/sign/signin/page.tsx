"use client";
import { Suspense, useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box, Paper, Typography, Button, Stack, CircularProgress, Divider, Alert,
} from "@mui/material";
import StorefrontIcon from "@mui/icons-material/Storefront";

export default function CustomerSignInPage() {
  return (
    <Suspense fallback={<Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#FEE500" }}><CircularProgress /></Box>}>
      <CustomerSignIn />
    </Suspense>
  );
}

function CustomerSignIn() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const factoryCode = searchParams.get("factory");
  const noFactory = searchParams.get("noFactory");

  const [factoryName, setFactoryName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      const factoryId = (session?.user as any)?.factoryId;
      if (factoryId) router.replace("/shop/products");
      else if (factoryCode) router.replace(`/shop/setup?f=${factoryCode}`);
      // factoryId도 factoryCode도 없으면 로그인 페이지에 머뭄 (noFactory 안내 표시)
    }
  }, [status, session, factoryCode, router]);

  useEffect(() => {
    if (!factoryCode) return;
    fetch(`/api/factories?code=${factoryCode}`)
      .then((r) => r.json())
      .then((data) => {
        const found = Array.isArray(data) ? data.find((f: any) => f.code === factoryCode) : null;
        if (found) setFactoryName(found.name);
      })
      .catch(() => {});
  }, [factoryCode]);

  if (status === "loading") {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  // 인증됐지만 매장 배정 대기 중(factoryId·factoryCode 둘 다 없음) → 페이지 내용 표시
  // 인증됐고 이동 예정 → 스피너
  if (status === "authenticated") {
    const factoryId = (session?.user as any)?.factoryId;
    if (factoryId || factoryCode) {
      return (
        <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      );
    }
  }

  const handleKakaoLogin = () => {
    setLoading(true);
    const callbackUrl = factoryCode ? `/shop/setup?f=${factoryCode}` : "/shop/products";
    signIn("kakao", { callbackUrl });
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
          {factoryName ? (
            <>
              <Box sx={{ bgcolor: "#FEE500", borderRadius: "50%", p: 1.5 }}>
                <StorefrontIcon sx={{ fontSize: 36, color: "#3C1E1E" }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#3C1E1E", textAlign: "center" }}>
                {factoryName}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center" }}>
                카카오 계정으로 간편하게 로그인하세요
              </Typography>
            </>
          ) : (
            <>
              <Box sx={{ bgcolor: "#FEE500", borderRadius: "50%", p: 1.5 }}>
                <StorefrontIcon sx={{ fontSize: 36, color: "#3C1E1E" }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#3C1E1E" }}>
                PUREUMI
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center" }}>
                카카오 계정으로 로그인하세요
              </Typography>
            </>
          )}
        </Stack>

        {noFactory && (
          <Alert severity="info" sx={{ mb: 2, fontSize: 13 }}>
            매장에서 제공한 링크로 접속해 주세요.<br />
            링크가 없으면 매장에 문의하세요.
          </Alert>
        )}

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
        <Typography variant="caption" sx={{ color: "text.disabled", display: "block", textAlign: "center" }}>
          PUREUMI 그룹구매
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
