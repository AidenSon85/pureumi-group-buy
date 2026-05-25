import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { CartProvider } from "@/components/shop/CartContext";
import ShopHeader from "@/components/shop/ShopHeader";
import prisma from "@/lib/prisma";
import { Box, Toolbar } from "@mui/material";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/sign/signin");

  const role = (session.user as any)?.role;
  if (role === "ADMIN" || role === "MANAGER") redirect("/manage");
  if (role !== "CUSTOMER") redirect("/sign/signin");

  const factoryId = (session.user as any)?.factoryId;
  let factoryName = "";
  if (factoryId) {
    const factory = await prisma.factory.findUnique({
      where: { id: factoryId },
      select: { name: true },
    });
    factoryName = factory?.name || "";
  }

  return (
    <CartProvider>
      <Box sx={{ minHeight: "100vh", bgcolor: "#f8f9fa" }}>
        <ShopHeader userName={session.user?.name || ""} factoryName={factoryName} />
        <Toolbar />
        <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 3 }, py: 3 }}>
          {children}
        </Box>
      </Box>
    </CartProvider>
  );
}
