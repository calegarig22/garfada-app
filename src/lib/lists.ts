// Listas (Salvos), "Quero ir", favoritos e o gráfico de notas do perfil.
import "server-only";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { collectionItems, collections, favorites, reviews } from "@/db/schema";
import { listRestaurantsByIds } from "@/lib/restaurants";

export const QUERO_IR = "quero_ir";

// Em consultas só com a tabela collections, o Drizzle escreve "id" sem o nome da tabela;
// dentro da subconsulta em collection_items isso viraria ci.id. Por isso o nome completo.
const COLLECTION_ID = sql.raw('"collections"."id"');

/** Listas de uma pessoa (as privadas só para a própria dona), com contagem e capa. */
export async function listCollections(ownerId: string, viewerId: string) {
  const rows = await db
    .select({
      id: collections.id,
      name: collections.name,
      description: collections.description,
      isPrivate: collections.isPrivate,
      kind: collections.kind,
      updatedAt: collections.updatedAt,
      count: sql<number>`(select count(*)::int from collection_items ci where ci.collection_id = ${COLLECTION_ID})`,
      // até 3 restaurantes mais recentes, para montar a capa em mosaico
      recentIds: sql<string[]>`coalesce((
        select array_agg(restaurant_id) from (
          select restaurant_id from collection_items ci
          where ci.collection_id = ${COLLECTION_ID} and restaurant_id is not null
          order by ci.created_at desc limit 3
        ) x
      ), '{}')`,
    })
    .from(collections)
    .where(
      and(
        eq(collections.ownerId, ownerId),
        ownerId === viewerId ? undefined : eq(collections.isPrivate, false),
      ),
    )
    .orderBy(sql`${collections.kind} = ${QUERO_IR} desc nulls last`, desc(collections.updatedAt));

  // Capas: busca todos os restaurantes das capas de uma vez
  const ids = [...new Set(rows.flatMap((r) => r.recentIds))];
  const restaurantes = new Map((await listRestaurantsByIds(ids)).map((r) => [r.id, r]));
  return rows.map(({ recentIds, ...r }) => ({
    ...r,
    covers: recentIds.map((id) => restaurantes.get(id)).filter((x) => x !== undefined),
  }));
}

export type CollectionSummary = Awaited<ReturnType<typeof listCollections>>[number];

/** Uma lista com os restaurantes dela (respeitando privacidade). */
export async function getCollection(id: string, viewerId: string) {
  const c = await db.query.collections.findFirst({ where: eq(collections.id, id) });
  if (!c || (c.isPrivate && c.ownerId !== viewerId)) return null;
  const items = await db
    .select({ restaurantId: collectionItems.restaurantId })
    .from(collectionItems)
    .where(eq(collectionItems.collectionId, id))
    .orderBy(desc(collectionItems.createdAt));
  const restaurantes = await listRestaurantsByIds(items.map((i) => i.restaurantId).filter((x) => x !== null));
  return { ...c, restaurantes };
}

/** Os 4 favoritos, na ordem escolhida. */
export async function listFavorites(userId: string) {
  const rows = await db
    .select({ restaurantId: favorites.restaurantId })
    .from(favorites)
    .where(eq(favorites.userId, userId))
    .orderBy(asc(favorites.position));
  return listRestaurantsByIds(rows.map((r) => r.restaurantId));
}

/** Quantas vezes a pessoa deu cada nota (1 a 10 meias estrelas). */
export async function ratingHistogram(userId: string) {
  const rows = await db
    .select({ rating: reviews.rating, n: sql<number>`count(*)::int` })
    .from(reviews)
    .where(eq(reviews.userId, userId))
    .groupBy(reviews.rating);
  const counts = Array.from({ length: 10 }, (_, i) => rows.find((r) => r.rating === i + 1)?.n ?? 0);
  return counts;
}

/** Na página do restaurante: estou com ele no "Quero ir"? É favorito? Em quais listas? */
export async function saveState(userId: string, restaurantId: string) {
  const [myLists, fav] = await Promise.all([
    db
      .select({
        id: collections.id,
        name: collections.name,
        kind: collections.kind,
        isPrivate: collections.isPrivate,
        has: sql<boolean>`exists(select 1 from collection_items ci where ci.collection_id = ${COLLECTION_ID} and ci.restaurant_id = ${restaurantId})`,
      })
      .from(collections)
      .where(eq(collections.ownerId, userId))
      .orderBy(sql`${collections.kind} = ${QUERO_IR} desc nulls last`, asc(collections.name)),
    db
      .select({ n: sql<number>`count(*)::int`, mine: sql<boolean>`bool_or(${favorites.restaurantId} = ${restaurantId})` })
      .from(favorites)
      .where(eq(favorites.userId, userId)),
  ]);
  return {
    queroIr: myLists.find((l) => l.kind === QUERO_IR)?.has ?? false,
    lists: myLists.filter((l) => l.kind !== QUERO_IR),
    isFavorite: Boolean(fav[0]?.mine),
    favoriteCount: fav[0]?.n ?? 0,
  };
}

/** Dono e tipo de uma lista (para conferir permissão nas ações). */
export async function collectionOwner(id: string) {
  const c = await db.query.collections.findFirst({ where: eq(collections.id, id), columns: { ownerId: true, kind: true } });
  return c ?? null;
}

