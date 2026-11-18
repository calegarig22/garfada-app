// Consultas de restaurantes e reviews ("camada de acesso" aos dados).
import "server-only";
import { and, asc, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { cuisines, restaurants } from "@/db/schema";
import { getPlacePhoto } from "@/lib/google-places";
import { withUrls } from "@/lib/storage";

/**
 * Foto: enviada ao app (`key` no armazenamento) ou externa de uso livre
 * (`external` + crédito obrigatório, ex.: Wikimedia Commons).
 */
export type Photo = {
  key: string | null;
  width: number;
  height: number;
  external?: string | null;
  credit?: string | null;
  creditUrl?: string | null;
  /** @ de quem mandou (fotos enviadas pelo app) */
  by?: string | null;
  /** avaliação de onde a foto veio (para o link "ver avaliação") */
  reviewId?: string | null;
};
export type PhotoWithUrl = Photo & { url: string };

/** Foto mais recente do lugar (enviada no cadastro ou numa review). */
const coverPhoto = sql<Photo | null>`(
  select json_build_object('key', p.storage_key, 'width', p.width, 'height', p.height,
                          'external', p.external_url, 'credit', p.attribution, 'creditUrl', p.attribution_url)
  from (
    select storage_key, width, height, external_url, attribution, attribution_url, created_at
      from restaurant_photos where restaurant_id = ${restaurants.id}
    union all
    select rp.storage_key, rp.width, rp.height, null, null, null, r.created_at
      from review_photos rp join reviews r on r.id = rp.review_id
     where r.restaurant_id = ${restaurants.id}
  ) p order by p.created_at desc limit 1
)`;

/** Foto ilustrativa do tipo de comida (ex.: pizza para pizzaria), se houver. */
const cuisinePhoto = sql<Photo | null>`(
  case when ${cuisines.photoUrl} is null then null else json_build_object(
    'key', null, 'width', ${cuisines.photoWidth}, 'height', ${cuisines.photoHeight},
    'external', ${cuisines.photoUrl}, 'credit', ${cuisines.photoCredit}, 'creditUrl', ${cuisines.photoCreditUrl}
  ) end
)`;

export const ORDENS = { nota: "Melhor nota", recentes: "Mais recentes", nome: "Nome" } as const;
export type Ordem = keyof typeof ORDENS;

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

/** Consulta base de restaurantes "em cartão" (com a capa já resolvida). */
async function queryRestaurants(where: SQL | undefined, orderBy: SQL[], limit: number) {
  const rows = await db
    .select({
      id: restaurants.id,
      name: restaurants.name,
      neighborhood: restaurants.neighborhood,
      city: restaurants.city,
      priceLevel: restaurants.priceLevel,
      ratingAvg: restaurants.ratingAvg,
      ratingCount: restaurants.ratingCount,
      cuisine: cuisines.name,
      cuisineSlug: cuisines.slug,
      brandId: restaurants.brandId,
      // quantas OUTRAS unidades a mesma marca tem
      otherUnits: sql<number>`(select count(*)::int from restaurants u
        where u.brand_id = ${restaurants.brandId} and u.id <> ${restaurants.id})`,
      latitude: restaurants.latitude,
      longitude: restaurants.longitude,
      createdAt: restaurants.createdAt,
      googlePlaceId: restaurants.googlePlaceId,
      cover: coverPhoto,
      cuisinePhoto: cuisinePhoto,
    })
    .from(restaurants)
    .leftJoin(cuisines, eq(cuisines.id, restaurants.cuisineId))
    .where(where)
    .orderBy(...orderBy)
    .limit(limit);
  // Capa, nesta ordem: foto própria (de quem avaliou/cadastrou ou Wikimedia do lugar) →
  // foto ilustrativa do prato típico → foto do Google (só se a chave existir) → placa colorida.
  return Promise.all(
    rows.map(async ({ googlePlaceId, cuisinePhoto, ...r }) => {
      const own = r.cover ? ((await withUrls([r.cover]))[0] ?? null) : null;
      if (own) return { ...r, cover: own };
      if (cuisinePhoto) return { ...r, cover: { ...cuisinePhoto, url: cuisinePhoto.external! } };
      const g = googlePlaceId ? await getPlacePhoto(googlePlaceId) : null;
      return { ...r, cover: g ? { ...g, key: null } : null };
    }),
  );
}

export async function listRestaurants({ q, tipo, ordem }: { q?: string; tipo?: string; ordem?: Ordem }) {
  const filters: SQL[] = [];
  if (q) {
    const like = `%${escapeLike(q)}%`;
    filters.push(or(ilike(restaurants.name, like), ilike(restaurants.neighborhood, like))!);
  }
  if (tipo) filters.push(eq(cuisines.slug, tipo));

  const orderBy =
    ordem === "recentes"
      ? [desc(restaurants.createdAt)]
      : ordem === "nome"
        ? [asc(restaurants.name)]
        : [sql`${restaurants.ratingAvg} desc nulls last`, desc(restaurants.ratingCount), asc(restaurants.name)];

  return queryRestaurants(filters.length ? and(...filters) : undefined, orderBy, 300);
}

/** Vários restaurantes pelo id, na mesma ordem dos ids pedidos. */
export async function listRestaurantsByIds(ids: string[]) {
  if (!ids.length) return [];
  const rows = await queryRestaurants(inArray(restaurants.id, ids), [asc(restaurants.name)], ids.length);
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids.map((id) => byId.get(id)).filter((r) => r !== undefined);
}

export type RestaurantListItem = Awaited<ReturnType<typeof listRestaurants>>[number];

export async function getRestaurant(id: string) {
  const [row] = await db
    .select({
      id: restaurants.id,
      name: restaurants.name,
      address: restaurants.address,
      neighborhood: restaurants.neighborhood,
      city: restaurants.city,
      priceLevel: restaurants.priceLevel,
      ratingAvg: restaurants.ratingAvg,
      ratingCount: restaurants.ratingCount,
      cuisine: cuisines.name,
      cuisineId: restaurants.cuisineId,
      brandId: restaurants.brandId,
      latitude: restaurants.latitude,
      longitude: restaurants.longitude,
      googlePlaceId: restaurants.googlePlaceId,
      cuisinePhoto: cuisinePhoto,
      // TODAS as fotos do lugar (nenhuma some quando chega uma nova), da mais nova para a mais antiga,
      // com quem mandou: fotos do cadastro e fotos das avaliações.
      photos: sql<Photo[]>`coalesce((
        select json_agg(json_build_object('key', p.storage_key, 'width', p.width, 'height', p.height,
                          'external', p.external_url, 'credit', p.attribution, 'creditUrl', p.attribution_url,
                          'by', p.username, 'reviewId', p.review_id)
                        order by p.created_at desc)
        from (
          select rp.storage_key, rp.width, rp.height, rp.external_url, rp.attribution, rp.attribution_url,
                 rp.created_at, u.username, null::text as review_id
            from restaurant_photos rp left join users u on u.id = rp.uploaded_by_id
           where rp.restaurant_id = ${restaurants.id}
          union all
          select vp.storage_key, vp.width, vp.height, null, null, null, r.created_at, u.username, r.id
            from review_photos vp join reviews r on r.id = vp.review_id join users u on u.id = r.user_id
           where r.restaurant_id = ${restaurants.id}
        ) p
      ), '[]'::json)`,
    })
    .from(restaurants)
    .leftJoin(cuisines, eq(cuisines.id, restaurants.cuisineId))
    .where(eq(restaurants.id, id));
  if (!row) return null;
  return { ...row, photos: await withUrls(row.photos) };
}

// ── Lugares repetidos ─────────────────────────────────────────
// garfada_norm (função no banco): minúsculas, sem acento, sem "Restaurante/Bar/…" no começo.
const NORM_NAME = sql`garfada_norm(${restaurants.name})`;
const sameCity = (city: string) => sql`garfada_norm(${restaurants.city}) = garfada_norm(${city})`;

/** Lugares com nome parecido na mesma cidade (sugestões enquanto a pessoa digita). */
export async function findSimilar(name: string, city: string) {
  if (name.trim().length < 2) return [];
  return db
    .select({
      id: restaurants.id,
      name: restaurants.name,
      neighborhood: restaurants.neighborhood,
      address: restaurants.address,
    })
    .from(restaurants)
    .where(
      and(
        city ? sameCity(city) : undefined,
        or(
          sql`similarity(${NORM_NAME}, garfada_norm(${name})) > 0.3`,
          sql`${NORM_NAME} like garfada_norm(${name}) || '%'`,
        ),
      ),
    )
    .orderBy(sql`similarity(${NORM_NAME}, garfada_norm(${name})) desc`)
    .limit(5);
}

/** "R. Augusto Tolle, 610" → "augusto tolle 610" (para comparar endereços). */
function normAddress(a: string | null | undefined) {
  if (!a) return "";
  return a
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/\b(r|rua|av|avenida|al|alameda|pca|praca|tv|travessa|estr|estrada)\b\.?/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
const normPlain = (t: string | null | undefined) =>
  (t ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/**
 * É o MESMO lugar que já existe? (então não cria outro: leva direto para avaliar)
 * - mesmo código do Google; ou
 * - mesmo nome (sem acento/maiúsculas/"Restaurante"…) na mesma cidade E
 *   (mesmo endereço, ou mesmo bairro, ou um dos dois sem endereço/bairro); ou
 * - mesmo endereço com nome bem parecido.
 * Mesmo nome em bairro/endereço diferente pode ser outra unidade → não conta aqui.
 */
export async function findDuplicate(input: {
  name: string;
  city: string;
  address?: string | null;
  neighborhood?: string | null;
  googlePlaceId?: string | null;
}) {
  if (input.googlePlaceId) {
    const [g] = await db
      .select({ id: restaurants.id, name: restaurants.name })
      .from(restaurants)
      .where(eq(restaurants.googlePlaceId, input.googlePlaceId));
    if (g) return g;
  }
  const candidatos = await db
    .select({
      id: restaurants.id,
      name: restaurants.name,
      address: restaurants.address,
      neighborhood: restaurants.neighborhood,
      sameName: sql<boolean>`${NORM_NAME} = garfada_norm(${input.name})`,
      sim: sql<number>`similarity(${NORM_NAME}, garfada_norm(${input.name}))`,
    })
    .from(restaurants)
    .where(and(sameCity(input.city), sql`similarity(${NORM_NAME}, garfada_norm(${input.name})) > 0.5`));

  const addr = normAddress(input.address);
  const bairro = normPlain(input.neighborhood);
  for (const c of candidatos.sort((a, b) => b.sim - a.sim)) {
    const cAddr = normAddress(c.address);
    const cBairro = normPlain(c.neighborhood);
    const mesmoEndereco = addr && cAddr && addr === cAddr;
    const mesmoBairro = bairro && cBairro && bairro === cBairro;
    const semLocal = (!addr && !bairro) || (!cAddr && !cBairro);
    if (c.sameName && (mesmoEndereco || mesmoBairro || semLocal)) return { id: c.id, name: c.name };
    if (mesmoEndereco && c.sim > 0.6) return { id: c.id, name: c.name };
  }
  return null;
}

export function listCuisines() {
  return db.select({ id: cuisines.id, name: cuisines.name, slug: cuisines.slug }).from(cuisines).orderBy(asc(cuisines.name));
}

/** Só os tipos de comida que já têm algum lugar cadastrado (para os filtros). */
export function listUsedCuisines() {
  return db
    .selectDistinct({ name: cuisines.name, slug: cuisines.slug })
    .from(cuisines)
    .innerJoin(restaurants, eq(restaurants.cuisineId, cuisines.id))
    .orderBy(asc(cuisines.name));
}

export { priceLabel } from "@/lib/format";
