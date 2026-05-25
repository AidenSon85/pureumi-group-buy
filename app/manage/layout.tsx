import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import ManageShell from "@/components/manage/ManageShell";

export default async function ManageLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/sign/signin_mng");
  const role = (session.user as any)?.role;
  if (role !== "ADMIN" && role !== "MANAGER") redirect("/sign/signin_mng");

  return <ManageShell>{children}</ManageShell>;
}
