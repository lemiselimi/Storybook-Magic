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

const SITE_DESC = "Turn a single photo into a personalised children's storybook starring your child as the hero — cinematic 3D illustrations and a custom story, previewed free in minutes.";

export const metadata: Metadata = {
  metadataBase: new URL("https://mytinytales.studio"),
  title: {
    default: "My Tiny Tales — Your Child, The Hero of Their Own Story",
    template: "%s · My Tiny Tales",
  },
  description: SITE_DESC,
  keywords: [
    "personalised children's book", "personalized children's book", "custom storybook",
    "AI children's book", "make your child the hero of a book", "personalised storybook gift",
    "custom kids book", "photo storybook for kids", "personalised bedtime story",
  ],
  applicationName: "My Tiny Tales",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "My Tiny Tales — Your Child, The Hero of Their Own Story",
    description: SITE_DESC,
    url: "https://mytinytales.studio",
    siteName: "My Tiny Tales",
    images: [{ url: "https://mytinytales.studio/og-image.jpg", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "My Tiny Tales — Your Child, The Hero of Their Own Story",
    description: SITE_DESC,
    images: ["https://mytinytales.studio/og-image.jpg"],
  },
};

// Organization + WebSite structured data (brand knowledge panel + sitelinks search).
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://mytinytales.studio/#organization",
      name: "My Tiny Tales",
      url: "https://mytinytales.studio",
      logo: "https://mytinytales.studio/og-image.jpg",
      email: "hello@mytinytales.studio",
      description: SITE_DESC,
    },
    {
      "@type": "WebSite",
      "@id": "https://mytinytales.studio/#website",
      url: "https://mytinytales.studio",
      name: "My Tiny Tales",
      description: SITE_DESC,
      publisher: { "@id": "https://mytinytales.studio/#organization" },
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        {children}
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  );
}
