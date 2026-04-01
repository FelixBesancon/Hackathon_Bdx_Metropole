export default function InscriptionPage() {
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
        maxWidth: 420,
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
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M19 8v6M22 11h-6" />
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a", margin: "0 0 6px", letterSpacing: "-0.4px" }}>
            Créer un compte
          </h1>
          <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
            Rejoignez la communauté Résilience urbaine
          </p>
        </div>

        <form style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                Prénom
              </label>
              <input
                type="text"
                placeholder="Jean"
                style={{
                  width: "100%", padding: "10px 12px",
                  border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8,
                  fontSize: 14, color: "#1a1a1a", outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                Nom
              </label>
              <input
                type="text"
                placeholder="Dupont"
                style={{
                  width: "100%", padding: "10px 12px",
                  border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8,
                  fontSize: 14, color: "#1a1a1a", outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

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
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.4px" }}>
              Mot de passe
            </label>
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
            Créer mon compte
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 13, color: "#888", marginTop: 20, marginBottom: 0 }}>
          Déjà un compte ?{" "}
          <a href="/connexion" style={{ color: "#2d6a4f", fontWeight: 600, textDecoration: "none" }}>
            Se connecter
          </a>
        </p>
      </div>
    </main>
  );
}
