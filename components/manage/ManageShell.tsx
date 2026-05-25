"use client";
import { useState } from "react";
import { Box, Toolbar } from "@mui/material";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function ManageShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: "flex" }}>
      <Header onMenuClick={() => setMobileOpen(true)} />
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "#f5f5f5",
          minHeight: "100vh",
          p: { xs: 1.5, sm: 2, md: 3 },
          overflow: "auto",
          minWidth: 0,
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
