import bcrypt from "bcryptjs";
import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  clearSession,
  getSessionId,
  createSession,
  getSession,
  updateSession,
} from "../lib/auth";
import type { SessionData } from "../lib/auth";

const router: IRouter = Router();

/* ─── helpers ─── */
function userToSession(u: typeof usersTable.$inferSelect): SessionData["user"] {
  return {
    id: u.id,
    username: u.username ?? null,
    displayName: u.displayName ?? u.username ?? null,
    email: u.email ?? null,
    firstName: u.firstName ?? null,
    lastName: u.lastName ?? null,
    profileImageUrl: u.profileImageUrl ?? null,
  };
}

function setSessionCookie(res: Response, sid: string) {
  res.cookie("sid", sid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

/* ─── GET /auth/user ─── */
router.get("/auth/user", (req: Request, res: Response) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.json({ user: null });
  }
});

/* ─── POST /auth/register ─── */
router.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const { username, password, displayName } = req.body as {
      username?: string;
      password?: string;
      displayName?: string;
    };

    if (!username || !password) {
      res.status(400).json({ error: "Pseudo et mot de passe requis." });
      return;
    }
    if (username.length < 3 || username.length > 32) {
      res.status(400).json({ error: "Le pseudo doit faire entre 3 et 32 caractères." });
      return;
    }
    if (!/^[a-zA-Z0-9_\-.]+$/.test(username)) {
      res.status(400).json({ error: "Pseudo invalide (lettres, chiffres, _, -, . uniquement)." });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Le mot de passe doit faire au moins 6 caractères." });
      return;
    }

    // Check username taken
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, username));
    if (existing) {
      res.status(409).json({ error: "Ce pseudo est déjà utilisé." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db
      .insert(usersTable)
      .values({
        username,
        passwordHash,
        displayName: displayName?.trim() || username,
      })
      .returning();

    const sid = await createSession({ user: userToSession(user), access_token: "" });
    setSessionCookie(res, sid);
    res.status(201).json({ user: userToSession(user) });
  } catch (err) {
    req.log.error({ err }, "Register error");
    res.status(500).json({ error: "Erreur serveur." });
  }
});

/* ─── POST /auth/login ─── */
router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || !password) {
      res.status(400).json({ error: "Pseudo et mot de passe requis." });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: "Pseudo ou mot de passe incorrect." });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Pseudo ou mot de passe incorrect." });
      return;
    }

    const sid = await createSession({ user: userToSession(user), access_token: "" });
    setSessionCookie(res, sid);
    res.json({ user: userToSession(user) });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Erreur serveur." });
  }
});

/* ─── POST /auth/logout ─── */
router.post("/auth/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.json({ success: true });
});

/* ─── PUT /auth/settings ─── */
router.put("/auth/settings", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Non authentifié." });
    return;
  }

  try {
    const { displayName, newUsername, currentPassword, newPassword } = req.body as {
      displayName?: string;
      newUsername?: string;
      currentPassword?: string;
      newPassword?: string;
    };

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id));
    if (!user) {
      res.status(404).json({ error: "Utilisateur introuvable." });
      return;
    }

    const updates: Partial<typeof usersTable.$inferInsert> = {};

    if (displayName !== undefined) {
      updates.displayName = displayName.trim() || user.displayName || user.username || "";
    }

    if (newUsername && newUsername !== user.username) {
      if (newUsername.length < 3 || newUsername.length > 32) {
        res.status(400).json({ error: "Le pseudo doit faire entre 3 et 32 caractères." });
        return;
      }
      if (!/^[a-zA-Z0-9_\-.]+$/.test(newUsername)) {
        res.status(400).json({ error: "Pseudo invalide." });
        return;
      }
      const [taken] = await db.select().from(usersTable).where(eq(usersTable.username, newUsername));
      if (taken) {
        res.status(409).json({ error: "Ce pseudo est déjà utilisé." });
        return;
      }
      updates.username = newUsername;
    }

    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({ error: "Mot de passe actuel requis pour changer de mot de passe." });
        return;
      }
      if (!user.passwordHash || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
        res.status(401).json({ error: "Mot de passe actuel incorrect." });
        return;
      }
      if (newPassword.length < 6) {
        res.status(400).json({ error: "Le nouveau mot de passe doit faire au moins 6 caractères." });
        return;
      }
      updates.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    const [updated] = await db
      .update(usersTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(usersTable.id, user.id))
      .returning();

    // Update session user data
    const sid = getSessionId(req);
    if (sid) {
      const { getSession, updateSession } = await import("../lib/auth");
      const session = await getSession(sid);
      if (session) {
        session.user = userToSession(updated);
        await updateSession(sid, session);
      }
    }

    res.json({ user: userToSession(updated) });
  } catch (err) {
    req.log.error({ err }, "Settings error");
    res.status(500).json({ error: "Erreur serveur." });
  }
});

export default router;
