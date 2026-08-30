import type { ReactNode } from "react";

export const metadata = {
  title: "Contact",
  description: "Get in touch with My Tiny Tales. We reply within one business day.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
