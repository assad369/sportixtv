import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: settings.seoTitle,
      template: `%s | ${settings.siteName}`,
    },
    description: settings.seoDescription,
    keywords: settings.seoKeywords,
    applicationName: settings.siteName,
    openGraph: {
      type: "website",
      siteName: settings.siteName,
      title: settings.seoTitle,
      description: settings.seoDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: settings.seoTitle,
      description: settings.seoDescription,
    },
    robots: { index: true, follow: true },
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
        <MonatagPopunder />
      </body>
    </html>
  );
}
