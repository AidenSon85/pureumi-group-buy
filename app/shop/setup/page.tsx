"use client";
import { Suspense, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";

export default function ShopSetupPage() {
  return (
    <Suspense fallback={<Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><CircularProgress /></Box>}>
      <ShopSetup />
    </Suspense>
  );
}

function ShopSetup() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const factoryCode = searchParams.get("f");

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/sign/signin");
      return;
    }

    const userFactoryId = (session?.user as any)?.factoryId;
    if (userFactoryId) {
      router.replace("/shop");
      return;
    }

    if (!factoryCode) {
      router.replace("/sign/signin?noFactory=1");
      return;
    }

    fetch("/api/users/setup-factory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ factoryCode }),
    })
      .then((r) => r.json())
      .then(async (data) => {
        if (data.factoryId) {
          await update({ factoryId: data.factoryId });
        }
        router.replace("/shop");
      })
      .catch(() => router.replace("/shop"));
  }, [status, session, factoryCode, router, update]);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
      <CircularProgress sx={{ color: "#FEE500" }} />
      <Typography variant="body2" sx={{ color: "text.secondary" }}>매장 정보를 설정하는 중...</Typography>
    </Box>
  );
}
