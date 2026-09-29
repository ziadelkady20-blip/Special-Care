import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Special Care — منصة إدارة الحالات الذكية",
  description:
    "منصة متكاملة لمراكز رعاية ذوي الاحتياجات الخاصة لإدارة الحالات، المتابعة، التقارير والإحصائيات.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-background text-ink antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-left"
            toastOptions={{
              className: "font-sans",
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
