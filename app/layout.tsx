import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { getSettings } from "@/lib/data/settings";
import { SwRegister } from "@/components/pwa/SwRegister";
import { MonatagPopunder } from "@/components/ads/MonatagPopunder";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.sportixtv.online";
  const logoUrl = settings.logoUrl || `${siteUrl}/logo/sportixtv_logo.png`;
  const ogImage = { url: logoUrl, width: 1200, height: 630, alt: settings.siteName };
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: settings.seoTitle,
      template: `%s | ${settings.siteName}`,
    },
    description: settings.seoDescription,
    keywords: settings.seoKeywords,
    applicationName: settings.siteName,
    authors: [{ name: settings.siteName, url: siteUrl }],
    creator: settings.siteName,
    publisher: settings.siteName,
    category: "Sports & Entertainment Streaming",
    referrer: "origin-when-cross-origin",
    alternates: { canonical: siteUrl },
    openGraph: {
      type: "website",
      url: siteUrl,
      siteName: settings.siteName,
      title: settings.seoTitle,
      description: settings.seoDescription,
      locale: "en_US",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: settings.seoTitle,
      description: settings.seoDescription,
      site: settings.socialLinks.twitter || undefined,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
    icons: {
      icon: [
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      shortcut: "/icons/icon-192.png",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0b0f17",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="monetag" content="0d655a9f16face036850766f3cbcc327" />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-M01GYZSS9V"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);} 
              gtag('js', new Date());

              gtag('config', 'G-M01GYZSS9V');
            `,
          }}
        />
    
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <SwRegister />
        <Suspense fallback={null}>
          <MonatagPopunder />
        </Suspense>
      </body>
    </html>
  );
}
