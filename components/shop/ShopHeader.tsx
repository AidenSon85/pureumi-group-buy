"use client";
import {
  AppBar, Toolbar, Typography, IconButton, Badge, Box, Button, Avatar, Stack,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import LogoutIcon from "@mui/icons-material/Logout";
import { useCart } from "./CartContext";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Props {
  userName: string;
  factoryName: string;
}

export default function ShopHeader({ userName, factoryName }: Props) {
  const { count } = useCart();
  const router = useRouter();

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{ bgcolor: "#fff", color: "#1a237e", borderBottom: "1px solid #e0e0e0" }}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer" }}
          onClick={() => router.push("/shop/products")}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#1a237e", letterSpacing: -0.5 }}>
            PUREUMI
          </Typography>
          {factoryName && (
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", pl: 1.5, borderLeft: "1px solid #e0e0e0" }}
            >
              {factoryName}
            </Typography>
          )}
        </Box>

        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          <Button
            startIcon={<ReceiptLongIcon />}
            onClick={() => router.push("/shop/orders")}
            sx={{ color: "text.secondary", textTransform: "none" }}
          >
            주문내역
          </Button>
          <IconButton onClick={() => router.push("/shop/cart")} sx={{ color: "#1a237e" }}>
            <Badge badgeContent={count} color="error" max={99}>
              <ShoppingCartIcon />
            </Badge>
          </IconButton>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", ml: 1, pl: 1.5, borderLeft: "1px solid #e0e0e0" }}>
            <Avatar sx={{ width: 30, height: 30, bgcolor: "#1a237e", fontSize: 13 }}>
              {userName[0]}
            </Avatar>
            <Typography variant="body2" sx={{ color: "text.secondary", display: { xs: "none", sm: "block" } }}>
              {userName}
            </Typography>
            <IconButton
              size="small"
              onClick={() => signOut({ callbackUrl: "/sign/signin_mng" })}
              sx={{ color: "text.secondary" }}
              title="로그아웃"
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
