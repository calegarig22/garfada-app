"use server";
// Salvar restaurantes: "Quero ir", listas próprias e os 4 favoritos do perfil.
import { and, asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { collectionItems, collections, favorites, restaurants } from "@/db/schema";
import { collectionOwner, QUERO_IR } from "@/lib/lists";
import { requireUser } from "@/lib/session";

async function restaurantExists(id: string) {
  return Boolean(await db.query.restaurants.findFirst({ where: eq(restaurants.id, id), columns: { id: true } }));
}

function refresh(username: string, restaurantId?: string) {
  revalidatePath("/salvos");
  revalidatePath("/perfil");
  revalidatePath(`/u/${username}`);
  if (restaurantId) revalidatePath(`/restaurantes/${restaurantId}`);
}

/** Põe/tira um lugar de uma lista. Devolve se ficou salvo. */
async function toggleItem(collectionId: string, restaurantId: string): Promise<boolean> {
  const removed = await db
    .delete(collectionItems)
    .where(and(eq(collectionItems.collectionId, collectionId), eq(collectionItems.restaurantId, restaurantId)))
    .returning({ id: collectionItems.id });
  if (removed.length) return false;
  await db.insert(collectionItems).values({ collectionId, restaurantId }).onConflictDoNothing();
  await db.update(collections).set({ updatedAt: new Date() }).where(eq(collections.id, collectionId));
  return true;
}

/** "Quero ir": a lista automática de cada pessoa (criada na primeira vez). */
export async function alternarQueroIr(restaurantId: string): Promise<{ saved: boolean }> {
  const me = await requireUser();
  if (!(await restaurantExists(restaurantId))) return { saved: false };
  let lista = await db.query.collections.findFirst({
    where: and(eq(collections.ownerId, me.id), eq(collections.kind, QUERO_IR)),
    columns: { id: true },
  });
  if (!lista) {
    [lista] = await db
      .insert(collections)
      .values({ ownerId: me.id, name: "Quero ir", kind: QUERO_IR, isPrivate: false })
      .onConflictDoNothing()
      .returning({ id: collections.id });
    lista ??= await db.query.collections.findFirst({
      where: and(eq(collections.ownerId, me.id), eq(collections.kind, QUERO_IR)),
      columns: { id: true },
    });
  }
  const saved = await toggleItem(lista!.id, restaurantId);
  refresh(me.username, restaurantId);
  return { saved };
}

/** Põe/tira um lugar de uma lista minha. */
export async function alternarNaLista(collectionId: string, restaurantId: string): Promise<{ saved: boolean }> {
  const me = await requireUser();
  const owner = await collectionOwner(collectionId);
  if (owner?.ownerId !== me.id || !(await restaurantExists(restaurantId))) return { saved: false };
  const saved = await toggleItem(collectionId, restaurantId);
  refresh(me.username, restaurantId);
  return { saved };
}

export type NovaListaState = { error?: string; created?: { id: string; name: string } };

const listaSchema = z.object({
  name: z.string().trim().min(1, "Dê um nome para a lista.").max(60, "Nome com no máximo 60 caracteres."),
  description: z.string().trim().max(300).optional(),
  isPrivate: z.boolean(),
});

/** Cria uma lista (e já salva o lugar nela, se veio de uma página de restaurante). */
export async function criarLista(_prev: NovaListaState, fd: FormData): Promise<NovaListaState> {
  const me = await requireUser();
  const parsed = listaSchema.safeParse({
    name: String(fd.get("name") ?? ""),
    description: String(fd.get("description") ?? "") || undefined,
    isPrivate: fd.get("isPrivate") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const [c] = await db
    .insert(collections)
    .values({ ownerId: me.id, ...parsed.data })
    .returning({ id: collections.id, name: collections.name });
  const restaurantId = String(fd.get("restaurantId") ?? "");
  if (restaurantId && (await restaurantExists(restaurantId))) await toggleItem(c.id, restaurantId);
  refresh(me.username, restaurantId || undefined);
  return { created: c };
}

/** Apaga uma lista minha (o "Quero ir" não pode ser apagado, só esvaziado). */
export async function apagarLista(collectionId: string) {
  const me = await requireUser();
  const owner = await collectionOwner(collectionId);
  if (owner?.ownerId !== me.id || owner.kind === QUERO_IR) return;
  await db.delete(collections).where(eq(collections.id, collectionId));
  refresh(me.username);
  redirect("/salvos");
}

/** Liga/desliga privacidade de uma lista minha. */
export async function alternarPrivacidade(collectionId: string) {
  const me = await requireUser();
  const owner = await collectionOwner(collectionId);
  if (owner?.ownerId !== me.id) return;
  await db
    .update(collections)
    .set({ isPrivate: sql`not ${collections.isPrivate}` })
    .where(eq(collections.id, collectionId));
  refresh(me.username);
  revalidatePath(`/listas/${collectionId}`);
}

/** Favoritos do perfil: no máximo 4. */
export async function alternarFavorito(
  restaurantId: string,
): Promise<{ isFavorite: boolean; error?: string }> {
  const me = await requireUser();
  if (!(await restaurantExists(restaurantId))) return { isFavorite: false };
  const removed = await db
    .delete(favorites)
    .where(and(eq(favorites.userId, me.id), eq(favorites.restaurantId, restaurantId)))
    .returning({ p: favorites.position });
  if (removed.length) {
    refresh(me.username, restaurantId);
    return { isFavorite: false };
  }
  const used = (
    await db.select({ p: favorites.position }).from(favorites).where(eq(favorites.userId, me.id)).orderBy(asc(favorites.position))
  ).map((r) => r.p);
  const free = [1, 2, 3, 4].find((p) => !used.includes(p));
  if (!free) return { isFavorite: false, error: "Você já tem 4 favoritos. Tire um no seu perfil para pôr este." };
  await db.insert(favorites).values({ userId: me.id, restaurantId, position: free }).onConflictDoNothing();
  refresh(me.username, restaurantId);
  return { isFavorite: true };
}
