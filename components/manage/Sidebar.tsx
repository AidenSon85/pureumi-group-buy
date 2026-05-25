"use client";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Divider, Collapse, Box, Typography, Avatar, IconButton, Tooltip,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import StoreIcon from "@mui/icons-material/Store";
import PeopleIcon from "@mui/icons-material/People";
import InventoryIcon from "@mui/icons-material/Inventory";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlined";
import ListAltIcon from "@mui/icons-material/ListAlt";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PersonIcon from "@mui/icons-material/Person";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CategoryIcon from "@mui/icons-material/Category";
import { useSession } from "next-auth/react";

const DRAWER_WIDTH = 240;
const MINI_WIDTH = 64;

interface NavItem {
  title: string;
  icon: React.ReactNode;
  href?: string;
  children?: { title: string; icon: React.ReactNode; href: string }[];
}

const navItems: NavItem[] = [
  { title: "대시보드", icon: <DashboardIcon />, href: "/manage" },
  { title: "매장 관리", icon: <StoreIcon />, href: "/manage/factories" },
  {
    title: "사용자 관리",
    icon: <PeopleIcon />,
    children: [
      { title: "사용자 목록", icon: <ListAltIcon />, href: "/manage/users" },
    ],
  },
  { title: "카테고리 관리", icon: <CategoryIcon />, href: "/manage/categories" },
  {
    title: "제품 관리",
    icon: <InventoryIcon />,
    children: [
      { title: "제품 등록/수정", icon: <AddCircleOutlineIcon />, href: "/manage/products" },
      { title: "제품 조회", icon: <ListAltIcon />, href: "/manage/products/list" },
    ],
  },
  {
    title: "주문 관리",
    icon: <ShoppingCartIcon />,
    children: [
      { title: "최근 주문", icon: <ListAltIcon />, href: "/manage/orders" },
      { title: "일자별 주문", icon: <CalendarTodayIcon />, href: "/manage/orders/daily" },
      { title: "제품별 주문", icon: <InventoryIcon />, href: "/manage/orders/by-product" },
      { title: "사용자별 주문", icon: <PersonIcon />, href: "/manage/orders/by-user" },
    ],
  },
];

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState(false);

  const drawerWidth = collapsed ? MINI_WIDTH : DRAWER_WIDTH;

  const toggleMenu = (title: string) => {
    setOpen((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isActive = (href: string) =>
    href === "/manage" ? pathname === href : pathname.startsWith(href);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          background: "#1a237e",
          color: "#fff",
          transition: "width 0.2s",
          overflowX: "hidden",
        },
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          px: collapsed ? 1 : 2,
          minHeight: "64px !important",
        }}
      >
        {!collapsed && (
          <Box>
            <Typography variant="subtitle1" fontWeight={700} color="#fff">
              PUREUMI
            </Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.6)">
              관리자
            </Typography>
          </Box>
        )}
        <IconButton onClick={() => setCollapsed(!collapsed)} sx={{ color: "#fff" }}>
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Toolbar>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.15)" }} />

      {!collapsed && session?.user && (
        <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: "#3f51b5", fontSize: 14 }}>
            {session.user.name?.[0]}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600} color="#fff">
              {session.user.name}
            </Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.6)">
              {(session.user as any).role}
            </Typography>
          </Box>
        </Box>
      )}

      <Divider sx={{ borderColor: "rgba(255,255,255,0.15)" }} />

      <List sx={{ py: 1 }}>
        {navItems.map((item) => {
          if (item.children) {
            const expanded = open[item.title];
            const isParentActive = item.children.some((c) => isActive(c.href));
            return (
              <div key={item.title}>
                <Tooltip title={collapsed ? item.title : ""} placement="right">
                  <ListItemButton
                    onClick={() => !collapsed && toggleMenu(item.title)}
                    sx={{
                      px: collapsed ? 2.5 : 2,
                      justifyContent: collapsed ? "center" : "flex-start",
                      color: isParentActive ? "#90caf9" : "rgba(255,255,255,0.85)",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: "inherit",
                        minWidth: collapsed ? 0 : 40,
                        justifyContent: "center",
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {!collapsed && (
                      <>
                        <ListItemText primary={item.title} primaryTypographyProps={{ fontSize: 14 }} />
                        {expanded ? <ExpandLess /> : <ExpandMore />}
                      </>
                    )}
                  </ListItemButton>
                </Tooltip>
                {!collapsed && (
                  <Collapse in={expanded} timeout="auto">
                    <List disablePadding>
                      {item.children.map((child) => (
                        <ListItemButton
                          key={child.href}
                          selected={isActive(child.href)}
                          onClick={() => router.push(child.href)}
                          sx={{
                            pl: 4,
                            color: isActive(child.href) ? "#90caf9" : "rgba(255,255,255,0.7)",
                            "&.Mui-selected": {
                              bgcolor: "rgba(144,202,249,0.15)",
                              "&:hover": { bgcolor: "rgba(144,202,249,0.2)" },
                            },
                            "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                          }}
                        >
                          <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>
                            {child.icon}
                          </ListItemIcon>
                          <ListItemText primary={child.title} primaryTypographyProps={{ fontSize: 13 }} />
                        </ListItemButton>
                      ))}
                    </List>
                  </Collapse>
                )}
              </div>
            );
          }
          return (
            <Tooltip key={item.title} title={collapsed ? item.title : ""} placement="right">
              <ListItemButton
                selected={isActive(item.href!)}
                onClick={() => router.push(item.href!)}
                sx={{
                  px: collapsed ? 2.5 : 2,
                  justifyContent: collapsed ? "center" : "flex-start",
                  color: isActive(item.href!) ? "#90caf9" : "rgba(255,255,255,0.85)",
                  "&.Mui-selected": {
                    bgcolor: "rgba(144,202,249,0.15)",
                    "&:hover": { bgcolor: "rgba(144,202,249,0.2)" },
                  },
                  "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: "inherit",
                    minWidth: collapsed ? 0 : 40,
                    justifyContent: "center",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText primary={item.title} primaryTypographyProps={{ fontSize: 14 }} />
                )}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>
    </Drawer>
  );
}
