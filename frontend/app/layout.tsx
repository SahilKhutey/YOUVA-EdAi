import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import InstallPrompt from "@/app/components/InstallPrompt";
import ShortcutsModal from "@/app/components/ShortcutsModal";
import AchievementToast from "@/app/components/AchievementToast";
import GlobalSearch from "@/app/components/GlobalSearch";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Youva EdAi - AI-Powered Learning Platform",
  description:
    "Master any subject with your personalized AI tutor. Adaptive practice, instant feedback, and real-time progress tracking.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Youva EdAi",
  },
  formatDetection: { telephone: false },
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

export const viewport = {
  themeColor: "#2563EB",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Service Worker registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').catch(function(err) {
      console.warn('SW registration failed:', err);
    });
  });
}`,
          }}
        />
      </head>
      <body className={`${inter.variable} antialiased font-sans`}>
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider>
              {children}
              <InstallPrompt />
              <ShortcutsModal />
              <AchievementToast />
              <GlobalSearch />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
