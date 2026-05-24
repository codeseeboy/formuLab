import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";

export const metadata: Metadata = {
  title: "FormuLab — AI-Powered Agrochemical Formulation Copilot",
  description: "Transform agrochemical R&D with AI-driven formulation recommendations, surfactant strategies, stability analysis, and automated recipe generation. Built for formulation scientists.",
  keywords: "agrochemical, formulation, copilot, AI, R&D, pesticide, surfactant, stability, recipe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
