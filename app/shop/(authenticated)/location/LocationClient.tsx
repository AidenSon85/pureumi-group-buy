"use client";
import {
  Box, Typography, Paper, Button, Divider, Stack,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import MapIcon from "@mui/icons-material/Map";

interface Factory {
  name: string;
  address: string | null;
  phone: string | null;
  mapUrl: string | null;
  parkingInfo: string | null;
  businessHours: string | null;
}

export default function LocationClient({ factory }: { factory: Factory }) {
  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <LocationOnIcon color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>찾아오는 길</Typography>
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}>
        {factory.name}
      </Typography>

      <Stack spacing={2}>
        {factory.address && (
          <Paper elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden" }}>
            <Box
              component="iframe"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(factory.address)}&output=embed&hl=ko`}
              sx={{ width: "100%", height: 240, border: "none", display: "block" }}
              loading="lazy"
            />
            <Box sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                <LocationOnIcon sx={{ color: "text.secondary", mt: 0.2, flexShrink: 0 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>주소</Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.6 }}>
                    {factory.address}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<MapIcon />}
                    href={factory.mapUrl || `https://maps.google.com/maps?q=${encodeURIComponent(factory.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ mt: 1.5, textTransform: "none", fontWeight: 600 }}
                  >
                    지도로 보기
                  </Button>
                </Box>
              </Box>
            </Box>
          </Paper>
        )}

        {factory.phone && (
          <Paper elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 2, p: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
              <PhoneIcon sx={{ color: "text.secondary", mt: 0.2, flexShrink: 0 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>전화번호</Typography>
                <Button
                  href={`tel:${factory.phone}`}
                  sx={{ textTransform: "none", p: 0, fontWeight: 400, fontSize: 14, color: "primary.main" }}
                >
                  {factory.phone}
                </Button>
              </Box>
            </Box>
          </Paper>
        )}

        {factory.businessHours && (
          <Paper elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 2, p: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
              <AccessTimeIcon sx={{ color: "text.secondary", mt: 0.2, flexShrink: 0 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>운영 시간</Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", whiteSpace: "pre-line", lineHeight: 1.7 }}>
                  {factory.businessHours}
                </Typography>
              </Box>
            </Box>
          </Paper>
        )}

        {factory.parkingInfo && (
          <Paper elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 2, p: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
              <DirectionsCarIcon sx={{ color: "text.secondary", mt: 0.2, flexShrink: 0 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>주차 안내</Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", whiteSpace: "pre-line", lineHeight: 1.7 }}>
                  {factory.parkingInfo}
                </Typography>
              </Box>
            </Box>
          </Paper>
        )}

        {!factory.address && !factory.phone && !factory.businessHours && !factory.parkingInfo && (
          <Paper elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 2, p: 4, textAlign: "center" }}>
            <LocationOnIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
            <Typography color="text.secondary">위치 정보가 아직 등록되지 않았습니다.</Typography>
          </Paper>
        )}
      </Stack>
    </Box>
  );
}
