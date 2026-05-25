"use client";
import { useState } from "react";
import {
  Box, Typography, Paper, Stack, Button, IconButton, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Avatar, Divider, Alert, CircularProgress, Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteIcon from "@mui/icons-material/Delete";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ImageIcon from "@mui/icons-material/Image";
import { useCart } from "@/components/shop/CartContext";
import { useRouter } from "next/navigation";

const formatWon = (n: number) => `₩${n.toLocaleString()}`;

export default function CartPage() {
  const { items, removeItem, updateQty, clearCart, total, count } = useCart();
  const router = useRouter();

  const [deliveryAddr, setDeliveryAddr] = useState("");
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ordered, setOrdered] = useState(false);

  const handleOrder = async () => {
    if (items.length === 0) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          deliveryAddr: deliveryAddr || null,
          memo: memo || null,
        }),
      });
      if (res.ok) {
        clearCart();
        setOrdered(true);
      } else {
        const d = await res.json();
        setError(d.error || "주문 중 오류가 발생했습니다");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  if (ordered) {
    return (
      <Box sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>주문이 완료되었습니다!</Typography>
        <Typography variant="body1" sx={{ color: "text.secondary", mb: 4 }}>
          주문 내역은 주문내역 페이지에서 확인하실 수 있습니다.
        </Typography>
        <Stack direction="row" spacing={2} sx={{ justifyContent: "center" }}>
          <Button variant="outlined" onClick={() => router.push("/shop/products")}>
            쇼핑 계속하기
          </Button>
          <Button variant="contained" onClick={() => router.push("/shop/orders")}>
            주문내역 확인
          </Button>
        </Stack>
      </Box>
    );
  }

  if (items.length === 0) {
    return (
      <Box sx={{ py: 10, textAlign: "center" }}>
        <ShoppingCartIcon sx={{ fontSize: 80, color: "#e0e0e0", mb: 2 }} />
        <Typography variant="h6" sx={{ color: "text.secondary", mb: 3 }}>장바구니가 비어있습니다</Typography>
        <Button variant="contained" onClick={() => router.push("/shop/products")} sx={{ borderRadius: 8 }}>
          제품 보러가기
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push("/shop/products")} sx={{ color: "text.secondary" }}>
          쇼핑 계속하기
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          장바구니 <Chip label={`${count}개`} size="small" color="primary" />
        </Typography>
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 380px" }, gap: 3 }}>
        {/* 상품 목록 */}
        <Box>
          <Paper elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden" }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "#f8f9fa" } }}>
                    <TableCell>제품</TableCell>
                    <TableCell align="center">수량</TableCell>
                    <TableCell align="right">금액</TableCell>
                    <TableCell align="center" width={48} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                          <Avatar
                            src={item.imageUrl || undefined}
                            variant="rounded"
                            sx={{ width: 52, height: 52, bgcolor: "#f5f5f5" }}
                          >
                            <ImageIcon color="disabled" />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.name}</Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              {formatWon(item.price)} / {item.unit}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", justifyContent: "center" }}>
                          <IconButton
                            size="small"
                            onClick={() => updateQty(item.productId, item.quantity - 1)}
                            sx={{ border: "1px solid #e0e0e0" }}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <Typography sx={{ minWidth: 32, textAlign: "center", fontWeight: 600 }}>
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => updateQty(item.productId, item.quantity + 1)}
                            disabled={item.quantity >= (item.maxQty ?? item.stock)}
                            sx={{ border: "1px solid #e0e0e0" }}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontWeight: 700, color: "primary.main" }}>
                          {formatWon(item.price * item.quantity)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="error" onClick={() => removeItem(item.productId)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Button variant="text" color="error" size="small" onClick={clearCart} sx={{ mt: 1 }}>
            전체 삭제
          </Button>
        </Box>

        {/* 주문 정보 */}
        <Box>
          <Paper elevation={0} sx={{ p: 3, border: "1px solid #e0e0e0", borderRadius: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>주문 정보</Typography>

            <Stack spacing={2} sx={{ mb: 3 }}>
              <TextField
                label="배송지 주소"
                fullWidth
                value={deliveryAddr}
                onChange={(e) => setDeliveryAddr(e.target.value)}
                placeholder="배송지를 입력해주세요"
                size="small"
              />
              <TextField
                label="메모"
                fullWidth
                multiline
                rows={3}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="요청사항을 입력해주세요"
                size="small"
              />
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Stack spacing={1} sx={{ mb: 3 }}>
              {items.map((item) => (
                <Stack key={item.productId} direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {item.name} × {item.quantity}
                  </Typography>
                  <Typography variant="body2">{formatWon(item.price * item.quantity)}</Typography>
                </Stack>
              ))}
              <Divider />
              <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                <Typography sx={{ fontWeight: 700 }}>합계</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: 20, color: "primary.main" }}>
                  {formatWon(total)}
                </Typography>
              </Stack>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleOrder}
              disabled={loading}
              sx={{ py: 1.5, borderRadius: 8, fontSize: 16, fontWeight: 700 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : `${formatWon(total)} 주문하기`}
            </Button>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
