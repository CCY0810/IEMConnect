import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/auth-context";
import { Toaster } from "../../components/ui/toaster";
import Chatbot from "@/components/Chatbot";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IEM Connect - Secure Authentication",
  description: "Professional 2FA authentication platform for IEM members",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-background text-foreground`}
        suppressHydrationWarning
      >
        <AuthProvider>
          {children}
          <Toaster />
          <Chatbot />
        </AuthProvider>
      </body>
    </html>
  );
}
