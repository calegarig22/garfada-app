"use server";
// Salva o @username escolhido no primeiro acesso.
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_.]{3,20}$/, "Use de 3 a 20 caracteres: letras sem acento, números, _ ou ponto.");

export type UsernameState = { error?: string; value?: string };

export async function salvarUsername(
  _prev: UsernameState,
  formData: FormData,
): Promise<UsernameState> {
  const session = await auth();
  if (!session?.user) redirect("/entrar");

  const raw = String(formData.get("username") ?? "").replace(/^@/, "");
  const parsed = usernameSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message, value: raw };

  const taken = await db.query.users.findFirst({
    where: eq(users.username, parsed.data),
    columns: { id: true },
  });
  if (taken && taken.id !== session.user.id) {
    return { error: `@${parsed.data} já está em uso. Tente outro.`, value: raw };
  }

  await db.update(users).set({ username: parsed.data }).where(eq(users.id, session.user.id));
  redirect("/explorar");
}
