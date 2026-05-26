"use client";
import { useState, useEffect } from "react";
import {
  Box, Typography, Stack, Paper, Avatar, Chip, CircularProgress,
  Divider, IconButton, Dialog,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import CloseIcon from "@mui/icons-material/Close";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useRouter } from "next/navigation";

interface Review {
  id: string;
  content: string | null;
  rating: number | null;
  reviewImages: string[];
  createdAt: string;
  product: { id: string; name: string; imageUrl: string | null };
}

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

export default function MyReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  useEffect(() => {
    fetch("/api/shop/reviews")
      .then((r) => r.json())
      .then((d) => { setReviews(d || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ maxWidth: 640, mx: "auto", pb: 6 }}>
      <Stack direction="row" sx={{ alignItems: "center", mb: 2.5, gap: 1 }}>
        <IconButton size="small" onClick={() => router.back()}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <RateReviewOutlinedIcon color="primary" fontSize="small" />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>내 리뷰</Typography>
      </Stack>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      ) : reviews.length === 0 ? (
        <Paper elevation={0} sx={{ py: 10, textAlign: "center", border: "1px solid #e0e0e0", borderRadius: 2 }}>
          <RateReviewOutlinedIcon sx={{ fontSize: 56, color: "#e0e0e0", display: "block", mx: "auto", mb: 2 }} />
          <Typography sx={{ color: "text.secondary" }}>작성한 리뷰가 없습니다</Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {reviews.map((rv) => (
            <Paper key={rv.id} elevation={0} sx={{ border: "1px solid #f0f0f0", borderRadius: 2, overflow: "hidden" }}>
              {/* 상품 정보 */}
              <Stack
                direction="row" spacing={1.5}
                sx={{ px: 2, py: 1.5, bgcolor: "#f8f9fa", alignItems: "center", cursor: "pointer", "&:active": { bgcolor: "#f0f0f0" } }}
                onClick={() => router.push(`/shop/products/${rv.product.id}`)}
              >
                {rv.product.imageUrl ? (
                  <Box component="img" src={rv.product.imageUrl}
                    sx={{ width: 44, height: 44, borderRadius: 1.5, objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <Avatar variant="rounded" sx={{ width: 44, height: 44, bgcolor: "#e0e0e0", flexShrink: 0 }} />
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }} noWrap>
                    {rv.product.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.disabled" }}>{formatDate(rv.createdAt)}</Typography>
                </Box>
              </Stack>

              <Divider />

              {/* 리뷰 내용 */}
              <Box sx={{ px: 2, py: 1.5 }}>
                {rv.rating && (
                  <Stack direction="row" spacing={0.25} sx={{ mb: 1 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      s <= rv.rating!
                        ? <StarIcon key={s} sx={{ fontSize: 18, color: "#FFC107" }} />
                        : <StarBorderIcon key={s} sx={{ fontSize: 18, color: "#e0e0e0" }} />
                    ))}
                  </Stack>
                )}
                {rv.content && (
                  <Typography variant="body2" sx={{ color: "text.primary", lineHeight: 1.7, mb: rv.reviewImages?.length ? 1.5 : 0 }}>
                    {rv.content}
                  </Typography>
                )}
                {rv.reviewImages?.length > 0 && (
                  <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", gap: 0.75 }}>
                    {rv.reviewImages.map((img, i) => (
                      <Box key={i} component="img" src={img}
                        sx={{ width: 80, height: 80, objectFit: "cover", borderRadius: 1.5, border: "1px solid #e0e0e0", cursor: "pointer" }}
                        onClick={() => setLightbox({ images: rv.reviewImages, index: i })}
                      />
                    ))}
                  </Stack>
                )}
              </Box>
            </Paper>
          ))}
        </Stack>
      )}

      {/* 이미지 라이트박스 */}
      <Dialog
        open={!!lightbox}
        onClose={() => setLightbox(null)}
        maxWidth={false}
        slotProps={{ paper: { sx: { bgcolor: "transparent", boxShadow: "none", m: 1, overflow: "visible" } } }}
        sx={{ "& .MuiDialog-container": { bgcolor: "rgba(0,0,0,0.88)" } }}
      >
        {lightbox && (
          <Box sx={{ position: "relative" }}>
            <IconButton
              onClick={() => setLightbox(null)}
              sx={{ position: "absolute", top: -14, right: -14, bgcolor: "rgba(255,255,255,0.15)", color: "#fff", width: 30, height: 30, zIndex: 10, "&:hover": { bgcolor: "rgba(255,255,255,0.3)" } }}
              size="small"
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <Box sx={{
              width: { xs: "92vw", sm: 560 }, height: { xs: "92vw", sm: 560 },
              bgcolor: "#111", borderRadius: 2, overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
            }}>
              <Box component="img" src={lightbox.images[lightbox.index]}
                sx={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
              {lightbox.images.length > 1 && (
                <>
                  <IconButton
                    onClick={() => setLightbox((l) => l ? { ...l, index: (l.index - 1 + l.images.length) % l.images.length } : null)}
                    sx={{ position: "absolute", left: 6, bgcolor: "rgba(0,0,0,0.45)", color: "#fff", width: 34, height: 34 }}
                  >
                    <NavigateBeforeIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => setLightbox((l) => l ? { ...l, index: (l.index + 1) % l.images.length } : null)}
                    sx={{ position: "absolute", right: 6, bgcolor: "rgba(0,0,0,0.45)", color: "#fff", width: 34, height: 34 }}
                  >
                    <NavigateNextIcon />
                  </IconButton>
                </>
              )}
            </Box>
            {lightbox.images.length > 1 && (
              <Stack direction="row" spacing={0.75} sx={{ justifyContent: "center", mt: 1.5 }}>
                {lightbox.images.map((_, i) => (
                  <Box key={i} onClick={() => setLightbox((l) => l ? { ...l, index: i } : null)}
                    sx={{ width: i === lightbox.index ? 20 : 6, height: 6, borderRadius: 3, bgcolor: i === lightbox.index ? "#fff" : "rgba(255,255,255,0.35)", cursor: "pointer", transition: "all 0.2s" }} />
                ))}
              </Stack>
            )}
          </Box>
        )}
      </Dialog>
    </Box>
  );
}
