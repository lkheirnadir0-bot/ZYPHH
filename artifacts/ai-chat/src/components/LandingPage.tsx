import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Sparkles, ArrowRight, Brain, Zap, Shield, MessageSquare, Star, ChevronDown } from "lucide-react";

interface LandingPageProps {
  onStart: () => void;
}

function RippleButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    const btn = btnRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      const circle = document.createElement("span");
      circle.className = "ripple-circle";
      circle.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
      btn.appendChild(circle);
      setTimeout(() => circle.remove(), 600);
    }
    onClick?.();
  };

  return (
    <button ref={btnRef} onClick={handleClick} className={`btn-ripple ${className}`}>
      {children}
    </button>
  );
}

const features = [
  { icon: Brain, title: "Intelligence avancée", desc: "Zyph comprend le contexte de vos conversations et s'adapte à vos besoins en temps réel." },
  { icon: Zap, title: "Réponses instantanées", desc: "Obtenez des réponses détaillées en quelques secondes, streamées mot par mot directement." },
  { icon: MessageSquare, title: "Conversations illimitées", desc: "Créez autant de conversations que vous voulez, toutes sauvegardées et accessibles à tout moment." },
  { icon: Shield, title: "Accès privé", desc: "Zyph GPT est un accès exclusif créé par Nadir. Votre expérience reste personnelle et sécurisée." },
  { icon: Sparkles, title: "Créé par Nadir", desc: "Développé avec soin par Nadir, Zyph GPT est une IA pensée pour être utile, rapide et agréable." },
  { icon: Star, title: "Toujours disponible", desc: "Disponible 24h/24 et 7j/7, Zyph est prêt à vous aider quel que soit le moment." },
];

export default function LandingPage({ onStart }: LandingPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -60]);

  return (
    <div ref={containerRef} className="min-h-screen bg-background overflow-x-hidden">

      {/* ── Background orbs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] rounded-full bg-primary/15 blur-[120px]"
          style={{ animation: 'orb-pulse 6s ease-in-out infinite' }} />
        <div className="absolute bottom-[-10%] right-[5%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[100px]"
          style={{ animation: 'orb-pulse 8s ease-in-out infinite 2s' }} />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-fuchsia-500/8 blur-[80px]"
          style={{ animation: 'orb-pulse 10s ease-in-out infinite 4s' }} />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(168,85,247,1) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,1) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }} />
      </div>

      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-8 border-b border-border/30 backdrop-blur-xl bg-background/60"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <span className="font-black text-xl tracking-tight">
            <span className="text-foreground">ZYPH</span>
            <span className="text-primary"> GPT</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground font-medium">
          <a href="#features" className="hover:text-foreground transition-colors">Fonctionnalités</a>
          <a href="#about" className="hover:text-foreground transition-colors">À propos</a>
        </div>

        <RippleButton
          onClick={onStart}
          className="flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ boxShadow: '0 0 20px rgba(168,85,247,0.4)' } as React.CSSProperties}
        >
          <span>Start now</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </RippleButton>
      </motion.nav>

      {/* ── Hero Section ── */}
      <motion.section
        style={{ opacity: heroOpacity, y: heroY }}
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-16"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold mb-8 tracking-wider uppercase"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Intelligence Artificielle Avancée
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
          className="text-7xl md:text-9xl font-black tracking-tighter leading-none mb-4"
        >
          <span className="gradient-text">ZYPH</span>
          <br />
          <span className="text-foreground/90">GPT</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed"
        >
          L'intelligence artificielle créée par <span className="text-foreground font-semibold">Nadir</span>.
          Rapide, puissante, et toujours disponible.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.5 }}
          className="flex items-center gap-4 flex-wrap justify-center"
        >
          <RippleButton
            onClick={onStart}
            className="flex items-center gap-2.5 px-8 py-4 rounded-full bg-primary text-primary-foreground text-base font-bold transition-all duration-200 hover:scale-105 active:scale-95 group"
            style={{ boxShadow: '0 0 30px rgba(168,85,247,0.5), 0 4px 15px rgba(168,85,247,0.3)' } as React.CSSProperties}
          >
            <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            Commencer maintenant
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </RippleButton>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground/50"
        >
          <span className="text-xs tracking-widest uppercase font-mono">Défiler</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </motion.div>

        {/* Floating orb decoration */}
        <div className="absolute top-1/3 right-[8%] w-24 h-24 rounded-full border border-primary/20 bg-primary/5 blur-sm hidden lg:block"
          style={{ animation: 'float 6s ease-in-out infinite' }} />
        <div className="absolute top-1/2 left-[6%] w-14 h-14 rounded-full border border-purple-400/20 bg-purple-400/5 blur-sm hidden lg:block"
          style={{ animation: 'float 8s ease-in-out infinite 2s' }} />
      </motion.section>

      {/* ── Ticker ── */}
      <div className="relative overflow-hidden py-4 border-y border-border/30 bg-card/30 backdrop-blur-sm">
        <div className="flex whitespace-nowrap" style={{ animation: 'ticker 20s linear infinite' }}>
          {[...Array(3)].map((_, i) => (
            <span key={i} className="text-xs text-muted-foreground/50 font-mono tracking-[0.25em] uppercase px-8">
              ZYPH GPT &bull; FAIT PAR NADIR &bull; IA AVANCÉE &bull; GRATUIT &bull; CONVERSATIONS ILLIMITÉES &bull; RÉPONSES EN TEMPS RÉEL &bull;&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ── Features Section ── */}
      <section id="features" className="relative py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold mb-6 tracking-wider uppercase">
              Fonctionnalités
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              Pourquoi choisir <span className="gradient-text">Zyph ?</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Zyph GPT a été conçu pour être l'assistant idéal — rapide, intelligent, et toujours là quand vous en avez besoin.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="relative p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-base mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About Section ── */}
      <section id="about" className="relative py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative p-10 md:p-14 rounded-3xl border border-primary/20 bg-card/60 backdrop-blur-sm overflow-hidden"
          >
            {/* Glow corner */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/8 blur-[80px] rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-black">À propos de <span className="gradient-text">Zyph GPT</span></h2>
                  <p className="text-muted-foreground text-sm">Créé avec passion par Nadir</p>
                </div>
              </div>

              <div className="space-y-5 text-muted-foreground leading-relaxed">
                <p className="text-base">
                  <span className="text-foreground font-semibold">Zyph GPT</span> est une intelligence artificielle développée entièrement par <span className="text-primary font-semibold">Nadir</span>, avec pour objectif de créer un assistant vraiment utile, accessible et puissant.
                </p>
                <p className="text-base">
                  Zyph — son prénom — n'est pas un simple chatbot. C'est un assistant conçu pour comprendre vos questions en profondeur, qu'il s'agisse de code, de rédaction, de mathématiques, d'explications complexes ou simplement d'une conversation.
                </p>
                <p className="text-base">
                  Contrairement aux grandes plateformes commerciales, <span className="text-foreground font-medium">Zyph GPT est entièrement gratuit</span>. Nadir a développé ce projet pour mettre à disposition un outil d'IA de qualité, sans abonnement, sans limite artificielle.
                </p>
                <p className="text-base">
                  Chaque conversation avec Zyph est sauvegardée, permettant de reprendre là où vous vous étiez arrêté. Les réponses sont affichées en temps réel, mot par mot, pour une expérience fluide et naturelle.
                </p>
                <p className="text-base">
                  Zyph GPT est en constante évolution. Nadir continue de travailler sur de nouvelles fonctionnalités pour améliorer votre expérience au fil du temps.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-10 pt-8 border-t border-border/50">
                {[
                  { value: "100%", label: "Gratuit" },
                  { value: "∞", label: "Conversations" },
                  { value: "24/7", label: "Disponible" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="text-3xl font-black gradient-text">{s.value}</div>
                    <div className="text-xs text-muted-foreground mt-1 tracking-wide uppercase font-mono">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative py-28 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
            Prêt à discuter avec <span className="gradient-text">Zyph ?</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-lg mx-auto">
            Rejoignez l'expérience. Aucune inscription, aucun abonnement. Juste Zyph et vous.
          </p>
          <RippleButton
            onClick={onStart}
            className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-primary text-primary-foreground text-lg font-black tracking-wide transition-all duration-200 hover:scale-105 active:scale-95 group"
            style={{ boxShadow: '0 0 40px rgba(168,85,247,0.5), 0 8px 25px rgba(168,85,247,0.3)' } as React.CSSProperties}
          >
            <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            Lancer Zyph GPT
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </RippleButton>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/30 py-8 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 rounded bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Sparkles className="w-2.5 h-2.5 text-primary" />
          </div>
          <span className="font-black text-sm">ZYPH <span className="text-primary">GPT</span></span>
        </div>
        <p className="text-xs text-muted-foreground/50 font-mono tracking-wider">Fait par Nadir &mdash; 2025</p>
      </footer>
    </div>
  );
}
