"use client";
import {
  AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem,
  Divider, Box, Tooltip,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: "#fff",
        borderBottom: "1px solid #e0e0e0",
        ml: "auto",
        width: "100%",
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Typography variant="h6" sx={{ color: "text.primary", fontWeight: 700 }}>
          PUREUMI 관리자
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton size="small">
            <NotificationsIcon sx={{ color: "#666" }} />
          </IconButton>
          <Tooltip title={session?.user?.name || ""}>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
              <Avatar sx={{ width: 32, height: 32, bgcolor: "#1976d2", fontSize: 14 }}>
                {session?.user?.name?.[0]}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <MenuItem disabled>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{session?.user?.name}</Typography>
                <Typography variant="caption" color="text.secondary">{session?.user?.email}</Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => signOut({ callbackUrl: "/sign/signin_mng" })}>
              <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
              로그아웃
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
