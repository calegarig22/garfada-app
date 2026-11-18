"use server";
// Entrar e criar conta com e-mail e senha.
import { sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, validatePassword } from "@/lib/password";

export type AuthFormState = { error?: string; name?: string; email?: string };

const normEmail = (v: FormDataEntryValue | null) => String(v ?? "").trim().toLowerCase();

async function entrarComSenha(email: string, password: string, redirectTo: string) {
  try {
    await signIn("senha", { email, password, redirectTo });
  } catch (e) {
    // Senha errada vira mensagem; o "redirecionar" de sucesso precisa seguir adiante.
    if (e instanceof AuthError) return "E-mail ou senha incorretos.";
    throw e;
  }
}

export async function entrar(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = normEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const error = await entrarComSenha(email, password, "/explorar");
  return { error, email };
}

export async function criarConta(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  // Campo invisível: pessoas não preenchem, robôs de cadastro sim.
  if (String(formData.get("website") ?? "") !== "") redirect("/entrar");

  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const email = normEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const back = (error: string): AuthFormState => ({ error, name, email });

  if (!name) return back("Informe seu nome.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 200) return back("E-mail inválido.");
  const pwErr = validatePassword(password);
  if (pwErr) return back(pwErr);
  if (String(formData.get("pass2") ?? "") !== password) return back("As senhas não conferem.");

  const exists = await db.query.users.findFirst({
    where: sql`lower(${users.email}) = ${email}`,
    columns: { id: true },
  });
  if (exists) return back("Já existe uma conta com este e-mail. Entre pelo login.");

  const [created] = await db
    .insert(users)
    .values({ name, email, passwordHash: await hashPassword(password) })
    .onConflictDoNothing()
    .returning({ id: users.id });
  if (!created) return back("Já existe uma conta com este e-mail. Entre pelo login.");

  // Conta criada: entra direto e segue para escolher o @username.
  const error = await entrarComSenha(email, password, "/bem-vindo");
  return back(error ?? "Conta criada, mas não deu para entrar. Tente pelo login.");
}
