"use server";
// Ações de restaurantes: cadastrar, avaliar e apagar a própria avaliação.
import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { brands, cuisines, restaurantPhotos, restaurants, reviewPhotos, reviews } from "@/db/schema";
import { redeGrande } from "@/lib/chains";
import { geocode } from "@/lib/geocode";
import { searchPlaces, type GooglePlace } from "@/lib/google-places";
import { findDuplicate, findSimilar } from "@/lib/restaurants";
import { requireUser } from "@/lib/session";
import { deletePhotos, uploadPhotosFromForm } from "@/lib/storage";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

// ── Cadastrar restaurante ──────────────────────────────────────

export type NovoLugarState = {
  error?: string;
  values?: Record<string, string>;
  similares?: { id: string; name: string; neighborhood: string | null; address: string | null }[];
};

const lugarSchema = z.object({
  name: z.string().min(2, "Informe o nome do lugar.").max(80, "Nome longo demais."),
  city: z.string().min(2, "Informe a cidade.").max(60),
  neighborhood: z.string().max(60).optional(),
  address: z.string().max(120).optional(),
  cuisineId: z.string().min(1, "Escolha o tipo de comida."),
  priceLevel: z.coerce.number().int().min(1, "Escolha a faixa de preço.").max(4),
});

export async function criarRestaurante(_prev: NovoLugarState, fd: FormData): Promise<NovoLugarState> {
  const user = await requireUser();
  const values = Object.fromEntries(
    ["name", "city", "neighborhood", "address", "cuisineId", "priceLevel"].map((k) => [k, str(fd, k)]),
  );
  const parsed = lugarSchema.safeParse({
    ...values,
    neighborhood: values.neighborhood || undefined,
    address: values.address || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message, values };
  const data = parsed.data;

  const cuisine = await db.query.cuisines.findFirst({ where: eq(cuisines.id, data.cuisineId), columns: { id: true } });
  if (!cuisine) return { error: "Escolha o tipo de comida.", values };

  // Redes muito grandes não entram no Garfada.
  if (redeGrande(data.name)) {
    return { error: "Redes grandes (com muitas lojas iguais) não entram no Garfada — aqui é para descobrir lugares.", values };
  }

  // MESMO lugar que já existe? Não cria outro: leva direto para avaliar o que já está no app.
  const googlePlaceId = /^[A-Za-z0-9_-]{10,300}$/.test(str(fd, "googlePlaceId")) ? str(fd, "googlePlaceId") : null;
  const duplicado = await findDuplicate({ ...data, googlePlaceId });
  if (duplicado) redirect(`/restaurantes/${duplicado.id}/avaliar?ja=1`);

  // "Cadastrar outra unidade" de um lugar que já existe (vem da página dele)
  const unidadeDe = str(fd, "unidadeDe")
    ? await db.query.restaurants.findFirst({ where: eq(restaurants.id, str(fd, "unidadeDe")), columns: { id: true, name: true } })
    : null;

  // Já existe parecido nesta cidade? Mostra e pede confirmação antes de criar outro.
  let mesmaMarca: string | null = unidadeDe?.id ?? null;
  if (!unidadeDe) {
    const similares = await findSimilar(data.name, data.city);
    if (str(fd, "confirmaNovo") !== "1" && similares.length) return { similares, values };
    // Confirmou "é outra unidade": se algum parecido tem exatamente o mesmo nome, vira a mesma rede.
    mesmaMarca = (await sameNameAs(data.name, similares.map((x) => x.id))) ?? null;
  }

  let photos;
  try {
    photos = await uploadPhotosFromForm(fd, "restaurantes");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não deu para enviar as fotos.", values };
  }

  // Coordenadas pelo OpenStreetMap (para mostrar a fachada no Street View). Se falhar, segue sem.
  const coords = data.address ? await geocode(data.address, data.city) : null;

  const brandId = mesmaMarca ? await ensureBrand(mesmaMarca) : null;

  const [created] = await db
    .insert(restaurants)
    .values({
      ...data,
      brandId,
      googlePlaceId,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      createdById: user.id,
    })
    .returning({ id: restaurants.id });
  if (photos.length) {
    await db.insert(restaurantPhotos).values(
      photos.map((p) => ({ ...p, restaurantId: created.id, uploadedById: user.id })),
    );
  }
  revalidatePath("/explorar");
  redirect(`/restaurantes/${created.id}`);
}

/** Entre os ids, algum tem exatamente o mesmo nome (sem acento/maiúsculas)? */
async function sameNameAs(name: string, ids: string[]) {
  if (!ids.length) return null;
  const [r] = await db
    .select({ id: restaurants.id })
    .from(restaurants)
    .where(and(inArray(restaurants.id, ids), sql`garfada_norm(${restaurants.name}) = garfada_norm(${name})`))
    .limit(1);
  return r?.id ?? null;
}

/** Garante que o lugar tem uma marca (cria se não tiver) e devolve o id da marca. */
async function ensureBrand(restaurantId: string) {
  const r = await db.query.restaurants.findFirst({
    where: eq(restaurants.id, restaurantId),
    columns: { brandId: true, name: true },
  });
  if (!r) return null;
  if (r.brandId) return r.brandId;
  const [b] = await db.insert(brands).values({ name: r.name }).returning({ id: brands.id });
  await db.update(restaurants).set({ brandId: b.id }).where(eq(restaurants.id, restaurantId));
  return b.id;
}

// ── Sugestões enquanto a pessoa digita o nome ─────────────────

export async function sugerirParecidos(
  name: string,
  city: string,
): Promise<{ id: string; name: string; neighborhood: string | null; address: string | null }[]> {
  await requireUser();
  return findSimilar(name.slice(0, 80), city.slice(0, 60));
}

// ── Buscar no Google (para preencher o cadastro) ────────────────

export async function buscarNoGoogle(texto: string): Promise<{ error?: string; places?: GooglePlace[] }> {
  await requireUser();
  const q = texto.trim().slice(0, 100);
  if (q.length < 3) return { error: "Digite pelo menos 3 letras." };
  const places = await searchPlaces(q);
  return places.length ? { places } : { error: "Nada encontrado no Google. Tente nome e bairro, ou preencha à mão." };
}

// ── Mandar fotos do lugar (sem precisar avaliar) ──────────────

export type FotosState = { error?: string; enviadas?: number };

export async function enviarFotosLugar(restaurantId: string, _prev: FotosState, fd: FormData): Promise<FotosState> {
  const me = await requireUser();
  const existe = await db.query.restaurants.findFirst({ where: eq(restaurants.id, restaurantId), columns: { id: true } });
  if (!existe) return { error: "Este lugar não existe mais." };
  let photos;
  try {
    photos = await uploadPhotosFromForm(fd, "restaurantes");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não deu para enviar as fotos." };
  }
  if (!photos.length) return { error: "Escolha pelo menos uma foto." };
  await db.insert(restaurantPhotos).values(photos.map((p) => ({ ...p, restaurantId, uploadedById: me.id })));
  revalidatePath(`/restaurantes/${restaurantId}`);
  revalidatePath("/explorar");
  return { enviadas: photos.length };
}

// ── Avaliar ────────────────────────────────────────────────────

export type AvaliarState = { error?: string };

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Escolha uma nota.").max(10),
  visitedOn: z.iso.date("Data inválida."),
  body: z.string().max(2000, "O comentário passou de 2000 caracteres.").optional(),
});

export async function avaliar(restaurantId: string, _prev: AvaliarState, fd: FormData): Promise<AvaliarState> {
  const user = await requireUser();
  const exists = await db.query.restaurants.findFirst({ where: eq(restaurants.id, restaurantId), columns: { id: true } });
  if (!exists) return { error: "Este lugar não existe mais." };

  const fail = (error: string): AvaliarState => ({ error });
  const parsed = reviewSchema.safeParse({
    rating: str(fd, "rating") || 0,
    visitedOn: str(fd, "visitedOn"),
    body: str(fd, "body") || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const today = new Date().toISOString().slice(0, 10);
  if (parsed.data.visitedOn > today) return fail("A data da visita não pode ser no futuro.");

  let photos;
  try {
    photos = await uploadPhotosFromForm(fd, `reviews/${restaurantId}`);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Não deu para enviar as fotos.");
  }

  const [review] = await db
    .insert(reviews)
    .values({ ...parsed.data, userId: user.id, restaurantId })
    .returning({ id: reviews.id });
  if (photos.length) {
    await db.insert(reviewPhotos).values(photos.map((p, position) => ({ ...p, position, reviewId: review.id })));
  }
  revalidatePath(`/restaurantes/${restaurantId}`);
  revalidatePath("/explorar");
  redirect(`/restaurantes/${restaurantId}#avaliacoes`);
}

// ── Editar a própria avaliação ─────────────────────────────────

export async function editarReview(reviewId: string, _prev: AvaliarState, fd: FormData): Promise<AvaliarState> {
  const user = await requireUser();
  const review = await db.query.reviews.findFirst({
    where: and(eq(reviews.id, reviewId), eq(reviews.userId, user.id)),
    columns: { id: true, restaurantId: true },
  });
  // Só quem escreveu pode editar.
  if (!review) return { error: "Esta avaliação não existe ou não é sua." };

  const parsed = reviewSchema.safeParse({
    rating: str(fd, "rating") || 0,
    visitedOn: str(fd, "visitedOn"),
    body: str(fd, "body") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const today = new Date().toISOString().slice(0, 10);
  if (parsed.data.visitedOn > today) return { error: "A data da visita não pode ser no futuro." };

  // Fotos: as que a pessoa manteve + as novas (no máximo 4 no total).
  const atuais = await db
    .select({ id: reviewPhotos.id, key: reviewPhotos.storageKey })
    .from(reviewPhotos)
    .where(eq(reviewPhotos.reviewId, reviewId))
    .orderBy(reviewPhotos.position);
  const manter = new Set(fd.getAll("keepPhoto").map(String));
  const ficam = atuais.filter((p) => manter.has(p.id));
  const saem = atuais.filter((p) => !manter.has(p.id));
  const novasQtd = fd.getAll("photos").filter((f) => f instanceof File && f.size > 0).length;
  if (ficam.length + novasQtd > 4) return { error: "No máximo 4 fotos por avaliação." };

  let novas;
  try {
    novas = await uploadPhotosFromForm(fd, `reviews/${review.restaurantId}`);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não deu para enviar as fotos." };
  }

  await db
    .update(reviews)
    .set({ ...parsed.data, body: parsed.data.body ?? null, editedAt: new Date() })
    .where(eq(reviews.id, reviewId));
  if (saem.length) {
    await db.delete(reviewPhotos).where(inArray(reviewPhotos.id, saem.map((p) => p.id)));
    await deletePhotos(saem.map((p) => p.key));
  }
  if (novas.length) {
    await db
      .insert(reviewPhotos)
      .values(novas.map((p, i) => ({ ...p, position: ficam.length + i, reviewId })));
  }
  revalidatePath(`/restaurantes/${review.restaurantId}`);
  revalidatePath(`/avaliacoes/${reviewId}`);
  revalidatePath("/explorar");
  redirect(`/avaliacoes/${reviewId}`);
}

// ── Apagar a própria avaliação ─────────────────────────────────

export async function apagarReview(reviewId: string) {
  const user = await requireUser();
  const photos = await db
    .select({ key: reviewPhotos.storageKey })
    .from(reviewPhotos)
    .innerJoin(reviews, eq(reviews.id, reviewPhotos.reviewId))
    .where(and(eq(reviews.id, reviewId), eq(reviews.userId, user.id)));
  // Só apaga se a review for de quem pediu.
  const [deleted] = await db
    .delete(reviews)
    .where(and(eq(reviews.id, reviewId), eq(reviews.userId, user.id)))
    .returning({ restaurantId: reviews.restaurantId });
  if (!deleted) return;
  await deletePhotos(photos.map((p) => p.key));
  revalidatePath(`/restaurantes/${deleted.restaurantId}`);
  revalidatePath("/explorar");
  redirect(`/restaurantes/${deleted.restaurantId}#avaliacoes`);
}
