// Uma avaliação no formato "post": quem, onde, fotos, nota, texto, curtidas e comentários.
import Link from "next/link";
import { MessageCircle, Pencil, Trash2 } from "lucide-react";
import { apagarReview } from "@/app/(app)/restaurantes/actions";
import type { ReviewCard } from "@/lib/social";
import { Avatar } from "./avatar";
import { NotaPlaquinha } from "./plaquinha";
import { PhotoThumbs } from "./photo-lightbox";
import { LikeButton } from "./social-buttons";

const dataBR = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });

export function ReviewPost({
  r,
  showRestaurant = true,
  full = false,
  canDelete = false,
}: {
  r: ReviewCard;
  showRestaurant?: boolean;
  /** Mostra "Editar" e "Apagar minha avaliação" (só para quem escreveu). */
  canDelete?: boolean;
  /** Na página da avaliação: texto inteiro e sem link para ela mesma. */
  full?: boolean;
}) {
  const href = `/avaliacoes/${r.id}`;
  return (
    <article className="border-b-2 border-dashed border-border py-5">
      {/* Quem e onde */}
      <header className="flex items-center gap-3">
        <Link href={`/u/${r.username}`} className="shrink-0" aria-label={`Perfil de @${r.username}`}>
          <Avatar name={r.name ?? r.username} size={44} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/u/${r.username}`} className="block truncate font-semibold hover:underline">
            @{r.username}
          </Link>
          <p className="truncate text-sm text-text-muted">
            {showRestaurant ? (
              <>
                em{" "}
                <Link href={`/restaurantes/${r.restaurantId}`} className="font-semibold text-text hover:text-primary">
                  {r.restaurantName}
                </Link>
                {" · "}
              </>
            ) : null}
            foi em {dataBR(r.visitedOn)}
            {r.editedAt ? " · editada" : ""}
          </p>
        </div>
        <NotaPlaquinha nota={r.rating} className="shrink-0 text-xl" />
      </header>

      {/* Texto ao lado das fotos (quadradinhos que abrem em tela cheia) */}
      {r.body || r.photos.length ? (
        <div className="mt-3 flex items-start gap-3">
          {r.body ? (
            <div className="min-w-0 flex-1">
              <p className={`whitespace-pre-line leading-relaxed ${full ? "" : "line-clamp-5"}`}>{r.body}</p>
              {!full && r.body.length > 220 ? (
                <Link href={href} className="text-sm font-semibold text-text-muted hover:text-text">
                  ver mais
                </Link>
              ) : null}
            </div>
          ) : null}
          {r.photos.length ? (
            <PhotoThumbs photos={r.photos} alt={`Fotos de @${r.username} em ${r.restaurantName}`} />
          ) : null}
        </div>
      ) : null}

      {/* Curtir e comentar */}
      <footer className="mt-2 flex items-center gap-1">
        <LikeButton reviewId={r.id} liked={r.likedByMe} likes={r.likes} />
        {full ? (
          <span className="inline-flex min-h-11 items-center gap-1.5 px-2 font-semibold">
            <MessageCircle aria-hidden size={22} />
            <span className="tabular-nums">{r.comments}</span>
          </span>
        ) : (
          <Link
            href={`${href}#comentarios`}
            aria-label={`${r.comments} comentários. Abrir avaliação`}
            className="pressable inline-flex min-h-11 items-center gap-1.5 rounded-control px-2 font-semibold hover:bg-surface-sunken"
          >
            <MessageCircle aria-hidden size={22} />
            <span className="tabular-nums">{r.comments}</span>
          </Link>
        )}
      </footer>

      {canDelete ? (
        <div className="flex flex-wrap items-start gap-x-2">
        <Link
          href={`/avaliacoes/${r.id}/editar`}
          className="inline-flex min-h-11 items-center gap-1.5 px-2 text-sm font-medium text-text-muted hover:text-text"
        >
          <Pencil aria-hidden size={16} />
          Editar minha avaliação
        </Link>
        <details className="text-sm">
          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 px-2 font-medium text-text-muted hover:text-danger">
            <Trash2 aria-hidden size={16} />
            Apagar minha avaliação
          </summary>
          <form action={apagarReview.bind(null, r.id)} className="flex items-center gap-3 px-2 pb-1">
            <span className="text-text-muted">A nota, o texto, as fotos e os comentários somem de vez.</span>
            <button
              type="submit"
              className="pressable inline-flex min-h-11 shrink-0 items-center rounded-control bg-danger px-3 font-semibold text-bg"
            >
              Apagar
            </button>
          </form>
        </details>
        </div>
      ) : null}
    </article>
  );
}
