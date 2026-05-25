"use client";
import { useState, useEffect } from "react";
import {
  Box, Grid, Paper, Typography, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Avatar, Skeleton, Card, CardContent, Stack,
} from "@mui/material";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PeopleIcon from "@mui/icons-material/People";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import StoreIcon from "@mui/icons-material/Store";
import ImageIcon from "@mui/icons-material/Image";

interface Factory { id: string; name: string; code: string }
interface DailyStat { date: string; salesAmount: number; orderCount: number; visitorCount: number }
interface Product { id: string; name: string; price: number; stock: number; imageUrl: string | null; isActive: boolean }
interface Summary { totalSales: number; totalOrders: number; totalVisitors: number; activeProducts: number }

const formatWon = (n: number) => `₩${n.toLocaleString()}`;

export default function DashboardPage() {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [selectedFactory, setSelectedFactory] = useState<string>("");
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalSales: 0, totalOrders: 0, totalVisitors: 0, activeProducts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/factories").then((r) => r.json()).then((data) => {
      setFactories(data);
      if (data.length > 0) setSelectedFactory(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedFactory) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/stats?factoryId=${selectedFactory}&days=14`).then((r) => r.json()),
      fetch(`/api/products?factoryId=${selectedFactory}&limit=10`).then((r) => r.json()),
    ]).then(([statsData, productsData]) => {
      const daily: DailyStat[] = statsData.daily || [];
      setStats(daily);
      setProducts(productsData.products || []);
      const totals = daily.reduce(
        (acc, d) => ({
          totalSales: acc.totalSales + d.salesAmount,
          totalOrders: acc.totalOrders + d.orderCount,
          totalVisitors: acc.totalVisitors + d.visitorCount,
          activeProducts: statsData.activeProducts || 0,
        }),
        { totalSales: 0, totalOrders: 0, totalVisitors: 0, activeProducts: statsData.activeProducts || 0 }
      );
      setSummary(totals);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selectedFactory]);

  const summaryCards = [
    { title: "14일 매출", value: formatWon(summary.totalSales), icon: <TrendingUpIcon />, color: "#1976d2" },
    { title: "14일 주문", value: `${summary.totalOrders}건`, icon: <ShoppingCartIcon />, color: "#388e3c" },
    { title: "14일 방문자", value: `${summary.totalVisitors}명`, icon: <PeopleIcon />, color: "#f57c00" },
    { title: "판매 제품", value: `${summary.activeProducts}종`, icon: <StoreIcon />, color: "#7b1fa2" },
  ];

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>대시보드</Typography>
        <FormControl size="small" sx={{ minWidth: 200, bgcolor: "#fff", borderRadius: 2 }}>
          <InputLabel>매장 선택</InputLabel>
          <Select value={selectedFactory} label="매장 선택" onChange={(e) => setSelectedFactory(e.target.value)}>
            {factories.map((f) => (
              <MenuItem key={f.id} value={f.id}>{f.name} ({f.code})</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* 요약 카드 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {summaryCards.map((card) => (
          <Grid key={card.title} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={0} sx={{ border: "1px solid #e0e0e0" }}>
              <CardContent>
                <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>{card.title}</Typography>
                    {loading ? (
                      <Skeleton width={80} height={36} />
                    ) : (
                      <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>{card.value}</Typography>
                    )}
                  </Box>
                  <Avatar sx={{ bgcolor: `${card.color}20`, color: card.color }}>
                    {card.icon}
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* 일별 매출 차트 */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={0} sx={{ p: 3, border: "1px solid #e0e0e0" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>일별 매출 현황 (14일)</Typography>
            {loading ? (
              <Skeleton variant="rectangular" height={260} />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                  <Tooltip formatter={(v: number) => formatWon(v)} />
                  <Bar dataKey="salesAmount" name="매출" fill="#1976d2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* 일별 방문자 차트 */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={0} sx={{ p: 3, border: "1px solid #e0e0e0" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>일별 방문자 수 (14일)</Typography>
            {loading ? (
              <Skeleton variant="rectangular" height={260} />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={stats} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="visitorCount" name="방문자" stroke="#f57c00" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="orderCount" name="주문" stroke="#388e3c" strokeWidth={2} dot={{ r: 3 }} />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* 제품 목록 */}
      <Paper elevation={0} sx={{ p: 3, border: "1px solid #e0e0e0" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>판매 중인 제품 목록</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "#f5f5f5" } }}>
                <TableCell>제품명</TableCell>
                <TableCell align="right">가격</TableCell>
                <TableCell align="right">재고</TableCell>
                <TableCell align="center">상태</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton /></TableCell>
                      <TableCell><Skeleton /></TableCell>
                      <TableCell><Skeleton /></TableCell>
                      <TableCell><Skeleton /></TableCell>
                    </TableRow>
                  ))
                : products.map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar src={p.imageUrl || undefined} variant="rounded" sx={{ width: 36, height: 36, bgcolor: "#e3f2fd" }}>
                            <ImageIcon sx={{ fontSize: 18, color: "#90caf9" }} />
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{p.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>{formatWon(p.price)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ color: p.stock < 10 ? "error.main" : "text.primary" }}>{p.stock}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={p.isActive ? "판매중" : "중지"} size="small" color={p.isActive ? "success" : "default"} variant="outlined" />
                      </TableCell>
                    </TableRow>
                  ))}
              {!loading && products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: "text.secondary" }}>등록된 제품이 없습니다</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
