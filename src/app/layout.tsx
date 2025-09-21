import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider, ErrorBoundary } from "@/components/ui";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Track your personal expenses with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">
        <ErrorBoundary>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
