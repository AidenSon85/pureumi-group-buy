import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Box, Toolbar } from "@mui/material";
import Sidebar from "@/components/manage/Sidebar";
import Header from "@/components/manage/Header";

export default async function ManageLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/sign/signin_mng");
  const role = (session.user as any)?.role;
  if (role !== "ADMIN" && role !== "MANAGER") redirect("/sign/signin_mng");

  return (
    <Box sx={{ display: "flex" }}>
      <Header />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "#f5f5f5",
          minHeight: "100vh",
          p: 3,
          overflow: "auto",
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
