import type { Metadata } from "next";
import ThemeRegistry from "@/components/ThemeRegistry";
import SessionProvider from "@/components/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "PUREUMI 공동구매",
  description: "PUREUMI 공동구매",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <SessionProvider>
          <ThemeRegistry>{children}</ThemeRegistry>
        </SessionProvider>
      </body>
    </html>
  );
}
