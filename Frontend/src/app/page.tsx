"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user } = useAuth();
  return (
    <main style={{
      flex: 1,
      overflow: "auto",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      background: "#f7f6f2",
    }}>
      {/* Hero */}
      <section style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "80px 32px 64px",
        textAlign: "center",
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "#d8f3dc",
          border: "1px solid rgba(45,106,79,0.2)",
          borderRadius: 20,
          padding: "5px 14px",
          fontSize: 12,
          fontWeight: 500,
          color: "#2d6a4f",
          marginBottom: 28,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
          Hackathon Bordeaux Métropole 2026
        </div>

        <h1 style={{
          fontSize: 52,
          fontWeight: 800,
          color: "#1a1a1a",
          letterSpacing: "-1.5px",
          lineHeight: 1.1,
          margin: "0 0 24px",
        }}>
          La ville qui résiste<br />
          <span style={{ color: "#2d6a4f" }}>à la chaleur</span>
        </h1>

        <p style={{
          fontSize: 18,
          color: "#666",
          lineHeight: 1.7,
          maxWidth: 620,
          margin: "0 auto 40px",
        }}>
          Une plateforme interactive pour visualiser les îlots de chaleur, la végétation
          urbaine et les ressources fraîcheur de la métropole bordelaise — et agir ensemble.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
          <Link href="/carte" style={{
            padding: "13px 28px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            color: "white",
            background: "#1b4332",
          }}>
            Explorer la carte
          </Link>
          <Link href={user ? "/carte" : "/inscription"} style={{
            padding: "13px 28px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            color: "#1b4332",
            border: "1.5px solid rgba(27,67,50,0.25)",
            background: "white",
          }}>
            Rejoindre le projet
          </Link>
        </div>
      </section>

      {/* Features */}
      <section style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "0 32px 80px",
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 20,
      }}>
        {[
          {
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c1121f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2" />
              </svg>
            ),
            bg: "#fff5f5",
            border: "rgba(193,18,31,0.12)",
            title: "Îlots de chaleur",
            desc: "Visualisez les zones chaudes et fraîches de la métropole grâce aux données officielles Open Data.",
          },
          {
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
            ),
            bg: "#f0fdf4",
            border: "rgba(45,106,79,0.15)",
            title: "Végétation urbaine",
            desc: "Cartographie précise des arbres et espaces verts, commune par commune, sur tout le territoire.",
          },
          {
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0066cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
              </svg>
            ),
            bg: "#eff6ff",
            border: "rgba(0,102,204,0.12)",
            title: "Fontaines & fraîcheur",
            desc: "Localisez tous les points d'eau potable et refuges climatiques disponibles en ville.",
          },
        ].map(({ icon, bg, border, title, desc }) => (
          <div key={title} style={{
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: 14,
            padding: "24px",
          }}>
            <div style={{
              width: 42, height: 42,
              borderRadius: 10,
              background: "white",
              border: `1px solid ${border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 16,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
              {icon}
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", margin: "0 0 8px" }}>{title}</h3>
            <p style={{ fontSize: 13, color: "#666", lineHeight: 1.6, margin: 0 }}>{desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
