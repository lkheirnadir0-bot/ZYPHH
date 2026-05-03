import { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import NotFound from "@/pages/not-found";
import ChatPage from "@/pages/chat";
import LandingPage from "@/components/LandingPage";
import AccessGate from "@/components/AccessGate";
import AuthScreen from "@/components/AuthScreen";
import { useCurrentUser, type CurrentUser } from "@/hooks/useCurrentUser";
import { useQueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient();

type Stage = "landing" | "plans" | "gate" | "auth";

function AuthedContent({ onHome }: { onHome: () => void }) {
  const { user, isLoading, isAuthenticated, refetch, logout } = useCurrentUser();
  const qc = useQueryClient();

  if (isLoading) {
    return (
      <div style={{
        minHeight: "100vh", background: "hsl(265 20% 4%)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          width: "40px", height: "40px",
          border: "3px solid hsl(270 80% 62% / 0.3)",
          borderTop: "3px solid hsl(270 80% 62%)",
          borderRadius: "50%", animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <AuthScreen onAuth={(_u: CurrentUser) => { refetch(); }} />;
  }

  const handleLogout = async () => {
    await logout();
    qc.clear();
    // Don't call onHome() — user is null so AuthedContent re-renders with AuthScreen
  };

  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Switch>
        <Route path="/">
          {() => <ChatPage onHome={onHome} user={user} onLogout={handleLogout} />}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}

function App() {
  const [stage, setStage] = useState<Stage>(() => {
    return "landing";
  });
  const [showCodeEntry, setShowCodeEntry] = useState(false);

  const handleStartNow = () => setStage("plans");
  const handleAccess = () => {
    localStorage.setItem("zyph_access", "granted");
    setStage("auth");
    setShowCodeEntry(false);
  };
  const handleBackToLanding = () => setStage("landing");
  const openCodeEntry = () => {
    setShowCodeEntry(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AnimatePresence mode="wait">
          {stage === "landing" && (
            <motion.div key="landing" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <LandingPage onStart={handleStartNow} />
            </motion.div>
          )}
          {stage === "plans" && (
            <motion.div
              key="plans"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="min-h-screen bg-background flex items-center justify-center p-6"
            >
              <div className="relative w-full max-w-5xl">
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute -top-24 left-1/2 h-64 w-[42rem] -translate-x-1/2 rounded-full bg-primary/12 blur-[120px]" />
                  <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-fuchsia-500/10 blur-[90px]" />
                </div>

                <div className="relative text-center space-y-4 mb-10">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-primary text-xs font-semibold tracking-widest uppercase">
                    Abonnements
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black tracking-tight">Choisis ton accès</h1>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Sélectionne ton abonnement puis clique sur continuer pour entrer ton code.
                  </p>
                </div>

                <div className="relative grid gap-5 md:grid-cols-2">
                  {([
                    { id: "1mois", title: "Abonnement 1 mois", price: "15 €", desc: "Accès pendant 30 jours", badge: "Populaire", glow: "from-fuchsia-500/30 to-violet-500/10" },
                    { id: "lifetime", title: "Abonnement lifetime", price: "195 €", desc: "Accès à vie sans expiration", badge: "Meilleur choix", glow: "from-violet-400/30 to-indigo-500/10" },
                  ] as const).map((plan) => {
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={openCodeEntry}
                        className="group relative overflow-hidden rounded-[2rem] border border-white/10 p-0 text-left transition-all duration-300"
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${plan.glow} opacity-90`} />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_55%)]" />
                        <div className="relative p-7 md:p-8 backdrop-blur-md min-h-[240px] flex flex-col">
                          <div className="flex items-center justify-between gap-3 mb-8">
                            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white/80">
                              {plan.badge}
                            </span>
                            <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-white/70 transition-all">
                              Affiché
                            </span>
                          </div>
                          <div className="mt-auto space-y-4">
                            <div className="space-y-2">
                              <h2 className="text-3xl md:text-4xl font-black tracking-tight">{plan.title}</h2>
                              <p className="text-white/75 text-sm md:text-base max-w-sm">{plan.desc}</p>
                            </div>
                            <div className="flex items-end justify-between gap-4">
                              <div className="text-xs uppercase tracking-[0.28em] text-white/55">Prix</div>
                              <div className="text-4xl md:text-5xl font-black text-white">{plan.price}</div>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="relative mt-6 rounded-[2rem] border border-white/10 bg-black/25 p-5 md:p-6 backdrop-blur-2xl">
                  <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-4 text-center font-semibold text-primary">
                    Rejoins le serveur Discord pour payer un abonnement
                  </div>

                  <button
                    type="button"
                    onClick={openCodeEntry}
                    className="mt-5 w-full rounded-2xl bg-primary px-4 py-4 font-black text-white shadow-[0_10px_35px_rgba(168,85,247,0.35)]"
                  >
                    Continuer
                  </button>
                </div>
              </div>
            </motion.div>
          )}
          {showCodeEntry && (
            <motion.div
              key="plans-code"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6"
            >
              <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-background/95 p-6 shadow-2xl backdrop-blur-xl">
                <div className="text-center space-y-2 mb-5">
                  <h2 className="text-2xl font-black">Entre ton code</h2>
                  <p className="text-sm text-muted-foreground">
                    Entre ton code pour continuer
                  </p>
                </div>
                <AccessGate
                  onAccess={handleAccess}
                  onBack={() => setShowCodeEntry(false)}
                />
              </div>
            </motion.div>
          )}
          {stage === "auth" && (
            <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="h-screen">
              <AuthedContent onHome={handleBackToLanding} />
            </motion.div>
          )}
        </AnimatePresence>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
