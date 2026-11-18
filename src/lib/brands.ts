// Redes com mais de uma unidade: lista de unidades e a "nota da rede".
import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { brands, restaurants } from "@/db/schema";

/** Unidades de uma marca, com a nota de cada uma. */
export function listUnits(brandId: string) {
  return db
    .select({
      id: restaurants.id,
      neighborhood: restaurants.neighborhood,
      address: restaurants.address,
      ratingAvg: restaurants.ratingAvg,
      ratingCount: restaurants.ratingCount,
      latitude: restaurants.latitude,
      longitude: restaurants.longitude,
    })
    .from(restaurants)
    .where(eq(restaurants.brandId, brandId))
    .orderBy(asc(restaurants.neighborhood));
}

export type Unit = Awaited<ReturnType<typeof listUnits>>[number];

/** Nota da rede = média de TODAS as avaliações de todas as unidades. */
export async function brandSummary(brandId: string) {
  const [b] = await db
    .select({
      name: brands.name,
      ratingSum: sql<number>`coalesce(sum(${restaurants.ratingSum}), 0)::int`,
      ratingCount: sql<number>`coalesce(sum(${restaurants.ratingCount}), 0)::int`,
      units: sql<number>`count(${restaurants.id})::int`,
    })
    .from(brands)
    .leftJoin(restaurants, eq(restaurants.brandId, brands.id))
    .where(eq(brands.id, brandId))
    .groupBy(brands.id, brands.name);
  if (!b) return null;
  return { ...b, ratingAvg: b.ratingCount ? b.ratingSum / b.ratingCount / 2 : null };
}
