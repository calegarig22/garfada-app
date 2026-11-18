import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { restaurants, reviewPhotos, reviews } from "@/db/schema";
import { BackHeader } from "@/components/back-header";
import { requireUser } from "@/lib/session";
import { photosEnabled, photoUrl } from "@/lib/storage";
import { EditReviewForm } from "./edit-form";

export const metadata = { title: "Editar avaliação" };

export default async function EditarAvaliacaoPage({ params }: PageProps<"/avaliacoes/[id]/editar">) {
  const { id } = await params;
  const me = await requireUser();
  // Só quem escreveu chega aqui; para os outros a página "não existe".
  const [r] = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      body: reviews.body,
      visitedOn: reviews.visitedOn,
      restaurantName: restaurants.name,
      neighborhood: restaurants.neighborhood,
    })
    .from(reviews)
    .innerJoin(restaurants, eq(restaurants.id, reviews.restaurantId))
    .where(and(eq(reviews.id, id), eq(reviews.userId, me.id)));
  if (!r) notFound();
  const fotos = await db
    .select({ id: reviewPhotos.id, key: reviewPhotos.storageKey })
    .from(reviewPhotos)
    .where(eq(reviewPhotos.reviewId, id))
    .orderBy(reviewPhotos.position);
  const photos = await Promise.all(fotos.map(async (f) => ({ id: f.id, url: await photoUrl(f.key) })));

  return (
    <>
      <BackHeader href={`/avaliacoes/${r.id}`} title={`Editar · ${r.restaurantName}`} />
      <div className="px-4 pt-5 lg:max-w-xl">
        <EditReviewForm
          reviewId={r.id}
          rating={r.rating}
          visitedOn={r.visitedOn}
          body={r.body ?? ""}
          photos={photos}
          photosEnabled={photosEnabled}
        />
      </div>
    </>
  );
}
