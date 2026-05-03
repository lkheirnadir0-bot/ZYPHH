import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Sparkles, AlertCircle, ArrowLeft } from "lucide-react";

interface AccessGateProps {
  onAccess: () => void;
  onBack?: () => void;
}

export default function AccessGate({ onAccess, onBack }: AccessGateProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checking, setChecking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    fetch(`/api/access-keys/validate?key=${encodeURIComponent(code.trim())}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.valid) {
          setSuccess(true);
          setTimeout(() => {
            onAccess();
          }, 700);
          return;
        }
        throw new Error("invalid");
      })
      .catch(() => {
        setError(true);
        setShake(true);
        setCode("");
        setTimeout(() => setShake(false), 500);
        setTimeout(() => setError(false), 2500);
      })
      .finally(() => setChecking(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.18),transparent_55%)]" />
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28 }}
        className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-background/95 p-6 shadow-2xl backdrop-blur-2xl"
      >
        {onBack && (
          <button onClick={onBack} className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour
          </button>
        )}
        <div className="text-center space-y-3 mb-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <Sparkles className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">Entre ton code</h2>
            <p className="text-sm text-muted-foreground">Colle ton accès pour continuer</p>
          </div>
        </div>
        <motion.form onSubmit={handleSubmit} animate={shake ? { x: [-8, 8, -8, 8, -4, 4, 0] } : { x: 0 }} transition={{ duration: 0.35 }}>
          <div className={`mb-3 rounded-2xl border bg-black/20 px-4 py-4 transition-colors ${error ? "border-destructive/50" : success ? "border-primary/60" : "border-white/10 focus-within:border-primary/50"}`}>
            <div className="flex items-center gap-3">
              <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(false);
                }}
                placeholder="Code d'accès"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
                autoComplete="off"
                spellCheck={false}
                disabled={success || checking}
              />
              {success && <span className="text-primary text-sm font-bold">✓</span>}
            </div>
          </div>
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-3 flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                Code d’accès incorrect
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button
            type="submit"
            disabled={success || checking}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-2xl bg-primary px-4 py-4 font-black text-white shadow-[0_10px_35px_rgba(168,85,247,0.35)] disabled:opacity-70"
          >
            {success ? "Accès accordé..." : checking ? "Vérification..." : "Accéder"}
          </motion.button>
        </motion.form>
      </motion.div>
    </div>
  );
}
