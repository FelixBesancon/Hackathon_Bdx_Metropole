"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Accueil" },
    { href: "/carte", label: "Carte" },
  ];

  return (
    <nav
      style={{
        height: 56,
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(0,0,0,0.07)",
        boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: 8,
        zIndex: 9999,
        flexShrink: 0,
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* Brand */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 24, textDecoration: "none" }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: "#1b4332",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.2px" }}>
            Bordeaux Métropole
          </span>
          <span style={{ fontSize: 11, color: "#999", fontWeight: 400 }}>
            Résilience urbaine
          </span>
        </div>
      </Link>

      {/* Nav links */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
        {navLinks.map(({ href, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                textDecoration: "none",
                color: isActive ? "#1b4332" : "#666",
                background: isActive ? "#d8f3dc" : "transparent",
                transition: "all 0.15s ease",
              }}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* Auth buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Link
          href="/connexion"
          style={{
            padding: "7px 16px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
            color: "#2d6a4f",
            border: "1px solid rgba(45,106,79,0.3)",
            background: "transparent",
            transition: "all 0.15s ease",
          }}
        >
          Connexion
        </Link>
        <Link
          href="/inscription"
          style={{
            padding: "7px 16px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            color: "white",
            background: "#1b4332",
            transition: "all 0.15s ease",
          }}
        >
          Inscription
        </Link>
      </div>
    </nav>
  );
}
