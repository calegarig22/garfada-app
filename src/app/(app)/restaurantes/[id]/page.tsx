import Link from "next/link";
import { notFound } from "next/navigation";
import { Images, Star } from "lucide-react";
import { BackHeader } from "@/components/back-header";
import { PhotoCarousel, type CarouselPhoto } from "@/components/photo-carousel";
import { PlaceMap } from "@/components/place-map";
import { SaveControls } from "@/components/save-controls";
import { UnitsBar } from "@/components/units-bar";
import { PinReport } from "@/components/pin-report";
import { SendPhotos } from "@/components/send-photos";
import { photosEnabled } from "@/lib/storage";
import { brandSummary, listUnits } from "@/lib/brands";
import { saveState } from "@/lib/lists";
import { NotaPlaquinha } from "@/components/plaquinha";
import { Cover } from "@/components/restaurant-card";
import { primaryButtonClass } from "@/components/form";
import { getPlacePhoto } from "@/lib/google-places";
import { getRestaurant, priceLabel } from "@/lib/restaurants";
import { listRestaurantReviews } from "@/lib/social";
import { ReviewPost } from "@/components/review-post";
import { isAdmin, requireUser } from "@/lib/session";

export async function generateMetadata({ params }: PageProps<"/restaurantes/[id]">) {
  const r = await getRestaurant((await params).id);
  return { title: r?.name ?? "Lugar" };
}

export default async function RestaurantePage({ params }: PageProps<"/restaurantes/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const [r, avaliacoes, salvo] = await Promise.all([
    getRestaurant(id),
    listRestaurantReviews(user.id, id),
    saveState(user.id, id),
  ]);
  if (!r) notFound();
  const souAdmin = await isAdmin(user.id);
  // Rede com várias unidades? (nota da rede + escolha da unidade)
  const [units, rede] = r.brandId ? await Promise.all([listUnits(r.brandId), brandSummary(r.brandId)]) : [[], null];
  const isRede = rede != null && units.length > 1;

  const price = priceLabel(r.priceLevel);
  // Carrossel: TODAS as fotos (a mais nova primeiro; nenhuma some quando chega outra).
  // Depois delas, a foto do Google (se a chave existir) e, por último, a ilustrativa do tipo de comida.
  const googlePhoto = r.googlePlaceId ? await getPlacePhoto(r.googlePlaceId) : null;
  const photos: CarouselPhoto[] = [
    ...r.photos,
    ...(googlePhoto ? [googlePhoto] : []),
    ...(r.cuisinePhoto
      ? [{ ...r.cuisinePhoto, url: r.cuisinePhoto.external!, illustrative: true }]
      : []),
  ];

  return (
    <>
      <BackHeader href="/explorar" title={isRede && r.neighborhood ? `${r.name} · ${r.neighborhood}` : r.name} />

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10 lg:px-4 lg:pt-6">
        {/* Coluna principal */}
        <div>
          {/* Fotos: carrossel; sem nenhuma foto, a placa colorida */}
          {photos.length ? (
            <PhotoCarousel photos={photos} name={r.name} />
          ) : (
            <Cover photo={null} label={r.cuisine ?? "Restaurante"} id={r.id} sizes="hero" className="lg:rounded-card" />
          )}

          {/* Mandar foto (sem precisar avaliar) */}
          {photosEnabled ? (
            <div className="px-4 lg:px-0">
              <SendPhotos
                restaurantId={r.id}
                semFotoReal={!r.photos.some((p) => p.by || (p.credit && !p.credit.startsWith("Foto ilustrativa")))}
              />
            </div>
          ) : null}

          {/* Fotos do Google: abrimos a página do lugar no Google Maps (grátis, sem chave).
              Mostrar as fotos do Google dentro do app exigiria a API paga. */}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              [r.name, r.address, r.neighborhood, r.city].filter(Boolean).join(", "),
            )}${r.googlePlaceId ? `&query_place_id=${encodeURIComponent(r.googlePlaceId)}` : ""}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mx-4 mt-3 flex min-h-11 items-center gap-2 text-sm font-semibold underline decoration-primary decoration-2 underline-offset-4 hover:text-primary lg:mx-0"
          >
            <Images aria-hidden size={18} />
            Ver mais fotos deste lugar no Google Maps
          </a>

          <section className="relative px-4 pt-5 lg:px-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-wide text-text-muted">
                  {[r.cuisine, price].filter(Boolean).join(" · ")}
                </p>
                <h2 className="letreiro mt-1 text-[clamp(2.75rem,10vw,4rem)]">{r.name}</h2>
                {isRede ? (
                  <p className="mt-1 font-semibold">
                    Unidade {r.neighborhood ?? ""}
                  </p>
                ) : null}
              </div>
              {r.ratingCount > 0 && r.ratingAvg != null ? (
                <NotaPlaquinha nota={r.ratingAvg * 2} className="mt-2 shrink-0 text-3xl" />
              ) : null}
            </div>
            <p className="mt-2 text-sm text-text-muted">
              {isRede ? "Nesta unidade: " : ""}
              {r.ratingCount === 0
                ? "Ninguém avaliou ainda."
                : r.ratingCount === 1
                  ? "1 avaliação"
                  : `${r.ratingCount} avaliações`}
            </p>

            {isRede && rede ? (
              <UnitsBar
                currentId={r.id}
                brandName={rede.name}
                units={units}
                brandAvg={rede.ratingAvg}
                brandCount={rede.ratingCount}
              />
            ) : null}

            <SaveControls
              restaurantId={r.id}
              queroIr={salvo.queroIr}
              isFavorite={salvo.isFavorite}
              lists={salvo.lists}
            />

            {/* Celular: mapa logo abaixo do nome (no computador ele fica na coluna da direita) */}
            <div className="mt-5 lg:hidden">
              <PlaceMap name={r.name} address={r.address} neighborhood={r.neighborhood} city={r.city} placeId={r.googlePlaceId} />
              <PinReport restaurantId={r.id} admin={souAdmin} />
            </div>

            <Link href={`/restaurantes/${r.id}/avaliar`} className={`mt-6 lg:hidden ${primaryButtonClass}`}>
              Avaliar este lugar
            </Link>
          </section>

          {/* Avaliações */}
          <section id="avaliacoes" className="mt-10 px-4 pb-8 lg:px-0" aria-labelledby="titulo-avaliacoes">
            <h3 id="titulo-avaliacoes" className="letreiro border-b-2 border-text pb-2 text-[2rem]">
              Avaliações
            </h3>
            {avaliacoes.length === 0 ? (
              <p className="py-6 text-text-muted">Seja a primeira pessoa a dar nota para este lugar.</p>
            ) : (
              <div>
                {avaliacoes.map((a) => (
                  <ReviewPost key={a.id} r={a} showRestaurant={false} canDelete={a.userId === user.id} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Coluna lateral (só no computador): chamada para avaliar, sempre visível */}
        <aside className="hidden lg:block">
          <div className="sticky top-28 flex flex-col gap-5">
            <div className="rounded-card border-2 border-text bg-surface p-5">
              <Star aria-hidden size={28} className="text-star" />
              <p className="letreiro mt-3 text-[1.75rem]">Já foi lá?</p>
              <p className="mt-2 text-sm text-text-muted">Dê sua nota, conte como foi e mande fotos do prato.</p>
              <Link href={`/restaurantes/${r.id}/avaliar`} className={`mt-5 ${primaryButtonClass}`}>
                Avaliar este lugar
              </Link>
            </div>
            <PlaceMap name={r.name} address={r.address} neighborhood={r.neighborhood} city={r.city} placeId={r.googlePlaceId} />
              <PinReport restaurantId={r.id} admin={souAdmin} />
          </div>
        </aside>
      </div>
    </>
  );
}
