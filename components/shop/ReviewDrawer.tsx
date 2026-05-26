"use client";
import { useState, useRef } from "react";
import {
  Drawer, Box, Typography, Stack, Button, TextField, IconButton,
  CircularProgress, Rating, Divider, Avatar,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import ClearIcon from "@mui/icons-material/Clear";
import StarIcon from "@mui/icons-material/Star";

interface Props {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  productImageUrl?: string | null;
  userName: string;
  onSuccess: () => void;
}

const RATING_LABELS: Record<number, string> = {
  1: "별로예요",
  2: "그저 그래요",
  3: "보통이에요",
  4: "좋아요",
  5: "최고예요!",
};

export default function ReviewDrawer({ open, onClose, productId, productName, productImageUrl, userName, onSuccess }: Props) {
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number>(-1);
  const [content, setContent] = useState("");
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setRating(null);
    setHoverRating(-1);
    setContent("");
    setImages([]);
    setError("");
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 5 - images.length;
    files.slice(0, remaining).forEach((file) => {
      const preview = URL.createObjectURL(file);
      setImages((prev) => [...prev, { file, preview }]);
    });
    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const img of images) {
      const fd = new FormData();
      fd.append("file", img.file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("이미지 업로드 실패");
      const data = await res.json();
      urls.push(data.url);
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!rating) { setError("별점을 선택해주세요"); return; }
    if (!content.trim()) { setError("리뷰 내용을 입력해주세요"); return; }
    setError("");
    setSubmitting(true);
    try {
      setUploading(images.length > 0);
      const uploadedUrls = images.length > 0 ? await uploadImages() : [];
      setUploading(false);

      const res = await fetch(`/api/products/${productId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userName,
          content: content.trim(),
          isReview: true,
          rating,
          reviewImages: uploadedUrls,
        }),
      });

      if (res.ok) {
        reset();
        onSuccess();
        onClose();
      } else {
        const d = await res.json();
        setError(d.error || "리뷰 등록 실패");
      }
    } catch {
      setError("오류가 발생했습니다. 다시 시도해주세요");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const displayRating = hoverRating !== -1 ? hoverRating : (rating ?? 0);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      slotProps={{ paper: { sx: { width: { xs: "100%", sm: 420 }, display: "flex", flexDirection: "column" } } }}
    >
      {/* 헤더 */}
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", px: 2.5, py: 2, borderBottom: "1px solid #f0f0f0", flexShrink: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 16 }}>리뷰 작성</Typography>
        <IconButton size="small" onClick={handleClose}><CloseIcon /></IconButton>
      </Stack>

      {/* 상품 정보 */}
      <Stack direction="row" spacing={1.5} sx={{ px: 2.5, py: 2, bgcolor: "#f8f9fa", flexShrink: 0 }}>
        {productImageUrl ? (
          <Box component="img" src={productImageUrl} sx={{ width: 52, height: 52, borderRadius: 1.5, objectFit: "cover", flexShrink: 0 }} />
        ) : (
          <Avatar variant="rounded" sx={{ width: 52, height: 52, bgcolor: "#e0e0e0" }} />
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.4 }}>{productName}</Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>{userName}</Typography>
        </Box>
      </Stack>

      <Divider />

      {/* 폼 */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 2.5, py: 2.5 }}>
        {/* 별점 */}
        <Box sx={{ mb: 3, textAlign: "center" }}>
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5, color: "text.secondary" }}>
            상품은 어떠셨나요?
          </Typography>
          <Rating
            value={rating}
            onChange={(_, v) => { setRating(v); setError(""); }}
            onChangeActive={(_, v) => setHoverRating(v)}
            size="large"
            icon={<StarIcon sx={{ fontSize: 44, color: "#FFC107" }} />}
            emptyIcon={<StarIcon sx={{ fontSize: 44, color: "#e0e0e0" }} />}
          />
          <Typography variant="body2" sx={{ mt: 1, color: displayRating > 0 ? "#FFC107" : "text.disabled", fontWeight: 600, minHeight: 20 }}>
            {displayRating > 0 ? RATING_LABELS[displayRating] : "별점을 선택해주세요"}
          </Typography>
        </Box>

        <Divider sx={{ mb: 2.5 }} />

        {/* 리뷰 내용 */}
        <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>리뷰 내용</Typography>
        <TextField
          multiline rows={4} fullWidth size="small"
          placeholder="상품에 대한 솔직한 후기를 남겨주세요"
          value={content}
          onChange={(e) => { setContent(e.target.value); setError(""); }}
          sx={{ mb: 2.5 }}
        />

        {/* 이미지 업로드 */}
        <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
          사진 첨부
          <Typography component="span" variant="caption" sx={{ color: "text.secondary", ml: 1 }}>
            ({images.length}/5)
          </Typography>
        </Typography>

        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, mb: 0.5 }}>
          {images.map((img, i) => (
            <Box key={i} sx={{ position: "relative", width: 80, height: 80 }}>
              <Box
                component="img" src={img.preview}
                sx={{ width: 80, height: 80, objectFit: "cover", borderRadius: 1.5, border: "1px solid #e0e0e0" }}
              />
              <IconButton
                size="small"
                onClick={() => handleRemoveImage(i)}
                sx={{
                  position: "absolute", top: -8, right: -8,
                  bgcolor: "#333", color: "#fff", width: 20, height: 20,
                  "&:hover": { bgcolor: "#555" },
                }}
              >
                <ClearIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </Box>
          ))}

          {images.length < 5 && (
            <Box
              onClick={() => fileInputRef.current?.click()}
              sx={{
                width: 80, height: 80, border: "1.5px dashed #ccc", borderRadius: 1.5,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "text.disabled",
                "&:hover": { borderColor: "primary.main", color: "primary.main" },
              }}
            >
              <AddPhotoAlternateOutlinedIcon sx={{ fontSize: 26 }} />
              <Typography variant="caption" sx={{ fontSize: 10, mt: 0.25 }}>사진 추가</Typography>
            </Box>
          )}
        </Stack>

        <input
          ref={fileInputRef} type="file" accept="image/*" multiple hidden
          onChange={handleAddImages}
        />

        {error && (
          <Typography variant="caption" sx={{ color: "error.main", display: "block", mt: 1.5 }}>
            {error}
          </Typography>
        )}
      </Box>

      {/* 하단 버튼 */}
      <Box sx={{ px: 2.5, py: 2, borderTop: "1px solid #f0f0f0", flexShrink: 0 }}>
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" onClick={handleClose} disabled={submitting} sx={{ flex: 1, py: 1.2, borderRadius: 2 }}>
            취소
          </Button>
          <Button
            variant="contained" onClick={handleSubmit}
            disabled={submitting || !rating || !content.trim()}
            sx={{ flex: 2, py: 1.2, borderRadius: 2, fontWeight: 700 }}
          >
            {submitting ? (
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <CircularProgress size={16} color="inherit" />
                <span>{uploading ? "업로드 중..." : "등록 중..."}</span>
              </Stack>
            ) : "리뷰 등록"}
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
