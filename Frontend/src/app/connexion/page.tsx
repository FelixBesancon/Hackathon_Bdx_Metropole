export default function ConnexionPage() {
  return (
    <main style={{
      flex: 1,
      overflow: "auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f7f6f2",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      padding: "40px 16px",
    }}>
      <div style={{
        background: "white",
        border: "1px solid rgba(0,0,0,0.07)",
        borderRadius: 16,
        padding: "40px",
        width: "100%",
        maxWidth: 400,
        boxShadow: "0 4px 32px rgba(0,0,0,0.06)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "#1b4332",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a", margin: "0 0 6px", letterSpacing: "-0.4px" }}>
            Connexion
          </h1>
          <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
            Bienvenue sur Résilience urbaine
          </p>
        </div>

        <form style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.4px" }}>
              Email
            </label>
            <input
              type="email"
              placeholder="jean.dupont@exemple.fr"
              style={{
                width: "100%", padding: "10px 12px",
                border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8,
                fontSize: 14, color: "#1a1a1a", outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                Mot de passe
              </label>
              <a href="#" style={{ fontSize: 12, color: "#2d6a4f", textDecoration: "none", fontWeight: 500 }}>
                Mot de passe oublié ?
              </a>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              style={{
                width: "100%", padding: "10px 12px",
                border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8,
                fontSize: 14, color: "#1a1a1a", outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: "12px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              color: "white",
              background: "#1b4332",
              border: "none",
              cursor: "pointer",
              marginTop: 4,
            }}
          >
            Se connecter
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 13, color: "#888", marginTop: 20, marginBottom: 0 }}>
          Pas encore de compte ?{" "}
          <a href="/inscription" style={{ color: "#2d6a4f", fontWeight: 600, textDecoration: "none" }}>
            S'inscrire
          </a>
        </p>
      </div>
    </main>
  );
}
