"use client";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme, useMediaQuery } from "@mui/material";
import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText,
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
import ViewCarouselIcon from "@mui/icons-material/ViewCarousel";
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
  { title: "사용자 관리", icon: <PeopleIcon />, href: "/manage/users" },
  { title: "카테고리 관리", icon: <CategoryIcon />, href: "/manage/categories" },
  { title: "배너 관리", icon: <ViewCarouselIcon />, href: "/manage/banners" },
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

interface Props {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: Props) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState(false);

  const drawerWidth = collapsed ? MINI_WIDTH : DRAWER_WIDTH;

  const toggleMenu = (title: string) => {
    setOpen((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isActive = (href: string) =>
    href === "/manage" ? pathname === href : pathname.startsWith(href);

  const handleNav = (href: string) => {
    router.push(href);
    if (isMobile) onMobileClose();
  };

  const drawerContent = (
    <>
      <Toolbar
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed && !isMobile ? "center" : "space-between",
          px: collapsed && !isMobile ? 1 : 2,
          minHeight: "64px !important",
        }}
      >
        {(!collapsed || isMobile) && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#fff" }}>
              PUREUMI
            </Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.6)">
              관리자
            </Typography>
          </Box>
        )}
        {!isMobile && (
          <IconButton onClick={() => setCollapsed(!collapsed)} sx={{ color: "#fff" }}>
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        )}
      </Toolbar>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.15)" }} />

      {(!collapsed || isMobile) && session?.user && (
        <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: "#3f51b5", fontSize: 14 }}>
            {session.user.name?.[0]}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "#fff" }}>
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
            const showCollapsed = collapsed && !isMobile;
            return (
              <div key={item.title}>
                <Tooltip title={showCollapsed ? item.title : ""} placement="right">
                  <ListItemButton
                    onClick={() => !showCollapsed && toggleMenu(item.title)}
                    sx={{
                      px: showCollapsed ? 2.5 : 2,
                      justifyContent: showCollapsed ? "center" : "flex-start",
                      color: isParentActive ? "#90caf9" : "rgba(255,255,255,0.85)",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: "inherit",
                        minWidth: showCollapsed ? 0 : 40,
                        justifyContent: "center",
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {!showCollapsed && (
                      <>
                        <ListItemText primary={item.title} slotProps={{ primary: { style: { fontSize: 14 } } }} />
                        {expanded ? <ExpandLess /> : <ExpandMore />}
                      </>
                    )}
                  </ListItemButton>
                </Tooltip>
                {!showCollapsed && (
                  <Collapse in={expanded} timeout="auto">
                    <List disablePadding>
                      {item.children.map((child) => (
                        <ListItemButton
                          key={child.href}
                          selected={isActive(child.href)}
                          onClick={() => handleNav(child.href)}
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
                          <ListItemText primary={child.title} slotProps={{ primary: { style: { fontSize: 13 } } }} />
                        </ListItemButton>
                      ))}
                    </List>
                  </Collapse>
                )}
              </div>
            );
          }

          const showCollapsed = collapsed && !isMobile;
          return (
            <Tooltip key={item.title} title={showCollapsed ? item.title : ""} placement="right">
              <ListItemButton
                selected={isActive(item.href!)}
                onClick={() => handleNav(item.href!)}
                sx={{
                  px: showCollapsed ? 2.5 : 2,
                  justifyContent: showCollapsed ? "center" : "flex-start",
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
                    minWidth: showCollapsed ? 0 : 40,
                    justifyContent: "center",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!showCollapsed && (
                  <ListItemText primary={item.title} slotProps={{ primary: { style: { fontSize: 14 } } }} />
                )}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>
    </>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            background: "#1a237e",
            color: "#fff",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

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
      {drawerContent}
    </Drawer>
  );
}
