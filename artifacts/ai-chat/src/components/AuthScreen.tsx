import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, UserPlus, Sparkles, Eye, EyeOff, AlertCircle } from "lucide-react";
import type { CurrentUser } from "@/hooks/useCurrentUser";

interface AuthScreenProps {
  onAuth: (user: CurrentUser) => void;
}

export default function AuthScreen({ onAuth }: AuthScreenProps) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = tab === "login"
        ? { username, password }
        : { username, password, displayName: displayName.trim() || username };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
      } else {
        onAuth(data.user);
      }
    } catch {
      setError("Impossible de joindre le serveur.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem 1rem",
    background: "hsl(265 20% 10%)",
    border: "1px solid hsl(270 30% 18%)",
    borderRadius: "10px",
    color: "hsl(270 20% 90%)",
    fontSize: "0.9rem",
    outline: "none",
    fontFamily: "system-ui, sans-serif",
    transition: "border-color 0.15s",
    boxSizing: "border-box" as const,
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "hsl(265 20% 4%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Glow */}
      <div style={{
        position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
        width: "600px", height: "600px",
        background: "radial-gradient(circle, hsl(270 80% 62% / 0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: "1.75rem", maxWidth: "400px", width: "100%", position: "relative", zIndex: 1,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: "44px", height: "44px", borderRadius: "13px",
            background: "linear-gradient(135deg, hsl(270 80% 62%), hsl(280 70% 45%))",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 28px hsl(270 80% 62% / 0.45)",
          }}>
            <Sparkles size={22} color="white" />
          </div>
          <span style={{
            fontSize: "1.4rem", fontWeight: 800, letterSpacing: "0.06em",
            color: "hsl(270 80% 82%)", fontFamily: "system-ui, sans-serif",
          }}>
            ZYPH GPT
          </span>
        </div>

        {/* Card */}
        <div style={{
          width: "100%", background: "hsl(265 20% 7%)",
          border: "1px solid hsl(270 35% 16%)", borderRadius: "18px",
          padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem",
          boxShadow: "0 12px 60px hsl(270 80% 62% / 0.1), 0 4px 16px rgba(0,0,0,0.4)",
        }}>
          {/* Tabs */}
          <div style={{
            display: "flex", background: "hsl(265 20% 10%)",
            borderRadius: "10px", padding: "3px", gap: "3px",
          }}>
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); }}
                style={{
                  flex: 1, padding: "0.55rem",
                  borderRadius: "8px", border: "none", cursor: "pointer",
                  fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", fontWeight: 600,
                  transition: "all 0.18s",
                  background: tab === t ? "linear-gradient(135deg, hsl(270 80% 55%), hsl(280 70% 42%))" : "transparent",
                  color: tab === t ? "white" : "hsl(270 15% 50%)",
                  boxShadow: tab === t ? "0 2px 10px hsl(270 80% 62% / 0.3)" : "none",
                }}
              >
                {t === "login" ? "Connexion" : "Inscription"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <AnimatePresence mode="popLayout">
              {tab === "register" && (
                <motion.div
                  key="displayName"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  style={{ overflow: "hidden" }}
                >
                  <label style={{ display: "block", fontSize: "0.78rem", color: "hsl(270 20% 55%)", marginBottom: "0.35rem", fontFamily: "system-ui, sans-serif" }}>
                    Nom affiché
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ton prénom ou surnom"
                    style={inputStyle}
                    maxLength={40}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label style={{ display: "block", fontSize: "0.78rem", color: "hsl(270 20% 55%)", marginBottom: "0.35rem", fontFamily: "system-ui, sans-serif" }}>
                Pseudo
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_\-.]/g, ""))}
                placeholder="ex: nadir_93"
                required
                style={inputStyle}
                maxLength={32}
                autoComplete="username"
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.78rem", color: "hsl(270 20% 55%)", marginBottom: "0.35rem", fontFamily: "system-ui, sans-serif" }}>
                Mot de passe
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ ...inputStyle, paddingRight: "2.75rem" }}
                  autoComplete={tab === "login" ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  style={{
                    position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "hsl(270 15% 45%)", padding: 0, display: "flex",
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.65rem 0.875rem",
                    background: "hsl(0 60% 15% / 0.6)", border: "1px solid hsl(0 60% 35% / 0.4)",
                    borderRadius: "8px", fontSize: "0.82rem",
                    color: "hsl(0 80% 70%)", fontFamily: "system-ui, sans-serif",
                  }}
                >
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              whileHover={!loading ? { scale: 1.01 } : {}}
              whileTap={!loading ? { scale: 0.99 } : {}}
              disabled={loading}
              style={{
                width: "100%", padding: "0.875rem",
                background: loading
                  ? "hsl(270 40% 30%)"
                  : "linear-gradient(135deg, hsl(270 80% 55%), hsl(280 70% 40%))",
                border: "none", borderRadius: "10px",
                color: "white", fontSize: "0.925rem", fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                boxShadow: loading ? "none" : "0 4px 20px hsl(270 80% 62% / 0.35)",
                fontFamily: "system-ui, sans-serif",
                transition: "background 0.2s, box-shadow 0.2s",
              }}
            >
              {loading ? (
                <div style={{
                  width: "18px", height: "18px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTop: "2px solid white", borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                }} />
              ) : tab === "login" ? (
                <><LogIn size={17} /> Se connecter</>
              ) : (
                <><UserPlus size={17} /> Créer mon compte</>
              )}
            </motion.button>
          </form>

          <p style={{
            fontSize: "0.72rem", color: "hsl(270 15% 35%)",
            textAlign: "center", fontFamily: "system-ui, sans-serif", margin: 0,
          }}>
            {tab === "login"
              ? "Pas encore de compte ? Clique sur Inscription."
              : "Déjà inscrit ? Clique sur Connexion."}
          </p>
        </div>

        <p style={{
          fontSize: "0.7rem", color: "hsl(270 10% 28%)",
          fontFamily: "system-ui, sans-serif", textAlign: "center",
        }}>
          Zyph GPT — Intelligence créée par Nadir
        </p>
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
