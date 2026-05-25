"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Typography, Chip, Stack, CircularProgress, Button,
  Divider, IconButton, Tab, Tabs, Paper, TextField, Avatar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import ImageIcon from "@mui/icons-material/Image";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import InventoryOutlinedIcon from "@mui/icons-material/InventoryOutlined";
import CommentIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonIcon from "@mui/icons-material/Person";

interface Product {
  id: string; name: string; description: string | null; content: string | null;
  price: number; salePrice: number | null; unit: string; stock: number;
  imageUrl: string | null; images: string[]; isActive: boolean;
  factoryIds: string[]; groupBuyStartAt: string | null; groupBuyEndAt: string | null; pickupStartAt: string | null;
  factory: { id: string; name: string };
  category: { id: string; name: string } | null;
  createdAt: string;
}
interface Factory { id: string; name: string }
interface Comment {
  id: string; name: string; phoneDigits: string; content: string | null;
  isAdminReply: boolean; createdAt: string;
  replies?: Comment[];
}

const formatWon = (n: number) => `₩${n.toLocaleString()}`;
const formatDate = (s: string) => new Date(s).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
const formatDateTime = (s: string) => new Date(s).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <Stack direction="row" sx={{ alignItems: "flex-start", py: 1.2, borderBottom: "1px solid #f0f0f0" }}>
      <Stack direction="row" sx={{ alignItems: "center", gap: 0.75, minWidth: 80, color: "text.secondary", flexShrink: 0 }}>
        {icon}
        <Typography variant="caption" sx={{ color: "text.secondary" }}>{label}</Typography>
      </Stack>
      <Box sx={{ flex: 1 }}>{children}</Box>
    </Stack>
  );
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  // 댓글
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySaving, setReplySaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/products/${id}`).then((r) => r.json()),
      fetch("/api/factories").then((r) => r.json()),
      fetch(`/api/products/${id}/comments`).then((r) => r.json()),
    ]).then(([p, f, c]) => {
      setProduct(p); setFactories(f); setComments(c); setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const loadComments = () =>
    fetch(`/api/products/${id}/comments`).then((r) => r.json()).then(setComments);

  const handleReplySubmit = async (parentId: string) => {
    if (!replyText.trim()) return;
    setReplySaving(true);
    const res = await fetch(`/api/products/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentId, content: replyText, isAdminReply: true }),
    });
    setReplySaving(false);
    if (res.ok) { setReplyingTo(null); setReplyText(""); loadComments(); }
  };

  const handleCommentDelete = async (commentId: string) => {
    await fetch(`/api/products/${id}/comments?commentId=${commentId}`, { method: "DELETE" });
    loadComments();
  };

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", py: 12 }}><CircularProgress /></Box>;
  if (!product) return (
    <Box sx={{ py: 8, textAlign: "center" }}>
      <Typography color="text.secondary">제품을 찾을 수 없습니다</Typography>
      <Button sx={{ mt: 2 }} onClick={() => router.back()}>돌아가기</Button>
    </Box>
  );

  const allImages = product.images?.length > 0 ? product.images : (product.imageUrl ? [product.imageUrl] : []);
  const factoryNames = product.factoryIds.length > 0
    ? product.factoryIds.map((fid) => factories.find((f) => f.id === fid)?.name || fid)
    : [product.factory.name];
  const discountRate = product.salePrice ? Math.round((1 - product.salePrice / product.price) * 100) : 0;

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", pb: { xs: 10, md: 6 } }}>

      {/* 브레드크럼 + 수정 버튼 */}
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Stack direction="row" sx={{ alignItems: "center", gap: 0.5 }}>
          <IconButton size="small" onClick={() => router.back()}><ArrowBackIcon fontSize="small" /></IconButton>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            제품 조회{product.category && <> &gt; <span style={{ color: "#1976d2" }}>{product.category.name}</span></>}
          </Typography>
        </Stack>
        <Button size="small" variant="outlined" startIcon={<EditIcon />}
          onClick={() => router.push("/manage/products")}
          sx={{ display: { xs: "none", md: "flex" } }}>
          수정
        </Button>
      </Stack>

      {/* 제품 정보 카드 */}
      <Paper elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 2, p: { xs: 2, md: 2.5 }, mb: 2 }}>
        <Stack direction="row" spacing={0.75} sx={{ mb: 1 }}>
          <Chip label={product.isActive ? "판매중" : "마감"} size="small"
            color={product.isActive ? "success" : "default"} />
          {product.category && <Chip label={product.category.name} size="small" variant="outlined" />}
        </Stack>

        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.4, mb: 1.5, wordBreak: "keep-all" }}>
          {product.name}
        </Typography>

        {product.salePrice ? (
          <Stack direction="row" sx={{ alignItems: "baseline", gap: 1, mb: 0.5 }}>
            <Typography sx={{ fontWeight: 800, fontSize: 22, color: "#e53935" }}>
              {formatWon(product.salePrice)}
            </Typography>
            <Chip label={`${discountRate}% 할인`} size="small"
              sx={{ bgcolor: "#e53935", color: "#fff", fontWeight: 700, fontSize: 11 }} />
          </Stack>
        ) : null}
        <Stack direction="row" sx={{ alignItems: "baseline", gap: 1, mb: 2 }}>
          <Typography sx={{ fontWeight: product.salePrice ? 400 : 800, fontSize: product.salePrice ? 13 : 22, color: product.salePrice ? "text.secondary" : "primary.main", textDecoration: product.salePrice ? "line-through" : "none" }}>
            {formatWon(product.price)}
          </Typography>
          {product.salePrice && <Typography variant="caption" sx={{ color: "text.secondary" }}>정가</Typography>}
        </Stack>

        <Divider sx={{ mb: 1.5 }} />

        <InfoRow icon={<StorefrontOutlinedIcon sx={{ fontSize: 14 }} />} label="소속 매장">
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5 }}>
            {factoryNames.map((name, i) => (
              <Chip key={i} label={name} size="small" color="primary" variant="outlined" />
            ))}
          </Stack>
        </InfoRow>

        <InfoRow icon={<InventoryOutlinedIcon sx={{ fontSize: 14 }} />} label="재고">
          <Typography variant="body2" sx={{ fontWeight: 600, color: product.stock === 0 ? "error.main" : product.stock < 10 ? "warning.main" : "text.primary" }}>
            {product.stock} {product.unit}
            {product.stock === 0 && <Typography component="span" variant="caption" sx={{ ml: 1, color: "error.main" }}>품절</Typography>}
            {product.stock > 0 && product.stock < 10 && <Typography component="span" variant="caption" sx={{ ml: 1, color: "warning.main" }}>잔여 수량 적음</Typography>}
          </Typography>
        </InfoRow>

        {product.groupBuyStartAt && (
          <InfoRow icon={<CalendarMonthOutlinedIcon sx={{ fontSize: 14 }} />} label="공구기간">
            <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>
              {formatDate(product.groupBuyStartAt)}
              {product.groupBuyEndAt && ` ~ ${formatDate(product.groupBuyEndAt)}`}
            </Typography>
          </InfoRow>
        )}

        {product.pickupStartAt && (
          <InfoRow icon={<LocalShippingOutlinedIcon sx={{ fontSize: 14 }} />} label="픽업시작">
            <Typography variant="body2" sx={{ fontWeight: 600, color: "success.main" }}>
              {formatDate(product.pickupStartAt)} 부터 픽업 가능
            </Typography>
          </InfoRow>
        )}

        <InfoRow icon={<LocalShippingOutlinedIcon sx={{ fontSize: 14 }} />} label="배송">
          <Typography variant="body2">주문 후 매장 확인</Typography>
        </InfoRow>
      </Paper>

      {/* 상품 설명 / 상세 내용 탭 */}
      <Paper elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden", mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: "1px solid #e0e0e0", "& .MuiTab-root": { fontWeight: 600, fontSize: 13 } }}>
          <Tab label="상품 소개" />
          <Tab label="상세 내용" disabled={!product.content} />
        </Tabs>

        <Box sx={{ p: { xs: 2, md: 2.5 }, minHeight: 120 }}>
          {tab === 0 && (
            product.description
              ? <Typography variant="body2" sx={{ lineHeight: 2, whiteSpace: "pre-wrap", wordBreak: "keep-all" }}>{product.description}</Typography>
              : <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", py: 4 }}>등록된 상품 소개가 없습니다</Typography>
          )}
          {tab === 1 && (
            <Typography variant="body2" sx={{ lineHeight: 2, whiteSpace: "pre-wrap", wordBreak: "keep-all" }}>{product.content}</Typography>
          )}
        </Box>

        {allImages.length > 0 && (
          <>
            <Divider />
            <Box sx={{ p: { xs: 2, md: 2.5 } }}>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.5 }}>
                상품 이미지 ({allImages.length}장)
              </Typography>
              <Stack spacing={1.5}>
                {allImages.map((url, i) => (
                  <Box key={i}>
                    <Box component="img" src={url} alt={`이미지 ${i + 1}`}
                      sx={{ width: "100%", display: "block", borderRadius: 1.5, border: url === product.imageUrl ? "2px solid #1976d2" : "1px solid #e0e0e0" }} />
                    {url === product.imageUrl && (
                      <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 600, mt: 0.5, display: "block" }}>
                        ★ 대표 이미지
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            </Box>
          </>
        )}
      </Paper>

      {/* 구매 내역 / 관리자 답글 섹션 */}
      <Paper elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden", mb: 2 }}>
        <Stack direction="row" sx={{ alignItems: "center", gap: 1, px: 2.5, py: 1.5, borderBottom: "1px solid #e0e0e0", bgcolor: "#fafafa" }}>
          <CommentIcon sx={{ fontSize: 16, color: "primary.main" }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            구매 내역
            <Typography component="span" variant="caption" sx={{ color: "text.secondary", ml: 1 }}>
              ({comments.length}건)
            </Typography>
          </Typography>
        </Stack>

        {/* 댓글 목록 */}
        <Box>
          {comments.length === 0 ? (
            <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", py: 4 }}>
              등록된 구매 내역이 없습니다
            </Typography>
          ) : (
            <Stack divider={<Divider />}>
              {comments.map((c) => (
                <Box key={c.id}>
                  {/* 원댓글 */}
                  <Stack direction="row" sx={{ alignItems: "flex-start", px: 2.5, py: 1.5, gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: "#e3f2fd", flexShrink: 0 }}>
                      <PersonIcon sx={{ fontSize: 18, color: "#1976d2" }} />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 0.3, flexWrap: "wrap" }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{c.name}</Typography>
                        <Chip label={`***-****-${c.phoneDigits}`} size="small" variant="outlined"
                          sx={{ height: 18, fontSize: 10, "& .MuiChip-label": { px: 0.75 } }} />
                        <Typography variant="caption" sx={{ color: "text.disabled", ml: "auto" }}>
                          {formatDateTime(c.createdAt)}
                        </Typography>
                      </Stack>
                      {c.content && (
                        <Typography variant="body2" sx={{ color: "text.secondary", fontSize: 13, mb: 0.5 }}>{c.content}</Typography>
                      )}
                      {/* 답글 달기 버튼 */}
                      <Button size="small" variant="text"
                        onClick={() => { setReplyingTo(replyingTo === c.id ? null : c.id); setReplyText(""); }}
                        sx={{ fontSize: 11, px: 0.5, py: 0.2, minWidth: 0, color: "text.secondary", "&:hover": { color: "primary.main" } }}>
                        {replyingTo === c.id ? "취소" : "↩ 답글"}
                      </Button>
                    </Box>
                    <IconButton size="small" color="error" onClick={() => handleCommentDelete(c.id)}
                      sx={{ flexShrink: 0, opacity: 0.5, "&:hover": { opacity: 1 } }}>
                      <DeleteIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Stack>

                  {/* 관리자 답글 입력 폼 */}
                  {replyingTo === c.id && (
                    <Box sx={{ ml: { xs: 5, sm: 6 }, mr: 2.5, mb: 1.5, p: 1.5, bgcolor: "#f0f4ff", borderRadius: 2, border: "1px solid #c5cae9" }}>
                      <Stack direction="row" sx={{ alignItems: "center", gap: 0.5, mb: 1 }}>
                        <Chip label="관리자" size="small" sx={{ bgcolor: "#1a237e", color: "#fff", fontWeight: 700, fontSize: 10, height: 20 }} />
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>답글 작성</Typography>
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        <TextField
                          size="small" fullWidth multiline rows={2}
                          placeholder="답글을 입력하세요..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          sx={{ bgcolor: "#fff", borderRadius: 1 }}
                        />
                        <Button variant="contained" size="small" disabled={replySaving || !replyText.trim()}
                          onClick={() => handleReplySubmit(c.id)}
                          sx={{ alignSelf: "flex-end", fontWeight: 700, minWidth: 60, bgcolor: "#1a237e" }}>
                          {replySaving ? <CircularProgress size={14} /> : "등록"}
                        </Button>
                      </Stack>
                    </Box>
                  )}

                  {/* 관리자 답글 목록 */}
                  {c.replies && c.replies.length > 0 && (
                    <Stack sx={{ ml: { xs: 5, sm: 6 }, mr: 2.5, mb: 1.5 }} spacing={0.5}>
                      {c.replies.map((r) => (
                        <Stack key={r.id} direction="row" sx={{ alignItems: "flex-start", gap: 1, p: 1.5, bgcolor: "#f0f4ff", borderRadius: 2, border: "1px solid #c5cae9" }}>
                          <Avatar sx={{ width: 26, height: 26, bgcolor: "#1a237e", flexShrink: 0 }}>
                            <PersonIcon sx={{ fontSize: 14, color: "#fff" }} />
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" sx={{ alignItems: "center", gap: 0.75, mb: 0.3 }}>
                              <Chip label="관리자" size="small" sx={{ bgcolor: "#1a237e", color: "#fff", fontWeight: 700, fontSize: 10, height: 18, "& .MuiChip-label": { px: 0.75 } }} />
                              <Typography variant="caption" sx={{ color: "text.disabled", ml: "auto" }}>
                                {formatDateTime(r.createdAt)}
                              </Typography>
                            </Stack>
                            <Typography variant="body2" sx={{ fontSize: 13 }}>{r.content}</Typography>
                          </Box>
                          <IconButton size="small" color="error" onClick={() => handleCommentDelete(r.id)}
                            sx={{ flexShrink: 0, opacity: 0.5, "&:hover": { opacity: 1 } }}>
                            <DeleteIcon sx={{ fontSize: 13 }} />
                          </IconButton>
                        </Stack>
                      ))}
                    </Stack>
                  )}
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Paper>

      <Typography variant="caption" sx={{ color: "text.disabled", display: "block", mt: 2 }}>
        등록일: {formatDate(product.createdAt)}
      </Typography>

      {/* 모바일 하단 고정 버튼 */}
      <Box sx={{
        display: { xs: "flex", md: "none" },
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        bgcolor: "#fff", borderTop: "1px solid #e0e0e0", p: 1.5, gap: 1.5,
      }}>
        <Button variant="outlined" onClick={() => router.back()} sx={{ flex: 1, py: 1.2, borderRadius: 2, fontWeight: 600 }}>
          목록으로
        </Button>
        <Button variant="contained" startIcon={<EditIcon />}
          onClick={() => router.push("/manage/products")}
          sx={{ flex: 2, py: 1.2, borderRadius: 2, fontWeight: 600 }}>
          수정하기
        </Button>
      </Box>
    </Box>
  );
}
