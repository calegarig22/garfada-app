import Link from "next/link";
import { Bell } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { BackHeader } from "@/components/back-header";
import { EmptyState } from "@/components/empty-state";
import { requireUser } from "@/lib/session";
import { listNotifications, markAllRead } from "@/lib/social";

export const metadata = { title: "Notificações" };

const quando = (d: Date) => {
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min`;
  if (min < 60 * 24) return `${Math.round(min / 60)} h`;
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
};

export default async function NotificacoesPage() {
  const me = await requireUser();
  const itens = await listNotifications(me.id);
  // Abriu a tela: tudo passa a contar como lido (a bolinha do sino some).
  await markAllRead(me.id);

  return (
    <>
      <BackHeader href="/social" title="Notificações" />
      <div className="px-4 lg:max-w-2xl">
        {itens.length === 0 ? (
          <EmptyState Icon={Bell} title="Nada por aqui">
            Quando alguém curtir, comentar ou começar a te seguir, aparece aqui.
          </EmptyState>
        ) : (
          <ul>
            {itens.map((n) => {
              const href = n.type === "follow" ? `/u/${n.actorUsername}` : `/avaliacoes/${n.reviewId}`;
              const texto =
                n.type === "follow"
                  ? "começou a te seguir."
                  : n.type === "review_like"
                    ? `curtiu sua avaliação de ${n.restaurantName ?? "um lugar"}.`
                    : `comentou na sua avaliação de ${n.restaurantName ?? "um lugar"}:`;
              return (
                <li key={n.id} className="border-b border-border">
                  <Link href={href} className="flex items-start gap-3 py-3 hover:bg-surface-sunken">
                    <Avatar name={n.actorName ?? n.actorUsername} size={44} />
                    <span className="min-w-0 flex-1">
                      <span className="block leading-snug">
                        <span className="font-semibold">@{n.actorUsername}</span> {texto}
                        {!n.readAt ? (
                          <span className="ml-2 inline-block size-2 rounded-full bg-primary align-middle" aria-label="nova" />
                        ) : null}
                      </span>
                      {n.commentBody ? (
                        <span className="mt-0.5 line-clamp-2 block text-text-muted">“{n.commentBody}”</span>
                      ) : null}
                      <span className="text-sm text-text-muted">{quando(n.createdAt)}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
