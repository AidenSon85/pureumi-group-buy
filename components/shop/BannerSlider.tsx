"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Box, IconButton } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

interface Banner {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
  title: string | null;
}

const AUTO_INTERVAL = 4000;

export default function BannerSlider({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const next = useCallback(() => setCurrent((c) => (c + 1) % banners.length), [banners.length]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + banners.length) % banners.length), [banners.length]);

  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current);
    if (banners.length > 1) timerRef.current = setInterval(next, AUTO_INTERVAL);
  }, [next, banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    timerRef.current = setInterval(next, AUTO_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [next, banners.length]);

  if (!banners.length) return null;

  return (
    <Box sx={{ mb: 2, borderRadius: { xs: 0, sm: 2 }, overflow: "hidden", border: { xs: "none", sm: "1px solid #e8e8e8" }, mx: { xs: -2, sm: 0 } }}>
      <Box
        sx={{ position: "relative", aspectRatio: "16/5", minHeight: { xs: 120 }, bgcolor: "#f5f5f5" }}
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(dx) < 30) return;
          dx < 0 ? next() : prev();
          resetTimer();
        }}
      >
        {banners.map((b, i) => (
          <Box
            key={b.id}
            component={b.linkUrl ? "a" : "div"}
            {...(b.linkUrl ? { href: b.linkUrl, target: "_blank", rel: "noopener noreferrer" } : {})}
            sx={{
              position: "absolute",
              inset: 0,
              opacity: i === current ? 1 : 0,
              transition: "opacity 0.5s ease",
              cursor: b.linkUrl ? "pointer" : "default",
              display: "block",
            }}
          >
            <Box
              component="img"
              src={b.imageUrl}
              alt={b.title || "배너"}
              sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </Box>
        ))}

        {banners.length > 1 && (
          <>
            <IconButton
              size="small"
              onClick={() => { prev(); resetTimer(); }}
              sx={{ position: "absolute", left: 6, top: "50%", transform: "translateY(-50%)", bgcolor: "rgba(0,0,0,0.35)", color: "#fff", p: 0.4, "&:hover": { bgcolor: "rgba(0,0,0,0.6)" } }}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => { next(); resetTimer(); }}
              sx={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", bgcolor: "rgba(0,0,0,0.35)", color: "#fff", p: 0.4, "&:hover": { bgcolor: "rgba(0,0,0,0.6)" } }}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </>
        )}
      </Box>

      {banners.length > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5, py: 0.8, bgcolor: "#fff" }}>
          {banners.map((_, i) => (
            <Box
              key={i}
              onClick={() => { setCurrent(i); resetTimer(); }}
              sx={{
                width: i === current ? 18 : 6,
                height: 6,
                borderRadius: 3,
                bgcolor: i === current ? "primary.main" : "#ddd",
                transition: "all 0.3s",
                cursor: "pointer",
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
