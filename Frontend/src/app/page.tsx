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

      {/* Qu'est-ce qu'une canicule ? */}
      <section style={{
        maxWidth: 960, margin: "0 auto", padding: "0 32px 80px",
      }}>
        <div style={{
          background: "white", borderRadius: 18, padding: "48px 40px",
          border: "1px solid rgba(0,0,0,0.06)",
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#fff7ed", borderRadius: 20,
            padding: "5px 14px", fontSize: 12, fontWeight: 600,
            color: "#c2410c", marginBottom: 20,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            Comprendre
          </div>

          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.6px", margin: "0 0 16px", lineHeight: 1.2 }}>
            Qu&apos;est-ce qu&apos;un épisode caniculaire ?
          </h2>

          <p style={{ fontSize: 15, color: "#555", lineHeight: 1.8, margin: "0 0 24px", maxWidth: 700 }}>
            Une <strong>canicule</strong> n&apos;est pas simplement une journée de forte chaleur.
            Météo-France parle d&apos;épisode caniculaire lorsque les températures restent
            anormalement élevées <strong>pendant au moins 3 jours et 3 nuits consécutifs</strong>,
            de jour comme de nuit, en dépassant des seuils définis pour chaque département.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div style={{
              background: "#fffbeb", borderRadius: 12, padding: "20px",
              border: "1px solid rgba(194,65,12,0.1)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c2410c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2" />
                </svg>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>Le jour</span>
              </div>
              <p style={{ fontSize: 13, color: "#666", lineHeight: 1.6, margin: 0 }}>
                Les températures maximales dépassent les <strong>33 à 36°C</strong> selon
                les départements (ex : 36°C pour Toulouse et Marseille, 31°C pour Paris).
              </p>
            </div>
            <div style={{
              background: "#eef2ff", borderRadius: 12, padding: "20px",
              border: "1px solid rgba(67,56,202,0.1)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4338ca" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>La nuit</span>
              </div>
              <p style={{ fontSize: 13, color: "#666", lineHeight: 1.6, margin: 0 }}>
                Les températures minimales ne descendent pas sous les <strong>18 à 24°C</strong>.
                On parle alors de <strong>« nuit tropicale »</strong> (nuit où la température
                ne passe pas sous les 20°C).
              </p>
            </div>
          </div>

          <div style={{
            background: "#fef2f2", borderRadius: 12, padding: "16px 20px",
            border: "1px solid rgba(193,18,31,0.08)",
            display: "flex", gap: 12, alignItems: "flex-start",
          }}>
            <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>&#9888;&#65039;</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#c1121f", marginBottom: 4 }}>
                Pourquoi la nuit est le facteur le plus dangereux
              </div>
              <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6, margin: 0 }}>
                C&apos;est pendant la nuit que le corps se repose et régule sa température interne.
                Lorsque la chaleur ne retombe pas, l&apos;organisme ne peut jamais récupérer : le stress
                thermique s&apos;accumule jour après jour. C&apos;est cette <strong>absence de répit nocturne</strong> qui
                rend les canicules prolongées potentiellement mortelles, bien plus que les pics de
                température en journée. La qualité du sommeil se dégrade, le rythme cardiaque reste
                élevé, et le risque de coup de chaleur augmente de façon exponentielle après 3 nuits
                consécutives au-dessus des seuils.
              </p>
            </div>
          </div>

          <p style={{ fontSize: 11, color: "#aaa", marginTop: 16, marginBottom: 0 }}>
            Source : Météo-France — définition et seuils départementaux de canicule ; Santé Publique France — impacts sanitaires des nuits tropicales.
          </p>
        </div>
      </section>

      {/* Dangers du réchauffement */}
      <section style={{
        maxWidth: 960, margin: "0 auto", padding: "0 32px 80px",
      }}>
        <div style={{
          background: "linear-gradient(135deg, #fff5f5 0%, #fef2f2 100%)",
          border: "1px solid rgba(193,18,31,0.1)",
          borderRadius: 18, padding: "48px 40px",
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(193,18,31,0.08)", borderRadius: 20,
            padding: "5px 14px", fontSize: 12, fontWeight: 600,
            color: "#c1121f", marginBottom: 20,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Un enjeu vital
          </div>

          <h2 style={{ fontSize: 32, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.8px", margin: "0 0 16px", lineHeight: 1.2 }}>
            Le réchauffement climatique<br />
            <span style={{ color: "#c1121f" }}>tue en silence</span>
          </h2>

          <p style={{ fontSize: 15, color: "#555", lineHeight: 1.8, margin: "0 0 28px", maxWidth: 700 }}>
            En France, les canicules sont la première cause de mortalité liée aux événements
            climatiques. Depuis 1947, Météo-France a recensé <strong style={{ color: "#c1121f" }}>51 vagues de chaleur</strong>,
            dont 26 sur les 15 dernières années seulement. La durée de la saison des canicules
            s&apos;allonge : autrefois limitée à juillet-août, elle s&apos;étend désormais de mi-juin à septembre.
            Déshydratation, coups de chaleur, aggravation de maladies cardiovasculaires et respiratoires
            — les conséquences sont souvent mortelles, en particulier pour les personnes âgées, les enfants
            et les travailleurs en extérieur.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { value: "51", label: "Vagues de chaleur en France depuis 1947 (Météo-France)" },
              { value: "46°C", label: "Record absolu atteint à Vérargues (Hérault) en juin 2019" },
              { value: "x10", label: "Jours de canicule d'ici 2100 dans un scénario à +4°C (Météo-France)" },
            ].map(({ value, label }) => (
              <div key={label} style={{
                background: "white", borderRadius: 12, padding: "20px 16px",
                textAlign: "center", border: "1px solid rgba(193,18,31,0.08)",
              }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#c1121f", marginBottom: 6 }}>{value}</div>
                <div style={{ fontSize: 12, color: "#888", lineHeight: 1.4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Évolution chronologique */}
      <section style={{
        maxWidth: 960, margin: "0 auto", padding: "0 32px 80px",
      }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.8px", margin: "0 0 12px" }}>
            L&apos;accélération des canicules en France
          </h2>
          <p style={{ fontSize: 15, color: "#666", lineHeight: 1.7, maxWidth: 620, margin: "0 auto" }}>
            Les données de Météo-France et de Santé Publique France montrent une tendance claire :
            les vagues de chaleur sont plus fréquentes, plus longues et plus meurtrières.
          </p>
        </div>

        {/* Frise chronologique */}
        <div style={{ position: "relative", paddingLeft: 32 }}>
          <div style={{
            position: "absolute", left: 11, top: 8, bottom: 8, width: 2,
            background: "linear-gradient(to bottom, #fca5a5, #c1121f)",
          }} />
          {[
            { year: "1947–2010", title: "25 vagues de chaleur en 63 ans", desc: "Environ une vague tous les 2-3 ans en moyenne. La canicule de 1976 cause ~6 000 décès, largement passés inaperçus à l'époque.", color: "#f87171" },
            { year: "2003", title: "15 000 décès en deux semaines", desc: "La canicule d'août 2003 reste la plus meurtrière. Prise de conscience nationale, création du Plan National Canicule.", color: "#ef4444" },
            { year: "2019", title: "Record absolu : 46°C", desc: "1 435 décès liés à la chaleur. Record national de température à Vérargues (Hérault) le 28 juin. Les canicules commencent désormais dès juin.", color: "#dc2626" },
            { year: "2020", title: "1 900 décès, 15 départements en alerte rouge", desc: "La canicule d'août frappe alors que le pays gère la crise sanitaire du Covid-19. Double vulnérabilité pour les populations à risque.", color: "#b91c1c" },
            { year: "2022", title: "1 500+ records de température battus", desc: "Trois vagues de chaleur successives sur l'été. Des feux de forêt historiques ravagent la Gironde (30 000 hectares brûlés).", color: "#991b1b" },
            { year: "2011–2025", title: "26 vagues de chaleur en seulement 15 ans", desc: "Autant de vagues en 15 ans que durant les 63 années précédentes. La saison s'étend de mi-juin à septembre, avec un épisode inédit en septembre 2023.", color: "#7f1d1d" },
          ].map(({ year, title, desc, color }) => (
            <div key={year} style={{ position: "relative", marginBottom: 24, paddingLeft: 24 }}>
              <div style={{
                position: "absolute", left: -26, top: 6,
                width: 12, height: 12, borderRadius: "50%",
                background: color, border: "3px solid white",
                boxShadow: "0 0 0 2px " + color,
              }} />
              <div style={{
                background: "white", borderRadius: 12, padding: "16px 20px",
                border: "1px solid rgba(0,0,0,0.06)",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{year}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Projections */}
        <div style={{
          marginTop: 12, background: "#fef2f2", borderRadius: 14,
          padding: "20px 24px", border: "1px solid rgba(193,18,31,0.08)",
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20,
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#c1121f", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
              Projection 2050 (+2,7°C)
            </div>
            <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>
              Saison des canicules de <strong>début juin à mi-septembre</strong>.
              Probabilité de 45% de canicule en plein été.
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#7f1d1d", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
              Projection 2100 (+4°C)
            </div>
            <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>
              Saison de <strong>mi-mai à fin septembre</strong>, jusqu&apos;à 2 mois consécutifs de canicule.
              La canicule de 2003 deviendrait un été « normal ».
            </div>
          </div>
        </div>

        {/* Sources */}
        <div style={{
          marginTop: 24, padding: "16px 20px", background: "#f7f6f2",
          borderRadius: 10, border: "1px solid rgba(0,0,0,0.04)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
            Sources
          </div>
          <ul style={{ margin: 0, padding: "0 0 0 16px", fontSize: 12, color: "#888", lineHeight: 1.8 }}>
            <li>Météo-France — <em>Changement climatique et vagues de chaleur</em> (meteofrance.com) : 51 vagues de chaleur depuis 1947, projections climatiques</li>
            <li>Santé Publique France — Bilans <em>Chaleur et santé</em> (santepubliquefrance.fr) : données de mortalité par épisode caniculaire</li>
            <li>Santé Publique France — Système de surveillance syndromique SurSaUD / GÉODES</li>
            <li>Wikipedia — <em>Canicule en France</em> : compilation des données InVS, Météo-France et INSEE (mortalité 1976, 1983, 2003, 2017–2023)</li>
          </ul>
        </div>
      </section>

      {/* Conseils et gestes pratiques */}
      <section style={{
        maxWidth: 960, margin: "0 auto", padding: "0 32px 80px",
      }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.8px", margin: "0 0 12px" }}>
            Comment se protéger ?
          </h2>
          <p style={{ fontSize: 15, color: "#666", lineHeight: 1.7, maxWidth: 560, margin: "0 auto" }}>
            Des gestes simples peuvent sauver des vies lors des épisodes de forte chaleur.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          {[
            {
              icon: "💧", title: "S'hydrater régulièrement",
              desc: "Buvez au moins 1,5L d'eau par jour même sans soif. Repérez les fontaines d'eau potable les plus proches grâce à notre carte.",
            },
            {
              icon: "🏛️", title: "Trouver des zones fraîches",
              desc: "Identifiez les îlots de fraîcheur près de chez vous : parcs, espaces boisés, bâtiments climatisés ouverts au public.",
            },
            {
              icon: "🌳", title: "Végétaliser pour rafraîchir",
              desc: "La végétation urbaine peut réduire la température locale de 2 à 5°C. Chaque arbre planté est un investissement pour la santé publique.",
            },
            {
              icon: "📱", title: "Rester informé",
              desc: "Consultez régulièrement les alertes météo et utilisez notre plateforme pour anticiper les pics de chaleur dans votre quartier.",
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{
              background: "white", borderRadius: 14, padding: "24px 28px",
              border: "1px solid rgba(0,0,0,0.06)",
              display: "flex", gap: 16, alignItems: "flex-start",
            }}>
              <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", margin: "0 0 6px" }}>{title}</h3>
                <p style={{ fontSize: 13, color: "#666", lineHeight: 1.6, margin: 0 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Notre mission */}
      <section style={{
        maxWidth: 960, margin: "0 auto", padding: "0 32px 80px",
      }}>
        <div style={{
          background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)",
          borderRadius: 18, padding: "48px 40px", textAlign: "center",
        }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "white", letterSpacing: "-0.5px", margin: "0 0 16px" }}>
            Notre mission : rendre la chaleur visible
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", lineHeight: 1.8, maxWidth: 600, margin: "0 auto 28px" }}>
            En croisant les données d'îlots de chaleur, de végétation et de points d'eau,
            nous permettons à chaque citoyen de <strong style={{ color: "#d8f3dc" }}>repérer les zones à risque</strong>,
            de <strong style={{ color: "#d8f3dc" }}>trouver les refuges les plus proches</strong> et de
            comprendre comment améliorer durablement les conditions de vie dans sa ville.
          </p>
          <Link href="/carte" style={{
            display: "inline-block", padding: "13px 32px",
            borderRadius: 10, fontSize: 14, fontWeight: 600,
            textDecoration: "none", color: "#1b4332", background: "white",
          }}>
            Consulter la carte interactive
          </Link>
        </div>
      </section>
    </main>
  );
}
