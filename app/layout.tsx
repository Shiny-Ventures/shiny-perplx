import { Analytics } from "@vercel/analytics/react";
import { GeistSans } from 'geist/font/sans';
import 'katex/dist/katex.min.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Metadata, Viewport } from "next";
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Toaster } from "sonner";
import "./globals.css";
import { Providers as ThemeProviders } from './providers';
import { LayoutWithSidebar } from "@/components/core/layout-with-sidebar";
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  metadataBase: new URL("https://shiny-perplx.vercel.app"),
  title: "ShinyPerplx",
  description: "ShinyPerplx is a minimalistic AI-powered search engine that helps you find information on the internet.",
  openGraph: {
    url: "https://shiny-perplx.vercel.app",
    siteName: "ShinyPerplx",
  },
  keywords: [
    "ShinyPerplx",
    "mplx",
    "mplx.run",
    "search engine",
    "AI",
    "ai search engine",
    "perplexity",
    "minimalistic search engine",
  ],
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000" },
    { media: "(prefers-color-scheme: light)", color: "#fff" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} font-sans antialiased`}>
        <Providers>
          <NuqsAdapter>
            <ThemeProviders>
              <Toaster position="top-center" richColors />
              <LayoutWithSidebar>
                {children}
              </LayoutWithSidebar>
            </ThemeProviders>
          </NuqsAdapter>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
