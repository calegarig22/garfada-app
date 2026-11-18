// "Camada de acesso": funções únicas para saber quem está logado.
// Toda tela protegida passa por aqui, assim a regra fica num lugar só.
import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Devolve o usuário logado com @username; senão manda para o login ou para escolher o @. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/entrar");
  if (!session.user.username) redirect("/bem-vindo");
  return { ...session.user, username: session.user.username };
}

/** Só para a administração (por enquanto, a conta do dono do app). */
export async function requireAdmin() {
  const me = await requireUser();
  const { db } = await import("@/db");
  const row = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, me.id),
    columns: { isAdmin: true },
  });
  if (!row?.isAdmin) redirect("/explorar");
  return me;
}

/** A pessoa logada é administradora? (para mostrar atalhos) */
export async function isAdmin(userId: string) {
  const { db } = await import("@/db");
  const row = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, userId), columns: { isAdmin: true } });
  return Boolean(row?.isAdmin);
}
