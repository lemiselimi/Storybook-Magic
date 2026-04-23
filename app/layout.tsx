import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import CookieBanner from "./components/CookieBanner";
import Analytics from "./components/Analytics";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "900"],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  );
}
