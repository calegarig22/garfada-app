// Perfil no estilo Letterboxd (o seu e o dos outros):
// cabeçalho → Favoritos → Atividade recente → Notas → Listas → Todas as avaliações.
import Link from "next/link";
import { AlignLeft, Star } from "lucide-react";
import type { CollectionSummary } from "@/lib/lists";
import type { RestaurantListItem } from "@/lib/restaurants";
import type { getProfile, ReviewCard } from "@/lib/social";
import { Avatar } from "./avatar";
import { CollectionCard } from "./collection-card";
import { NotaPlaquinha } from "./plaquinha";
import { FollowButton } from "./social-buttons";

type Profile = NonNullable<Awaited<ReturnType<typeof getProfile>>>;

function SectionTitle({ id, children, right }: { id: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 border-b-2 border-text pb-1.5">
      <h3 id={id} className="letreiro pt-1 text-[1.5rem] leading-none">
        {children}
      </h3>
      {right}
    </div>
  );
}

/** Capa em pé do restaurante (como o pôster de filme do Letterboxd). */
function Poster({ r, href, children }: { r?: RestaurantListItem; href: string; children?: React.ReactNode }) {
  return (
    <Link href={href} className="group block" aria-label={r?.name}>
      <span className="relative block aspect-[2/3] overflow-hidden rounded-control border-2 border-text bg-accent">
        {r?.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={r.cover.url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full items-end p-2 text-accent-fg">
            <span className="letreiro line-clamp-3 pt-[0.15em] text-[1.1rem] leading-none">{r?.name}</span>
          </span>
        )}
        {children}
      </span>
      <span className="mt-1.5 block truncate text-xs font-semibold group-hover:text-primary sm:text-sm">{r?.name}</span>
    </Link>
  );
}

export function ProfileView({
  p,
  reviews,
  isMe,
  favorites,
  recentPlaces,
  histogram,
  lists,
}: {
  p: Profile;
  reviews: ReviewCard[];
  isMe: boolean;
  favorites: RestaurantListItem[];
  /** restaurantes das avaliações recentes (para as capas), por id */
  recentPlaces: Map<string, RestaurantListItem>;
  histogram: number[];
  lists: CollectionSummary[];
}) {
  const recentes = reviews.slice(0, 4);
  const maxBar = Math.max(1, ...histogram);
  const total = histogram.reduce((a, b) => a + b, 0);
  const media = total ? histogram.reduce((acc, n, i) => acc + n * (i + 1), 0) / total / 2 : 0;

  return (
    <>
      {/* Cabeçalho */}
      <section className="px-4 pt-6">
        <div className="flex items-center gap-4">
          <Avatar name={p.name ?? p.username} image={p.image} size={84} />
          <div className="min-w-0 flex-1">
            <h2 className="letreiro truncate pt-1 text-[2.25rem] leading-none">{p.name ?? p.username}</h2>
            <p className="mt-1 truncate text-text-muted">@{p.username}</p>
          </div>
        </div>
        {p.bio ? <p className="mt-4 max-w-prose whitespace-pre-line leading-relaxed">{p.bio}</p> : null}

        <dl className="mt-5 grid max-w-md grid-cols-3 border-y-2 border-text py-3 text-center">
          {(
            [
              [p.reviews, "avaliação", "avaliações"],
              [p.followers, "seguidor", "seguidores"],
              [p.following, "seguindo", "seguindo"],
            ] as const
          ).map(([v, um, varios]) => (
            <div key={varios}>
              <dt className="sr-only">{varios}</dt>
              <dd>
                <span className="letreiro block text-[1.75rem] tabular-nums">{v}</span>
                <span className="text-xs uppercase tracking-wide text-text-muted">{v === 1 ? um : varios}</span>
              </dd>
            </div>
          ))}
        </dl>
        {!isMe ? (
          <div className="mt-4">
            <FollowButton userId={p.id} following={p.isFollowing} />
          </div>
        ) : null}
      </section>

      <div className="flex flex-col gap-9 px-4 pb-12 pt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-x-10">
        <div className="flex min-w-0 flex-col gap-9">
          {/* Favoritos */}
          <section aria-labelledby="t-fav">
            <SectionTitle id="t-fav">Favoritos</SectionTitle>
            <ul className="mt-3 grid grid-cols-4 gap-2 sm:gap-3">
              {[0, 1, 2, 3].map((i) => (
                <li key={i}>
                  {favorites[i] ? (
                    <Poster r={favorites[i]} href={`/restaurantes/${favorites[i].id}`} />
                  ) : (
                    <span className="flex aspect-[2/3] items-center justify-center rounded-control border-2 border-dashed border-border text-text-muted">
                      <Star aria-hidden size={20} />
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {isMe && favorites.length < 4 ? (
              <p className="mt-2 text-sm text-text-muted">
                Escolha até 4: abra um restaurante e toque em <strong className="text-text">Favoritar</strong>.
              </p>
            ) : null}
          </section>

          {/* Atividade recente */}
          <section aria-labelledby="t-recente">
            <SectionTitle id="t-recente">Atividade recente</SectionTitle>
            {recentes.length ? (
              <ul className="mt-3 grid grid-cols-4 gap-2 sm:gap-3">
                {recentes.map((r) => (
                  <li key={r.id}>
                    <Poster r={recentPlaces.get(r.restaurantId)} href={`/avaliacoes/${r.id}`} />
                    <span className="mt-1 flex items-center gap-1.5">
                      <NotaPlaquinha nota={r.rating} className="text-xs" />
                      {r.body ? <AlignLeft aria-label="tem texto" size={14} className="text-text-muted" /> : null}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-text-muted">{isMe ? "Você ainda não avaliou nenhum lugar." : "Nenhuma avaliação ainda."}</p>
            )}
          </section>

          {/* Todas as avaliações (grade) */}
          <section aria-labelledby="t-todas">
            <SectionTitle id="t-todas" right={<span className="pb-0.5 text-sm text-text-muted">{p.reviews}</span>}>
              {isMe ? "Minhas avaliações" : "Avaliações"}
            </SectionTitle>
            {reviews.length === 0 ? (
              <p className="py-4 text-text-muted">
                {isMe ? "Abra um restaurante em Explorar e toque em Avaliar." : "Nada por aqui ainda."}
              </p>
            ) : (
              <ul className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2 lg:grid-cols-4">
                {reviews.map((r) => {
                  const place = recentPlaces.get(r.restaurantId);
                  const img = r.photos[0]?.url ?? place?.cover?.url;
                  return (
                    <li key={r.id}>
                      <Link
                        href={`/avaliacoes/${r.id}`}
                        className="group relative block aspect-square overflow-hidden rounded-control border-2 border-text bg-accent"
                        aria-label={`${r.restaurantName}, nota ${(r.rating / 2).toLocaleString("pt-BR")}`}
                      >
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        ) : null}
                        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-text/80 to-transparent p-1.5 pt-6">
                          <span className="letreiro line-clamp-2 pt-[0.15em] text-[0.95rem] leading-none text-bg sm:text-[1.15rem]">
                            {r.restaurantName}
                          </span>
                        </span>
                        <NotaPlaquinha nota={r.rating} className="absolute right-1 top-1 text-xs" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Coluna lateral (no celular vem depois): notas e listas */}
        <div className="flex min-w-0 flex-col gap-9">
          <section aria-labelledby="t-notas">
            <SectionTitle
              id="t-notas"
              right={total ? <span className="pb-0.5 text-sm text-text-muted">média {media.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}★</span> : null}
            >
              Notas
            </SectionTitle>
            <div className="mt-3 flex items-end gap-2">
              <span aria-hidden className="pb-0.5 text-sm text-star">★</span>
              <div
                role="img"
                aria-label={`Distribuição das notas: ${histogram.map((n, i) => `${((i + 1) / 2).toLocaleString("pt-BR")} estrelas, ${n}`).join("; ")}`}
                className="flex h-20 flex-1 items-end gap-[3px]"
              >
                {histogram.map((n, i) => (
                  <span
                    key={i}
                    className={`flex-1 rounded-t-sm ${n ? "bg-text" : "bg-border"}`}
                    style={{ height: `${Math.max(4, (n / maxBar) * 100)}%` }}
                    title={`${((i + 1) / 2).toLocaleString("pt-BR")}★: ${n}`}
                  />
                ))}
              </div>
              <span aria-hidden className="pb-0.5 text-sm tracking-tighter text-star">★★★★★</span>
            </div>
          </section>

          <section aria-labelledby="t-listas">
            <SectionTitle id="t-listas" right={<span className="pb-0.5 text-sm text-text-muted">{lists.length}</span>}>
              Listas
            </SectionTitle>
            {lists.length ? (
              <ul className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-1">
                {lists.map((c) => (
                  <li key={c.id}>
                    <CollectionCard c={c} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-text-muted">
                {isMe ? "Suas listas aparecem aqui. Crie na aba Salvos." : "Nenhuma lista pública."}
              </p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
