import type { ReactNode } from "react";

export const metadata = {
  title: "FAQ",
  description: "Answers about making a personalised storybook with My Tiny Tales: how it works, what photo to use, privacy, printing, and our happiness guarantee.",
  alternates: { canonical: "/faq" },
};

export default function FaqLayout({ children }: { children: ReactNode }) {
  return children;
}
