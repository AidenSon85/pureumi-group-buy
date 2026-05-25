"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Box, Grid, Paper, Typography, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Avatar, Skeleton, Card, CardContent, Stack, TextField, InputAdornment,
  IconButton, Tooltip, CardMedia,
} from "@mui/material";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PeopleIcon from "@mui/icons-material/People";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import StoreIcon from "@mui/icons-material/Store";
import ImageIcon from "@mui/icons-material/Image";
import SearchIcon from "@mui/icons-material/Search";
import ViewListIcon from "@mui/icons-material/ViewList";
import GridViewIcon from "@mui/icons-material/GridView";

interface Factory { id: string; name: string; code: string }
interface DailyStat { date: string; salesAmount: number; orderCount: number; visitorCount: number }
interface Product { id: string; name: string; price: number; salePrice: number | null; stock: number; unit: string; imageUrl: string | null; isActive: boolean; category: { name: string } | null }
interface Summary { totalSales: number; totalOrders: number; totalVisitors: number; activeProducts: number }

const formatWon = (n: number) => `₩${n.toLocaleString()}`;

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const isManager = (session?.user as any)?.role === "MANAGER";
  const myFactoryId = (session?.user as any)?.factoryId as string | undefined;

  const [factories, setFactories] = useState<Factory[]>([]);
  const [selectedFactory, setSelectedFactory] = useState<string>("");
  const [days, setDays] = useState<number>(14);
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalSales: 0, totalOrders: 0, totalVisitors: 0, activeProducts: 0 });
  const [loading, setLoading] = useState(true);

  // 제품 목록 필터/뷰
  const [productSearch, setProductSearch] = useState("");
  const [productStatus, setProductStatus] = useState<"" | "true" | "false">("");
  const [productViewMode, setProductViewMode] = useState<"list" | "grid">(() =>
    typeof window !== "undefined" ? (localStorage.getItem("dashboardProductView") as "list" | "grid") || "list" : "list"
  );

  useEffect(() => {
    if (status === "loading") return;
    fetch("/api/factories").then((r) => r.json()).then((data) => {
      setFactories(data);
      if (isManager && myFactoryId) setSelectedFactory(myFactoryId);
      else if (data.length > 0) setSelectedFactory(data[0].id);
    });
  }, [status, isManager, myFactoryId]);

  useEffect(() => {
    if (!selectedFactory) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/stats?factoryId=${selectedFactory}&days=${days}`).then((r) => r.json()),
      fetch(`/api/products?factoryId=${selectedFactory}&limit=100`).then((r) => r.json()),
    ]).then(([statsData, productsData]) => {
      const daily: DailyStat[] = statsData.daily || [];
      setStats(daily);
      setAllProducts(productsData.products || []);
      setSummary({
        totalSales: daily.reduce((s, d) => s + d.salesAmount, 0),
        totalOrders: daily.reduce((s, d) => s + d.orderCount, 0),
        totalVisitors: daily.reduce((s, d) => s + d.visitorCount, 0),
        activeProducts: statsData.activeProducts || 0,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selectedFactory, days]);

  const filteredProducts = allProducts.filter((p) => {
    const matchSearch = !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase());
    const matchStatus = !productStatus || String(p.isActive) === productStatus;
    return matchSearch && matchStatus;
  });

  const summaryCards = [
    { title: `${days}일 매출`, value: formatWon(summary.totalSales), icon: <TrendingUpIcon />, color: "#1976d2" },
    { title: `${days}일 주문`, value: `${summary.totalOrders}건`, icon: <ShoppingCartIcon />, color: "#388e3c" },
    { title: `${days}일 방문자`, value: `${summary.totalVisitors}명`, icon: <PeopleIcon />, color: "#f57c00" },
    { title: "판매 제품", value: `${summary.activeProducts}종`, icon: <StoreIcon />, color: "#7b1fa2" },
  ];

  const toggleProductView = (mode: "list" | "grid") => {
    setProductViewMode(mode);
    localStorage.setItem("dashboardProductView", mode);
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      {/* 헤더 */}
      <Stack direction={{ xs: "column", sm: "row" }} sx={{ alignItems: { xs: "stretch", sm: "center" }, justifyContent: "space-between", mb: 3, gap: 1.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>대시보드</Typography>
        <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>기간</InputLabel>
            <Select value={days} label="기간" onChange={(e) => setDays(Number(e.target.value))}>
              <MenuItem value={7}>7일</MenuItem>
              <MenuItem value={14}>14일</MenuItem>
              <MenuItem value={30}>30일</MenuItem>
            </Select>
          </FormControl>
          {!isManager && (
            <FormControl size="small" sx={{ minWidth: 200, bgcolor: "#fff", borderRadius: 2 }}>
              <InputLabel>매장 선택</InputLabel>
              <Select value={selectedFactory} label="매장 선택" onChange={(e) => setSelectedFactory(e.target.value)}>
                {factories.map((f) => (
                  <MenuItem key={f.id} value={f.id}>{f.name} ({f.code})</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Stack>
      </Stack>

      {/* 요약 카드 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {summaryCards.map((card) => (
          <Grid key={card.title} size={{ xs: 6, sm: 6, md: 3 }}>
            <Card elevation={0} sx={{ border: "1px solid #e0e0e0" }}>
              <CardContent>
                <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: "text.secondary", fontSize: { xs: 11, sm: 13 } }}>{card.title}</Typography>
                    {loading ? <Skeleton width={80} height={36} /> : (
                      <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5, fontSize: { xs: 15, sm: 20 } }}>{card.value}</Typography>
                    )}
                  </Box>
                  <Avatar sx={{ bgcolor: `${card.color}20`, color: card.color, display: { xs: "none", sm: "flex" } }}>
                    {card.icon}
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 차트 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={0} sx={{ p: 3, border: "1px solid #e0e0e0" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>일별 매출 현황 ({days}일)</Typography>
            {loading ? <Skeleton variant="rectangular" height={260} /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                  <RechartsTooltip formatter={(v) => typeof v === "number" ? formatWon(v) : String(v ?? "")} />
                  <Bar dataKey="salesAmount" name="매출" fill="#1976d2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={0} sx={{ p: 3, border: "1px solid #e0e0e0" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>일별 방문자 수 ({days}일)</Typography>
            {loading ? <Skeleton variant="rectangular" height={260} /> : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={stats} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip />
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
      <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, border: "1px solid #e0e0e0" }}>
        {/* 제품 목록 헤더 */}
        <Stack direction={{ xs: "column", sm: "row" }} sx={{ alignItems: { xs: "stretch", sm: "center" }, justifyContent: "space-between", mb: 2, gap: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            제품 목록
            {!loading && <Typography component="span" variant="caption" sx={{ color: "text.secondary", ml: 1 }}>({filteredProducts.length}종)</Typography>}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", gap: 1 }}>
            {/* 검색 */}
            <TextField
              size="small" placeholder="제품명 검색" value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
              sx={{ width: { xs: "100%", sm: 200 } }}
            />
            {/* 상태 필터 */}
            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel>상태</InputLabel>
              <Select value={productStatus} label="상태" onChange={(e) => setProductStatus(e.target.value as "" | "true" | "false")}>
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="true">판매중</MenuItem>
                <MenuItem value="false">중지</MenuItem>
              </Select>
            </FormControl>
            {/* 뷰 토글 */}
            <Box sx={{ display: "flex", border: "1px solid #e0e0e0", borderRadius: 1, overflow: "hidden" }}>
              <Tooltip title="목록 보기">
                <IconButton size="small" onClick={() => toggleProductView("list")} sx={{ borderRadius: 0, bgcolor: productViewMode === "list" ? "#1a237e" : "transparent", color: productViewMode === "list" ? "#fff" : "text.secondary", "&:hover": { bgcolor: productViewMode === "list" ? "#1a237e" : "#f5f5f5" } }}>
                  <ViewListIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="카드 보기">
                <IconButton size="small" onClick={() => toggleProductView("grid")} sx={{ borderRadius: 0, bgcolor: productViewMode === "grid" ? "#1a237e" : "transparent", color: productViewMode === "grid" ? "#fff" : "text.secondary", "&:hover": { bgcolor: productViewMode === "grid" ? "#1a237e" : "#f5f5f5" } }}>
                  <GridViewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Stack>
        </Stack>

        {/* 목록 뷰 */}
        {productViewMode === "list" && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "#f5f5f5" } }}>
                  <TableCell>제품명</TableCell>
                  <TableCell>카테고리</TableCell>
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
                        <TableCell><Skeleton /></TableCell>
                      </TableRow>
                    ))
                  : filteredProducts.map((p) => (
                      <TableRow key={p.id} hover>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar src={p.imageUrl || undefined} variant="rounded" sx={{ width: 36, height: 36, bgcolor: "#e3f2fd" }}>
                              <ImageIcon sx={{ fontSize: 18, color: "#90caf9" }} />
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{p.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {p.category && <Chip label={p.category.name} size="small" variant="outlined" sx={{ fontSize: 11 }} />}
                        </TableCell>
                        <TableCell align="right">
                          <Box>
                            {p.salePrice ? (
                              <>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: "error.main" }}>{formatWon(p.salePrice)}</Typography>
                                <Typography variant="caption" sx={{ color: "text.secondary", textDecoration: "line-through" }}>{formatWon(p.price)}</Typography>
                              </>
                            ) : (
                              <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>{formatWon(p.price)}</Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ color: p.stock === 0 ? "error.main" : p.stock < 10 ? "warning.main" : "text.primary" }}>
                            {p.stock}{p.unit}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={p.isActive ? "판매중" : "중지"} size="small" color={p.isActive ? "success" : "default"} variant="outlined" />
                        </TableCell>
                      </TableRow>
                    ))}
                {!loading && filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>조건에 맞는 제품이 없습니다</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* 카드 뷰 */}
        {productViewMode === "grid" && (
          loading ? (
            <Grid container spacing={1.5}>
              {Array.from({ length: 8 }).map((_, i) => <Grid key={i} size={{ xs: 6, sm: 4, md: 3 }}><Skeleton variant="rectangular" height={200} /></Grid>)}
            </Grid>
          ) : (
            <Grid container spacing={{ xs: 1.5, sm: 2 }}>
              {filteredProducts.length === 0 ? (
                <Grid size={12}>
                  <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>조건에 맞는 제품이 없습니다</Box>
                </Grid>
              ) : filteredProducts.map((p) => (
                <Grid key={p.id} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
                  <Card elevation={0} sx={{ border: "1px solid #e0e0e0", height: "100%", display: "flex", flexDirection: "column", opacity: p.isActive ? 1 : 0.6 }}>
                    {p.imageUrl ? (
                      <CardMedia component="img" image={p.imageUrl} alt={p.name} sx={{ height: { xs: 100, sm: 140 }, objectFit: "cover" }} />
                    ) : (
                      <Box sx={{ height: { xs: 100, sm: 140 }, bgcolor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ImageIcon sx={{ fontSize: 36, color: "#ccc" }} />
                      </Box>
                    )}
                    <CardContent sx={{ flex: 1, p: { xs: 1, sm: 1.5 }, "&:last-child": { pb: { xs: 1, sm: 1.5 } } }}>
                      {p.category && (
                        <Chip label={p.category.name} size="small" variant="outlined"
                          sx={{ height: 18, fontSize: 10, "& .MuiChip-label": { px: 0.75 }, mb: 0.5 }} />
                      )}
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: { xs: 11, sm: 13 }, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", mb: 0.5 }}>
                        {p.name}
                      </Typography>
                      {p.salePrice ? (
                        <>
                          <Typography sx={{ fontWeight: 700, color: "error.main", fontSize: { xs: 12, sm: 14 } }}>{formatWon(p.salePrice)}</Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary", textDecoration: "line-through", fontSize: 10 }}>{formatWon(p.price)}</Typography>
                        </>
                      ) : (
                        <Typography sx={{ fontWeight: 700, color: "primary.main", fontSize: { xs: 12, sm: 14 } }}>{formatWon(p.price)}</Typography>
                      )}
                      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mt: 0.75 }}>
                        <Typography variant="caption" sx={{ color: p.stock === 0 ? "error.main" : p.stock < 10 ? "warning.main" : "text.secondary", fontSize: 10 }}>
                          재고 {p.stock}{p.unit}
                        </Typography>
                        <Chip label={p.isActive ? "판매중" : "중지"} size="small" color={p.isActive ? "success" : "default"} variant="outlined"
                          sx={{ height: 18, fontSize: 10, "& .MuiChip-label": { px: 0.75 } }} />
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )
        )}
      </Paper>
    </Box>
  );
}
