import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import CookieBanner from "./components/CookieBanner";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "My Tiny Tales — Your Child, The Hero of Their Own Story",
  description: "AI-generated personalised storybooks starring your child. Beautiful cinematic 3D illustrations, delivered in minutes.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "My Tiny Tales — Your Child, The Hero of Their Own Story",
    description: "AI-generated personalised storybooks starring your child. Beautiful cinematic 3D illustrations, delivered in minutes.",
    url: "https://mytinytales.studio",
    siteName: "My Tiny Tales",
    images: [{ url: "https://mytinytales.studio/og-image.jpg", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "My Tiny Tales — Your Child, The Hero of Their Own Story",
    description: "AI-generated personalised storybooks starring your child. Beautiful cinematic 3D illustrations, delivered in minutes.",
    images: ["https://mytinytales.studio/og-image.jpg"],
  },
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { page_path: window.location.pathname });
              `}
            </Script>
          </>
        )}
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
