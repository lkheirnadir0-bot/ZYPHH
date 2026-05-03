import React, { useState, useRef, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Send, Plus, Trash2, MessageSquare, Sparkles,
  Home, Search, X, ChevronRight, Settings, LogOut,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import AccountSettings from "@/components/AccountSettings";
import type { CurrentUser } from "@/hooks/useCurrentUser";

import {
  useListConversations,
  useCreateConversation,
  useGetConversation,
  useDeleteConversation,
  getListConversationsQueryKey,
  getGetConversationQueryKey,
} from "@workspace/api-client-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import type { Message } from "@workspace/api-client-react/src/generated/api.schemas";

/* ─── Ripple ─── */
function RippleButton({ children, onClick, className = "", disabled = false, type = "button", style }: {
  children: React.ReactNode; onClick?: (e: React.MouseEvent) => void;
  className?: string; disabled?: boolean; type?: "button" | "submit"; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const fire = (e: React.MouseEvent) => {
    if (disabled) return;
    const btn = ref.current;
    if (btn) {
      const r = btn.getBoundingClientRect(), size = Math.max(r.width, r.height) * 2;
      const s = document.createElement("span");
      s.className = "ripple-circle";
      s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
      btn.appendChild(s); setTimeout(() => s.remove(), 600);
    }
    onClick?.(e);
  };
  return <button ref={ref} type={type} disabled={disabled} onClick={fire} className={`btn-ripple ${className}`} style={style}>{children}</button>;
}

/* ─── Typing dots ─── */
function TypingIndicator() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
      className="flex items-end gap-3">
      <ZyphAvatar />
      <div className="bg-card border border-border/50 rounded-2xl rounded-bl-sm px-5 py-4">
        <div className="flex gap-1.5">
          <span className="typing-dot w-2 h-2 rounded-full bg-primary" />
          <span className="typing-dot w-2 h-2 rounded-full bg-primary" />
          <span className="typing-dot w-2 h-2 rounded-full bg-primary" />
        </div>
      </div>
    </motion.div>
  );
}

function ZyphAvatar({ pulse = false }: { pulse?: boolean }) {
  return (
    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.4), rgba(139,92,246,0.2))", border: "1px solid rgba(168,85,247,0.35)" }}>
      <Sparkles className={`w-3.5 h-3.5 text-primary ${pulse ? "animate-pulse" : ""}`} />
    </div>
  );
}

/* ─── Main ─── */
interface ChatPageProps {
  onHome?: () => void;
  user?: CurrentUser;
  onLogout?: () => void;
}

export default function ChatPage({ onHome, user, onLogout }: ChatPageProps) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [showTyping, setShowTyping] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(user ?? null);
  const [showNewConvModal, setShowNewConvModal] = useState(false);
  const [newConvTitle, setNewConvTitle] = useState("");
  const [showOwnerPanel, setShowOwnerPanel] = useState(false);
  const [keyDuration, setKeyDuration] = useState<"1mois" | "lifetime">("1mois");
  const [generatedKey, setGeneratedKey] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const isOwner = (currentUser?.username ?? "").toLowerCase() === "nadir_off";

  const scrollRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef<unknown>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: conversations = [], isLoading: loadingConvs } = useListConversations();
  const { data: activeConv, isLoading: loadingConv } = useGetConversation(
    activeId as number,
    { query: { enabled: !!activeId, queryKey: getGetConversationQueryKey(activeId as number) } }
  );
  const createConv = useCreateConversation();
  const deleteConv = useDeleteConversation();

  const scrollToBottom = useCallback(() => {
    const vp = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (vp) vp.scrollTop = vp.scrollHeight;
  }, []);
  useEffect(() => { scrollToBottom(); }, [activeConv?.messages, streamContent, showTyping, scrollToBottom]);

  const filtered = conversations.filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase()));

  const handleNew = () => {
    setNewConvTitle("");
    setShowNewConvModal(true);
  };

  const handleCreateConv = (e?: React.FormEvent) => {
    e?.preventDefault();
    const title = newConvTitle.trim() || "Nouvelle conversation";
    setShowNewConvModal(false);
    createConv.mutate({ data: { title } }, {
      onSuccess: (c) => { setActiveId(c.id); qc.invalidateQueries({ queryKey: getListConversationsQueryKey() }); },
      onError: () => toast({ title: "Erreur", variant: "destructive" }),
    });
  };

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    const key = `ZYPH-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const expiry = keyDuration === "lifetime" ? "À vie" : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("fr-FR");
    setGeneratedKey(key);
    setExpiresAt(expiry);
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConv.mutate({ id }, { onSuccess: () => { if (activeId === id) setActiveId(null); qc.invalidateQueries({ queryKey: getListConversationsQueryKey() }); } });
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !activeId || streaming) return;
    const text = input.trim();
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";

    const qk = getGetConversationQueryKey(activeId);
    prevRef.current = qc.getQueryData(qk);
    const prev = qc.getQueryData<{ messages: Message[] } & Record<string, unknown>>(qk);
    if (prev) qc.setQueryData(qk, { ...prev, messages: [...prev.messages, { id: Date.now(), conversationId: activeId, role: "user", content: text, createdAt: new Date().toISOString() } as Message] });

    setStreaming(true); setShowTyping(true); setStreamContent("");
    try {
      const sessionId = localStorage.getItem("zyph_session_id") ?? "";
      const res = await fetch(`/api/openai/conversations/${activeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Session-ID": sessionId },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) throw new Error();
      setShowTyping(false);
      const reader = res.body!.getReader(); const dec = new TextDecoder();
      let done = false; let acc = "";
      while (!done) {
        const { value, done: d } = await reader.read(); done = d;
        if (value) for (const line of dec.decode(value, { stream: true }).split("\n").filter(l => l.startsWith("data: "))) {
          try { const j = JSON.parse(line.slice(6)); if (j.content) { acc += j.content; setStreamContent(acc); } } catch {}
        }
      }
      qc.invalidateQueries({ queryKey: getGetConversationQueryKey(activeId) });
      qc.invalidateQueries({ queryKey: getListConversationsQueryKey() });
    } catch {
      setShowTyping(false);
      toast({ title: "Erreur", variant: "destructive" });
      if (prevRef.current) qc.setQueryData(qk, prevRef.current);
    } finally { setStreaming(false); setShowTyping(false); setStreamContent(""); }
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">

      {/* ══════════ SIDEBAR ══════════ */}
      <aside className="w-[272px] flex-shrink-0 flex flex-col h-full relative"
        style={{
          background: "linear-gradient(180deg, hsl(265,22%,6%) 0%, hsl(265,20%,4%) 100%)",
          borderRight: "1px solid rgba(168,85,247,0.12)",
        }}>

        {/* Ambient glow top */}
        <div className="absolute top-0 inset-x-0 h-64 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(168,85,247,0.18) 0%, transparent 65%)" }} />

        {/* Scrolling background text */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" style={{ opacity: 0.025 }}>
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="absolute whitespace-nowrap font-black text-primary"
              style={{ fontSize: '10px', letterSpacing: '0.2em', top: `${i * 56}px`, left: 0, right: 0,
                animation: `ticker ${20 + i * 1.5}s linear infinite ${i % 2 === 0 ? '' : 'reverse'}` }}>
              {Array.from({ length: 8 }).map((_, j) => (
                <span key={j} className="mr-6">IA SANS RESTRICTION &bull; ZYPH GPT &bull; FAIT PAR NADIR &bull;</span>
              ))}
            </div>
          ))}
        </div>

        {/* ── HEADER ── */}
        <div className="relative px-4 pt-5 pb-4">

          {/* Brand row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg,rgba(168,85,247,0.5),rgba(139,92,246,0.25))", border: "1px solid rgba(168,85,247,0.45)", boxShadow: "0 0 16px rgba(168,85,247,0.25)" }}>
                <Sparkles className="w-4 h-4 text-primary" fill="currentColor" />
              </div>
              <div className="leading-none">
                <span className="font-black text-[15px] tracking-tight">ZYPH </span>
                <span className="font-black text-[15px] tracking-tight text-primary">GPT</span>
              </div>
            </div>

            {/* Action icons */}
            <div className="flex items-center gap-0.5">
              <button onClick={onHome} title="Retour au menu"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-white/6 transition-all">
                <Home className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setSearchOpen(o => !o)} title="Rechercher"
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${searchOpen ? "bg-primary/15 text-primary" : "text-muted-foreground/50 hover:text-foreground hover:bg-white/6"}`}>
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/35" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une conversation..." autoFocus
                    className="w-full text-xs pl-9 pr-8 py-2.5 rounded-xl outline-none placeholder:text-muted-foreground/30 transition-all"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(168,85,247,0.15)", color: "hsl(var(--foreground))" }} />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* New conversation button */}
          <RippleButton onClick={handleNew}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all group relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(139,92,246,0.1))", border: "1px solid rgba(168,85,247,0.3)", boxShadow: "0 0 20px rgba(168,85,247,0.08)" }}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(168,85,247,0.3)", border: "1px solid rgba(168,85,247,0.4)" }}>
              <Plus className="w-3 h-3 text-primary group-hover:rotate-90 transition-transform duration-300" />
            </div>
            <span className="text-foreground/80 group-hover:text-foreground transition-colors text-[13px]">Nouvelle conversation</span>
          </RippleButton>
        </div>

        {/* Divider */}
        <div className="mx-4 mb-1" style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.15), transparent)" }} />

        {/* ── CONVERSATIONS LIST ── */}
        <ScrollArea className="flex-1 px-3 py-2">
          {loadingConvs ? (
            <div className="flex justify-center py-12">
              <div className="w-5 h-5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="py-14 flex flex-col items-center gap-3 px-4 text-center">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.12)" }}>
                <MessageSquare className="w-5 h-5 text-muted-foreground/25" />
              </div>
              <p className="text-[12px] text-muted-foreground/35 leading-relaxed">
                {search ? "Aucun résultat trouvé" : "Aucune conversation.\nCommence-en une nouvelle."}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-0.5 pb-2">
              {!search && (
                <p className="px-2 pt-0.5 pb-2 text-[10px] font-bold text-muted-foreground/25 uppercase tracking-[0.15em]">
                  Historique
                </p>
              )}
              <AnimatePresence initial={false}>
                {filtered.map((conv, i) => (
                  <motion.div key={conv.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.15, delay: i * 0.02 }}
                    onClick={() => setActiveId(conv.id)}
                    className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 overflow-hidden ${
                      activeId === conv.id ? "text-foreground" : "text-muted-foreground/60 hover:text-foreground/90"
                    }`}
                    style={activeId === conv.id ? {
                      background: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(139,92,246,0.08))",
                      border: "1px solid rgba(168,85,247,0.25)",
                      boxShadow: "0 2px 12px rgba(168,85,247,0.1)",
                    } : {
                      background: "transparent",
                      border: "1px solid transparent",
                    }}>

                    {/* Active accent bar */}
                    {activeId === conv.id && (
                      <motion.div layoutId="conv-bar"
                        className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full"
                        style={{ background: "linear-gradient(180deg, rgba(168,85,247,1), rgba(139,92,246,0.6))" }} />
                    )}

                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                      activeId === conv.id ? "bg-primary/20" : "bg-white/4 group-hover:bg-white/6"
                    }`}>
                      <MessageSquare className={`w-3 h-3 transition-colors ${activeId === conv.id ? "text-primary" : "text-muted-foreground/35 group-hover:text-muted-foreground/60"}`} />
                    </div>

                    <span className="flex-1 truncate text-[12.5px] font-medium leading-tight">{conv.title}</span>

                    <button onClick={(e) => handleDelete(conv.id, e)}
                      className="w-5 h-5 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-md text-muted-foreground/30 hover:text-red-400 hover:bg-red-400/10 transition-all flex-shrink-0">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {/* ── FOOTER ── */}
        <div className="p-3 relative">
          <div className="absolute inset-x-0 top-0" style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.12), transparent)" }} />
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl"
            style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.12)" }}>
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[13px] font-black"
              style={{ background: "linear-gradient(135deg,rgba(168,85,247,0.55),rgba(139,92,246,0.3))", border: "1px solid rgba(168,85,247,0.4)", color: "rgba(255,255,255,0.9)" }}>
              {(currentUser?.displayName ?? currentUser?.username ?? "?").charAt(0).toUpperCase()}
            </div>
            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold text-foreground/85 leading-none mb-0.5 truncate">
                {currentUser?.displayName ?? currentUser?.username ?? "Utilisateur"}
              </p>
              <p className="text-[10px] text-muted-foreground/35 leading-none tracking-wide truncate">
                @{currentUser?.username ?? "..."}
              </p>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setShowSettings(true)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/30 hover:text-primary/80 hover:bg-primary/10 transition-all"
                title="Paramètres"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
              {isOwner && (
                <button
                  onClick={() => setShowOwnerPanel(true)}
                  className="px-2.5 h-7 rounded-lg text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-all"
                  title="Ouvrir le panneau owner"
                >
                  Owner
                </button>
              )}
              <button
                onClick={onLogout}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/30 hover:text-red-400 hover:bg-red-400/10 transition-all"
                title="Déconnexion"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Account Settings Modal ── */}
      {showSettings && currentUser && (
        <AccountSettings
          user={currentUser}
          onClose={() => setShowSettings(false)}
          onUpdate={(updated) => { setCurrentUser(updated); setShowSettings(false); }}
        />
      )}

      {showOwnerPanel && isOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md rounded-2xl border border-primary/20 bg-background p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Panneau owner</h3>
              <button onClick={() => setShowOwnerPanel(false)} className="text-sm text-muted-foreground">Fermer</button>
            </div>
            <form onSubmit={handleGenerateKey} className="space-y-3">
              <div className="flex gap-2">
                <button type="button" onClick={() => setKeyDuration("1mois")} className={`px-3 py-2 rounded-lg text-sm ${keyDuration === "1mois" ? "bg-primary text-white" : "bg-white/5"}`}>1 mois</button>
                <button type="button" onClick={() => setKeyDuration("lifetime")} className={`px-3 py-2 rounded-lg text-sm ${keyDuration === "lifetime" ? "bg-primary text-white" : "bg-white/5"}`}>Lifetime</button>
              </div>
              <button type="submit" className="w-full rounded-lg bg-primary px-4 py-2 font-semibold text-white">Créer la key</button>
            </form>
            {generatedKey && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                <div>Key: <span className="font-mono">{generatedKey}</span></div>
                <div>Expiration: {expiresAt}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════ MAIN ══════════ */}
      <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[300px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(168,85,247,0.05) 0%, transparent 70%)" }} />

        <AnimatePresence mode="wait">
          {activeId ? (
            <motion.div key={`c-${activeId}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }} className="flex flex-col h-full">

              {/* header */}
              <header className="flex items-center justify-between px-6 py-3.5 flex-shrink-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.15)", backdropFilter: "blur(16px)" }}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"
                    style={{ boxShadow: "0 0 8px rgba(168,85,247,0.9)" }} />
                  <span className="text-sm font-semibold text-foreground/90 truncate">{activeConv?.title ?? "…"}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                    style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.15)" }}>
                    <Sparkles className="w-2.5 h-2.5 text-primary/70" />
                    <span className="text-[11px] text-muted-foreground/50 font-mono">Zyph GPT</span>
                  </div>
                </div>
              </header>

              {/* messages */}
              <ScrollArea ref={scrollRef} className="flex-1 px-4 md:px-10">
                <div className="max-w-2xl mx-auto py-8 space-y-5">
                  {loadingConv ? (
                    <div className="flex justify-center h-40 items-center">
                      <div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                    </div>
                  ) : (
                    <>
                      <AnimatePresence initial={false}>
                        {activeConv?.messages?.map((msg) => (
                          <motion.div key={msg.id}
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-end gap-3`}>

                            {msg.role === "assistant" && <ZyphAvatar />}

                            <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm ${
                              msg.role === "user" ? "text-white rounded-br-sm" : "rounded-bl-sm text-foreground/90"
                            }`}
                              style={msg.role === "user" ? {
                                background: "linear-gradient(135deg, hsl(270,80%,55%), hsl(270,70%,45%))",
                                boxShadow: "0 4px 20px rgba(168,85,247,0.35)",
                              } : {
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.08)",
                              }}>
                              {msg.role === "user"
                                ? <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                : <div className="prose prose-invert prose-sm max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                  </div>
                              }
                            </div>

                            {msg.role === "user" && (
                              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-black"
                                style={{ background: "linear-gradient(135deg,rgba(168,85,247,0.45),rgba(139,92,246,0.2))", border: "1px solid rgba(168,85,247,0.35)", color: "rgba(255,255,255,0.85)" }}>
                                {(currentUser?.displayName ?? currentUser?.username ?? "?").charAt(0).toUpperCase()}
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      <AnimatePresence>{showTyping && !streamContent && <TypingIndicator />}</AnimatePresence>

                      <AnimatePresence>
                        {streaming && streamContent && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="flex justify-start items-end gap-3">
                            <ZyphAvatar pulse />
                            <div className="max-w-[78%] rounded-2xl rounded-bl-sm px-4 py-3 relative overflow-hidden"
                              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(168,85,247,0.2)" }}>
                              <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.05), transparent)", animation: "shimmer 2.5s linear infinite" }} />
                              </div>
                              <div className="prose prose-invert prose-sm max-w-none relative z-10">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamContent}</ReactMarkdown>
                                <span className="inline-block w-[3px] h-4 ml-0.5 align-middle bg-primary rounded-sm"
                                  style={{ animation: "cursor-blink 0.8s step-end infinite" }} />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>
              </ScrollArea>

              {/* input */}
              <div className="px-4 md:px-10 py-4 flex-shrink-0"
                style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <form onSubmit={handleSend} className="max-w-2xl mx-auto">
                  <div className="relative group">
                    <div className={`absolute -inset-px rounded-2xl transition-all duration-300 ${streaming ? "opacity-40" : "opacity-0 group-focus-within:opacity-100"}`}
                      style={{ background: "linear-gradient(135deg,rgba(168,85,247,0.35),rgba(139,92,246,0.1))", filter: "blur(8px)" }} />
                    <div className="relative flex items-end gap-3 rounded-2xl px-4 py-3.5 transition-all duration-200"
                      style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${streaming ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.08)"}` }}>
                      <textarea ref={taRef} value={input} onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Envoie un message à Zyph..." disabled={streaming} rows={1}
                        className="flex-1 bg-transparent text-sm outline-none resize-none placeholder:text-muted-foreground/35 min-h-[26px] max-h-[130px] py-0 leading-[1.6] disabled:opacity-40"
                        onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 130) + "px"; }} />
                      <RippleButton type="submit" disabled={!input.trim() || streaming}
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-30"
                        style={{ background: input.trim() && !streaming ? "linear-gradient(135deg,hsl(270,80%,55%),hsl(270,70%,45%))" : "rgba(255,255,255,0.06)", boxShadow: input.trim() && !streaming ? "0 0 16px rgba(168,85,247,0.4)" : "none" }}>
                        <Send className="w-4 h-4 text-white" />
                      </RippleButton>
                    </div>
                  </div>
                  <p className="text-center text-[10px] text-muted-foreground/20 mt-2 font-mono tracking-wide">
                    Zyph GPT — IA sans restriction — Fait par Nadir
                  </p>
                </form>
              </div>
            </motion.div>
          ) : (
            /* Welcome screen */
            <motion.div key="welcome" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              className="flex-1 flex flex-col items-center justify-center px-6 text-center">

              <motion.div
                animate={{ boxShadow: ['0 0 20px rgba(168,85,247,0.2)', '0 0 50px rgba(168,85,247,0.4)', '0 0 20px rgba(168,85,247,0.2)'] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-20 h-20 rounded-3xl flex items-center justify-center mb-8"
                style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.25), rgba(139,92,246,0.1))", border: "1px solid rgba(168,85,247,0.3)" }}>
                <Sparkles className="w-10 h-10 text-primary" fill="currentColor" />
              </motion.div>

              <h2 className="text-3xl font-black mb-2 tracking-tight">
                Zyph <span className="text-primary">GPT</span>
              </h2>
              <p className="text-muted-foreground/50 text-sm mb-10 max-w-xs">
                L'intelligence artificielle créée par Nadir. Sans restriction, sans limite.
              </p>

              <RippleButton onClick={handleNew}
                className="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-bold text-white relative overflow-hidden group"
                style={{ background: "linear-gradient(135deg,hsl(270,80%,55%),hsl(270,70%,45%))", boxShadow: "0 0 30px rgba(168,85,247,0.4)" }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <Plus className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Commencer une conversation</span>
                <ChevronRight className="w-4 h-4 relative z-10" />
              </RippleButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══════════ MODAL NOUVELLE CONVERSATION ══════════ */}
      <AnimatePresence>
        {showNewConvModal && (
          <motion.div
            key="new-conv-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowNewConvModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
              className="w-full max-w-sm mx-4 rounded-2xl p-6 relative"
              style={{
                background: "hsl(265,22%,8%)",
                border: "1px solid rgba(168,85,247,0.25)",
                boxShadow: "0 0 60px rgba(168,85,247,0.15), 0 24px 64px rgba(0,0,0,0.6)",
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,rgba(168,85,247,0.4),rgba(139,92,246,0.2))", border: "1px solid rgba(168,85,247,0.35)" }}>
                  <Plus className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-[15px] leading-none text-foreground">Nouvelle conversation</h3>
                  <p className="text-[11px] text-muted-foreground/45 mt-1">Donne un nom à cette discussion</p>
                </div>
                <button
                  onClick={() => setShowNewConvModal(false)}
                  className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-white/8 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateConv} className="space-y-4">
                <div>
                  <input
                    autoFocus
                    value={newConvTitle}
                    onChange={e => setNewConvTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === "Escape") setShowNewConvModal(false); }}
                    placeholder="Ex : Idées de projet, Aide en maths…"
                    maxLength={80}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder:text-muted-foreground/30 transition-all"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(168,85,247,0.2)",
                      color: "hsl(var(--foreground))",
                    }}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = "rgba(168,85,247,0.5)"; }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderColor = "rgba(168,85,247,0.2)"; }}
                  />
                </div>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowNewConvModal(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground/60 hover:text-foreground transition-all"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all relative overflow-hidden group"
                    style={{
                      background: "linear-gradient(135deg,hsl(270,80%,55%),hsl(270,70%,45%))",
                      boxShadow: "0 0 20px rgba(168,85,247,0.35)",
                    }}
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative z-10">Créer</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
