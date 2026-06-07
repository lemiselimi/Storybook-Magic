import type { Metadata } from "next";
import { Playfair_Display, Outfit } from "next/font/google";
import "./globals.css";
import CookieBanner from "./components/CookieBanner";
import Analytics from "./components/Analytics";

const playfair = Playfair_Display({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700", "900"],
});

const outfit = Outfit({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
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
      className={`${playfair.variable} ${outfit.variable} h-full antialiased`}
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
