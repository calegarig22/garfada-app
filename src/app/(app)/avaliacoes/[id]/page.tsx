import Link from "next/link";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { BackHeader } from "@/components/back-header";
import { ReviewPost } from "@/components/review-post";
import { requireUser } from "@/lib/session";
import { getReviewCard, listComments } from "@/lib/social";
import { apagarComentario } from "../../social/actions";
import { CommentBody } from "./comment-body";
import { CommentForm } from "./comment-form";

export const metadata = { title: "Avaliação" };

const quando = (d: Date) => {
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min`;
  if (min < 60 * 24) return `${Math.round(min / 60)} h`;
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
};

export default async function AvaliacaoPage({ params }: PageProps<"/avaliacoes/[id]">) {
  const { id } = await params;
  const me = await requireUser();
  const [r, comentarios] = await Promise.all([getReviewCard(me.id, id), listComments(id)]);
  if (!r) notFound();

  return (
    <>
      <BackHeader href={`/restaurantes/${r.restaurantId}`} title={r.restaurantName} />
      <div className="px-4 lg:max-w-2xl">
        <ReviewPost r={r} full canDelete={r.userId === me.id} />

        <section id="comentarios" aria-labelledby="titulo-comentarios" className="pb-10 pt-4">
          <h2 id="titulo-comentarios" className="letreiro text-[1.75rem]">
            Comentários
          </h2>
          {comentarios.length === 0 ? (
            <p className="py-4 text-text-muted">Ninguém comentou ainda. Comece a conversa.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-4">
              {comentarios.map((c) => (
                <li key={c.id} className="flex gap-3">
                  <Link href={`/u/${c.username}`} className="shrink-0" aria-label={`Perfil de @${c.username}`}>
                    <Avatar name={c.name ?? c.username} size={36} />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <Link href={`/u/${c.username}`} className="font-semibold hover:underline">
                        @{c.username}
                      </Link>{" "}
                      <span className="text-text-muted">
                        · {quando(c.createdAt)}
                        {c.editedAt ? " · editado" : ""}
                      </span>
                    </p>
                    <CommentBody commentId={c.id} body={c.body} mine={c.userId === me.id} />
                  </div>
                  {c.userId === me.id || r.userId === me.id ? (
                    <form action={apagarComentario.bind(null, c.id)}>
                      <button
                        type="submit"
                        aria-label="Apagar comentário"
                        className="flex size-11 items-center justify-center rounded-control text-text-muted hover:bg-surface-sunken hover:text-danger"
                      >
                        <Trash2 aria-hidden size={18} />
                      </button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          <CommentForm reviewId={r.id} />
        </section>
      </div>
    </>
  );
}
