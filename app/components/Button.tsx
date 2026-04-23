"use client";
import Link from "next/link";
import { ReactNode, CSSProperties } from "react";

type Variant = "primary" | "secondary" | "ghost" | "icon";

interface ButtonProps {
  variant?: Variant;
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
  style?: CSSProperties;
  "aria-label"?: string;
  type?: "button" | "submit" | "reset";
  className?: string;
}

const STYLES: Record<Variant, CSSProperties> = {
  primary: {
    background: "linear-gradient(135deg, #E8C07A 0%, #D4A24C 100%)",
    boxShadow: "0 8px 32px rgba(232,192,122,0.25), inset 0 1px 0 rgba(255,255,255,0.3)",
    color: "#0F0B1F",
    border: "none",
    fontWeight: 700,
    borderRadius: 50,
    padding: "15px 36px",
    fontSize: 16,
  },
  secondary: {
    background: "transparent",
    border: "1px solid rgba(245,240,224,0.35)",
    color: "#F5F0E0",
    fontWeight: 600,
    borderRadius: 50,
    padding: "14px 32px",
    fontSize: 16,
  },
  ghost: {
    background: "transparent",
    border: "none",
    color: "var(--accent-gold)",
    fontWeight: 500,
    borderRadius: 8,
    padding: "10px 16px",
    fontSize: 15,
    textDecoration: "none",
  },
  icon: {
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#F5F0E0",
    borderRadius: "50%",
    width: 52,
    height: 52,
    padding: 0,
    fontSize: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

const HOVER_CSS = `
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 12px 40px rgba(232,192,122,0.4), inset 0 1px 0 rgba(255,255,255,0.3) !important; }
  .btn-primary:hover .btn-arrow { transform: translateX(4px); }
  .btn-primary .btn-arrow { display: inline-block; transition: transform 0.2s ease; }
  .btn-secondary:hover { background: rgba(245,240,224,0.08) !important; }
  .btn-ghost:hover { text-decoration: underline; }
  .btn-icon:hover { background: rgba(255,255,255,0.15) !important; border-color: rgba(255,255,255,0.2) !important; }
  .btn-primary, .btn-secondary, .btn-ghost, .btn-icon { transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease; cursor: pointer; }
`;

let styleInjected = false;

export default function Button({
  variant = "primary",
  href,
  onClick,
  children,
  disabled,
  style,
  className,
  "aria-label": ariaLabel,
  type = "button",
}: ButtonProps) {
  // Inject hover CSS once
  if (typeof document !== "undefined" && !styleInjected) {
    const el = document.createElement("style");
    el.textContent = HOVER_CSS;
    document.head.appendChild(el);
    styleInjected = true;
  }

  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontFamily: "var(--font-inter, sans-serif)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    textDecoration: "none",
    whiteSpace: "nowrap",
    userSelect: "none",
    ...STYLES[variant],
    ...style,
  };

  const cls = `btn-${variant}${className ? " " + className : ""}`;

  if (href && !disabled) {
    return (
      <Link href={href} style={base} className={cls} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={base}
      className={cls}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
