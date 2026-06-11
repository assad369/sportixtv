"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { adminUsers } from "@/lib/db/collections";
import { createSession, destroySession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

export interface LoginState {
  error?: string;
}

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  // 5 attempts, then ~1 per 3 minutes.
  if (!rateLimit(`login:${ip}`, { capacity: 5, refillPerMin: 0.34 })) {
    return { error: "Too many attempts. Try again in a few minutes." };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const col = await adminUsers();
  const user = await col.findOne({
    email: parsed.data.email.toLowerCase().trim(),
  });
  // Compare against a dummy hash on unknown email to keep timing flat.
  const hash =
    user?.passwordHash ??
    "$2b$12$C6UzMDM.H6dfI/f/IKcEeO7ZB0XmQfIPgrz5K0eR0d0u3p7Z1y0a6";
  const valid = await bcrypt.compare(parsed.data.password, hash);
  if (!user || !valid) {
    return { error: "Invalid email or password." };
  }

  await col.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });
  await createSession({ adminId: user._id.toHexString(), email: user.email });
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}
