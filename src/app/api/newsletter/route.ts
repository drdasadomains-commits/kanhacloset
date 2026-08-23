import { NextResponse } from "next/server";
import { z } from "zod";

// Newsletter stub — swap the console log for your email provider when ready.
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const email = z.string().email().safeParse(form?.get("email") ?? "");
  if (!email.success) return NextResponse.redirect(new URL("/?newsletter=invalid", req.url), 303);
  console.log("[newsletter]", email.data);
  return NextResponse.redirect(new URL("/?newsletter=ok", req.url), 303);
}
