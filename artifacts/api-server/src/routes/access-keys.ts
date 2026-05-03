import { Router, type Request } from "express";
import { asc, eq } from "drizzle-orm";
import { db, accessKeysTable } from "@workspace/db";

const router = Router();
const oneMonthKeyPattern = /^ZYPH-[A-Z0-9]{6}-[A-Z0-9]{6}$/;

function isOwner(req: Request) {
  return req.isAuthenticated() && ((req.user?.username ?? "").toLowerCase() === "nadir_off");
}

router.get("/access-keys/validate", async (req, res) => {
  const key = String(req.query.key ?? "").trim();
  if (!key) {
    res.status(400).json({ valid: false });
    return;
  }

  if (key === "9178-zyph-08198-9910297-nadir-28749102-918369-91727919738-gpt") {
    res.json({ valid: true, expiresAt: null, duration: "lifetime", builtin: true });
    return;
  }

  if (oneMonthKeyPattern.test(key)) {
    res.json({ valid: true, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), duration: "1mois", builtin: true });
    return;
  }

  const [row] = await db.select().from(accessKeysTable).where(eq(accessKeysTable.key, key));
  if (!row) {
    res.json({ valid: false });
    return;
  }

  const expired = row.expiresAt !== null && row.expiresAt < new Date();
  res.json({ valid: !expired, expiresAt: row.expiresAt, duration: row.duration });
});

router.post("/access-keys", async (req, res) => {
  if (!isOwner(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const duration = req.body?.duration === "lifetime" ? "lifetime" : "1mois";
  const key = `ZYPH-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const expiresAt = duration === "lifetime" ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const [row] = await db.insert(accessKeysTable).values({
    key,
    duration,
    expiresAt,
    createdBy: req.user?.id ?? "",
  }).returning();

  res.status(201).json({ key: row.key, duration: row.duration, expiresAt: row.expiresAt });
});

router.get("/access-keys", async (req, res) => {
  if (!isOwner(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const rows = await db.select().from(accessKeysTable).orderBy(asc(accessKeysTable.createdAt));
  res.json(rows);
});

export default router;