import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createAdminSession } from "@/lib/auth";

const Body = z.object({ email: z.string().email(), password: z.string().min(1).max(200) });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and password" }, { status: 400 });

  const admin = await db.adminUser.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  // Constant-time-ish: always run a hash comparison
  const hash = admin?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin";
  const ok = await bcrypt.compare(parsed.data.password, hash);
  if (!admin || !ok) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  await createAdminSession({ sub: admin.id, email: admin.email, name: admin.name ?? "Admin", role: admin.role === "SUPERADMIN" ? "SUPERADMIN" : "ADMIN" });
  return NextResponse.json({ ok: true });
}
