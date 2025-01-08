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
  title: "Shiny",
  description: "The future is already here, it's just not evenly distributed. Join today.",
  openGraph: {
    url: "https://shiny-perplx.vercel.app",
    type: "website",
    title: "Shiny",
    description: "The future is already here, it's just not evenly distributed. Join today.",
    images: [{
      url: "https://opengraph.b-cdn.net/production/images/9086ae25-ee13-4cfe-8f84-cb6754ea3627.png?token=HhwruAJ7dLXt39em_DB4U1HJh9tpa-8SXVaFTNoqJRc&height=630&width=1200&expires=33272374329",
      width: 1200,
      height: 630,
    }],
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
  twitter: {
    card: "summary_large_image",
    title: "Shiny",
    description: "The future is already here, it's just not evenly distributed. Join today.",
    images: ["https://opengraph.b-cdn.net/production/images/9086ae25-ee13-4cfe-8f84-cb6754ea3627.png?token=HhwruAJ7dLXt39em_DB4U1HJh9tpa-8SXVaFTNoqJRc&height=630&width=1200&expires=33272374329"],
  },
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
