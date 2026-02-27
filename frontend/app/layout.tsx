import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Youva EdAi - AI-Powered Learning Platform",
  description:
    "Master any subject with your personalized AI tutor. Adaptive practice, instant feedback, and real-time progress tracking.",
  openGraph: {
    title: "Youva EdAi - Smart Learning for Everyone",
    description:
      "Join the future of education. Personalized AI tutoring for students aged 12-24.",
    url: "https://youva-edai.com",
    siteName: "Youva EdAi",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased font-sans`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
