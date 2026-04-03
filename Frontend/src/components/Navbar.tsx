"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Accueil" },
    { href: "/carte", label: "Carte" },
  ];

  function handleLogout() {
    logout();
    setMenuOpen(false);
    router.push("/");
  }

  const initials = user
    ? user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "";

  return (
    <nav style={{
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
    }}>
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

      {/* Auth zone */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {user ? (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "transparent", border: "none", cursor: "pointer",
                padding: "4px 8px 4px 4px",
                borderRadius: 10,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f0faf4")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "#1b4332",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, color: "white", flexShrink: 0,
              }}>
                {initials}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>
                {user.name.split(" ")[0]}
              </span>
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: menuOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {menuOpen && (
              <>
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 100 }}
                  onClick={() => setMenuOpen(false)}
                />
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 8px)",
                  background: "white",
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 12,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                  minWidth: 200,
                  zIndex: 101,
                  overflow: "hidden",
                }}>
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{user.name}</div>
                    <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{user.email}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: "100%", padding: "12px 16px",
                      background: "transparent", border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 10,
                      fontSize: 13, color: "#e74c3c", fontWeight: 500,
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fff5f5")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Se déconnecter
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </nav>
  );
}
