import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import type { CurrentUser } from "@/hooks/useCurrentUser";

interface AccountSettingsProps {
  user: CurrentUser;
  onClose: () => void;
  onUpdate: (user: CurrentUser) => void;
}

export default function AccountSettings({ user, onClose, onUpdate }: AccountSettingsProps) {
  const [displayName, setDisplayName] = useState(user.displayName ?? user.username ?? "");
  const [newUsername, setNewUsername] = useState(user.username ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);
    try {
      const body: Record<string, string> = {};
      if (displayName.trim()) body.displayName = displayName.trim();
      if (newUsername && newUsername !== user.username) body.newUsername = newUsername;
      if (newPassword) { body.currentPassword = currentPassword; body.newPassword = newPassword; }

      const res = await fetch("/api/auth/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur.");
      } else {
        setSuccess("Paramètres enregistrés !");
        setCurrentPassword(""); setNewPassword("");
        onUpdate(data.user);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch {
      setError("Impossible de joindre le serveur.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.65rem 0.875rem",
    background: "hsl(265 20% 10%)", border: "1px solid hsl(270 30% 18%)",
    borderRadius: "8px", color: "hsl(270 20% 90%)",
    fontSize: "0.875rem", outline: "none",
    fontFamily: "system-ui, sans-serif", boxSizing: "border-box",
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
          padding: "1rem",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%", maxWidth: "420px",
            background: "hsl(265 20% 7%)",
            border: "1px solid hsl(270 35% 16%)",
            borderRadius: "18px", padding: "1.5rem",
            boxShadow: "0 20px 80px rgba(0,0,0,0.6), 0 0 0 1px hsl(270 30% 15%)",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <h2 style={{
              margin: 0, fontSize: "1.05rem", fontWeight: 700,
              color: "hsl(270 20% 90%)", fontFamily: "system-ui, sans-serif",
            }}>
              Paramètres du compte
            </h2>
            <button
              onClick={onClose}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "hsl(270 15% 45%)", padding: "0.25rem",
                borderRadius: "6px", display: "flex",
              }}
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Profile section */}
            <div style={{
              padding: "0.875rem", borderRadius: "10px",
              background: "hsl(265 20% 10%)", border: "1px solid hsl(270 25% 14%)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
                <User size={13} color="hsl(270 60% 60%)" />
                <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "hsl(270 40% 65%)", fontFamily: "system-ui, sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Profil
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "hsl(270 15% 50%)", marginBottom: "0.3rem", fontFamily: "system-ui, sans-serif" }}>
                    Nom affiché
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    style={inputStyle}
                    maxLength={40}
                    placeholder="Ton prénom ou surnom"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "hsl(270 15% 50%)", marginBottom: "0.3rem", fontFamily: "system-ui, sans-serif" }}>
                    Pseudo (identifiant)
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_\-.]/g, ""))}
                    style={inputStyle}
                    maxLength={32}
                    placeholder="pseudo"
                  />
                </div>
              </div>
            </div>

            {/* Password section */}
            <div style={{
              padding: "0.875rem", borderRadius: "10px",
              background: "hsl(265 20% 10%)", border: "1px solid hsl(270 25% 14%)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
                <Lock size={13} color="hsl(270 60% 60%)" />
                <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "hsl(270 40% 65%)", fontFamily: "system-ui, sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Changer le mot de passe
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "hsl(270 15% 50%)", marginBottom: "0.3rem", fontFamily: "system-ui, sans-serif" }}>
                    Mot de passe actuel
                  </label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={inputStyle} placeholder="••••••••" autoComplete="current-password" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "hsl(270 15% 50%)", marginBottom: "0.3rem", fontFamily: "system-ui, sans-serif" }}>
                    Nouveau mot de passe
                  </label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} placeholder="••••••••" autoComplete="new-password" />
                </div>
              </div>
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 0.875rem", background: "hsl(0 60% 15% / 0.6)", border: "1px solid hsl(0 60% 35% / 0.4)", borderRadius: "8px", fontSize: "0.82rem", color: "hsl(0 80% 70%)", fontFamily: "system-ui, sans-serif" }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />{error}
                </motion.div>
              )}
              {success && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 0.875rem", background: "hsl(145 60% 12% / 0.7)", border: "1px solid hsl(145 60% 30% / 0.4)", borderRadius: "8px", fontSize: "0.82rem", color: "hsl(145 70% 60%)", fontFamily: "system-ui, sans-serif" }}>
                  <CheckCircle2 size={14} style={{ flexShrink: 0 }} />{success}
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="button" onClick={onClose}
                style={{
                  flex: 1, padding: "0.7rem",
                  background: "hsl(265 20% 12%)", border: "1px solid hsl(270 25% 18%)",
                  borderRadius: "9px", color: "hsl(270 15% 55%)",
                  fontSize: "0.875rem", fontWeight: 600,
                  cursor: "pointer", fontFamily: "system-ui, sans-serif",
                }}>
                Annuler
              </button>
              <button type="submit" disabled={loading}
                style={{
                  flex: 2, padding: "0.7rem",
                  background: loading ? "hsl(270 40% 30%)" : "linear-gradient(135deg, hsl(270 80% 55%), hsl(280 70% 40%))",
                  border: "none", borderRadius: "9px",
                  color: "white", fontSize: "0.875rem", fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "system-ui, sans-serif",
                  boxShadow: loading ? "none" : "0 3px 12px hsl(270 80% 62% / 0.3)",
                }}>
                {loading ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
