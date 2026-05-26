"use client";
import {
  AppBar, Toolbar, Typography, IconButton, Box, Avatar, Stack, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CloseIcon from "@mui/icons-material/Close";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface FactoryLocation {
  address: string | null;
  phone: string | null;
  mapUrl: string | null;
  parkingInfo: string | null;
  businessHours: string | null;
}

interface Props {
  userName: string;
  factoryName: string;
  factoryLocation?: FactoryLocation;
}

export default function ShopHeader({ userName, factoryName, factoryLocation }: Props) {
  const router = useRouter();
  const [locationOpen, setLocationOpen] = useState(false);

  const hasLocation = factoryLocation && (
    factoryLocation.address || factoryLocation.phone ||
    factoryLocation.parkingInfo || factoryLocation.businessHours
  );

  const mapSrc = factoryLocation?.mapUrl
    ? factoryLocation.mapUrl
    : factoryLocation?.address
      ? `https://maps.google.com/maps?q=${encodeURIComponent(factoryLocation.address)}&output=embed&hl=ko`
      : null;

  return (
    <>
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

          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            {hasLocation && (
              <>
                <Button
                  size="small"
                  startIcon={<LocationOnIcon fontSize="small" />}
                  onClick={() => setLocationOpen(true)}
                  sx={{ textTransform: "none", fontWeight: 600, color: "#1a237e", fontSize: 13, display: { xs: "none", sm: "flex" } }}
                >
                  찾아오는 길
                </Button>
                <IconButton
                  size="small"
                  onClick={() => setLocationOpen(true)}
                  sx={{ color: "#1a237e", display: { xs: "flex", sm: "none" } }}
                  title="찾아오는 길"
                >
                  <LocationOnIcon fontSize="small" />
                </IconButton>
              </>
            )}
            <Button
              size="small"
              startIcon={<ReceiptLongIcon fontSize="small" />}
              onClick={() => router.push("/shop/orders")}
              sx={{ textTransform: "none", fontWeight: 600, color: "#1a237e", fontSize: 13, display: { xs: "none", sm: "flex" } }}
            >
              주문내역
            </Button>
            <IconButton
              size="small"
              onClick={() => router.push("/shop/orders")}
              sx={{ color: "#1a237e", display: { xs: "flex", sm: "none" } }}
              title="주문내역"
            >
              <ReceiptLongIcon fontSize="small" />
            </IconButton>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", pl: 1.5, borderLeft: "1px solid #e0e0e0" }}>
              <Avatar sx={{ width: 30, height: 30, bgcolor: "#1a237e", fontSize: 13 }}>
                {userName[0]}
              </Avatar>
              <Typography variant="body2" sx={{ color: "text.secondary", display: { xs: "none", sm: "block" } }}>
                {userName}
              </Typography>
              <IconButton
                size="small"
                onClick={() => signOut({ callbackUrl: "/sign/signin" })}
                sx={{ color: "text.secondary" }}
                title="로그아웃"
              >
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
        </Toolbar>
      </AppBar>

      <Dialog
        open={locationOpen}
        onClose={() => setLocationOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: { sx: { borderRadius: 3, overflow: "hidden" } },
          backdrop: { sx: { bgcolor: "rgba(0,0,0,0.3)" } },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
          찾아오는 길
          <IconButton size="small" onClick={() => setLocationOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {mapSrc && (
            <Box
              component="iframe"
              src={mapSrc}
              sx={{ width: "100%", height: 260, border: "none", display: "block" }}
              loading="lazy"
            />
          )}

          <Box sx={{ px: 3, py: 2.5 }}>
            {factoryLocation?.address && (
              <Typography variant="body2" sx={{ mb: 0.5, lineHeight: 1.7 }}>
                {factoryLocation.address}
              </Typography>
            )}
            {factoryLocation?.businessHours && (
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 0.5, whiteSpace: "pre-line", lineHeight: 1.7 }}>
                {factoryLocation.businessHours}
              </Typography>
            )}
            {factoryLocation?.parkingInfo && (
              <Typography variant="body2" sx={{ color: "text.secondary", whiteSpace: "pre-line", lineHeight: 1.7 }}>
                주차안내 : {factoryLocation.parkingInfo}
              </Typography>
            )}
            {factoryLocation?.phone && (
              <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
                {factoryLocation.phone}
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={() => setLocationOpen(false)} sx={{ borderRadius: 5, px: 3 }}>
            닫기
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
