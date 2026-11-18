import Link from "next/link";
import { Bell, Search, Users } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ReviewPost } from "@/components/review-post";
import { FollowButton } from "@/components/social-buttons";
import { requireUser } from "@/lib/session";
import { listFeed, searchUsers, suggestUsers, unreadCount } from "@/lib/social";

export const metadata = { title: "Social" };

const one = (v: string | string[] | undefined) => (typeof v === "string" ? v.trim() : "");

export default async function SocialPage({ searchParams }: PageProps<"/social">) {
  const me = await requireUser();
  const sp = await searchParams;
  const q = one(sp.q).slice(0, 50);
  const modo = one(sp.ver) === "todos" ? "todos" : "seguindo";

  const [feed, pessoas, sugestoes, naoLidas] = await Promise.all([
    q ? Promise.resolve([]) : listFeed(me.id, modo),
    q ? searchUsers(me.id, q) : Promise.resolve([]),
    suggestUsers(me.id),
    unreadCount(me.id),
  ]);
  const pessoasSemMim = pessoas.filter((p) => p.id !== me.id);

  return (
    <>
      <PageHeader
        title="Social"
        actions={
          <Link
            href="/notificacoes"
            aria-label={naoLidas ? `Notificações: ${naoLidas} novas` : "Notificações"}
            className="pressable relative flex size-11 items-center justify-center rounded-control hover:bg-surface-sunken"
          >
            <Bell aria-hidden size={24} />
            {naoLidas ? (
              <span className="absolute right-1 top-1 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-fg">
                {naoLidas > 9 ? "9+" : naoLidas}
              </span>
            ) : null}
          </Link>
        }
      />

      <div className="px-4 pt-4 lg:max-w-2xl">
        {/* Buscar pessoas */}
        <form role="search" action="/social" className="flex gap-2">
          <label htmlFor="busca-pessoas" className="sr-only">
            Buscar pessoas por nome ou @
          </label>
          <div className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-control border-2 border-border bg-surface px-3 focus-within:border-ring hover:border-text-muted">
            <Search aria-hidden size={18} className="text-text-muted" />
            <input
              id="busca-pessoas"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Buscar pessoas"
              className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-text-muted/70"
            />
          </div>
          <button
            type="submit"
            className="pressable letreiro h-12 shrink-0 rounded-control border-2 border-text bg-surface px-4 pt-0.5 text-lg hover:bg-surface-sunken"
          >
            Buscar
          </button>
        </form>

        {q ? (
          <section aria-label="Pessoas encontradas" className="pt-4">
            {pessoasSemMim.length === 0 ? (
              <p className="py-4 text-text-muted">Ninguém com “{q}”. Tente outro nome ou @.</p>
            ) : (
              <ul className="flex flex-col">
                {pessoasSemMim.map((p) => (
                  <PersonRow key={p.id} p={p} />
                ))}
              </ul>
            )}
            <Link href="/social" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">
              Voltar ao feed
            </Link>
          </section>
        ) : (
          <>
            {/* Seguindo / Todos */}
            <nav aria-label="Qual feed" className="mt-4 flex gap-2 border-b-2 border-text">
              {(
                [
                  ["seguindo", "Seguindo", "/social"],
                  ["todos", "Todo mundo", "/social?ver=todos"],
                ] as const
              ).map(([k, label, href]) => (
                <Link
                  key={k}
                  href={href}
                  aria-current={modo === k ? "page" : undefined}
                  className={`letreiro -mb-0.5 inline-flex h-11 items-center border-b-4 px-2 pt-0.5 text-[1.375rem] ${
                    modo === k ? "border-primary text-text" : "border-transparent text-text-muted hover:text-text"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>

            {feed.length ? (
              <div>
                {feed.map((r) => (
                  <ReviewPost key={r.id} r={r} />
                ))}
              </div>
            ) : modo === "seguindo" ? (
              <EmptyState Icon={Users} title="Seu feed está vazio">
                Siga pessoas para ver aqui o que elas avaliam. Ou veja as avaliações de{" "}
                <Link href="/social?ver=todos" className="font-semibold text-text underline underline-offset-4">
                  todo mundo
                </Link>
                .
              </EmptyState>
            ) : (
              <EmptyState Icon={Users} title="Ninguém avaliou ainda">
                Seja a primeira pessoa: abra um lugar em Explorar e toque em Avaliar.
              </EmptyState>
            )}

            {/* Sugestões de quem seguir */}
            {sugestoes.length ? (
              <section aria-labelledby="titulo-sugestoes" className="pb-10 pt-6">
                <h2 id="titulo-sugestoes" className="letreiro text-[1.5rem]">
                  Pessoas para seguir
                </h2>
                <ul className="mt-2 flex flex-col">
                  {sugestoes.map((p) => (
                    <PersonRow key={p.id} p={{ ...p, isFollowing: false }} />
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}

function PersonRow({ p }: { p: { id: string; name: string | null; username: string | null; isFollowing: boolean } }) {
  return (
    <li className="flex items-center gap-3 border-b border-border py-3">
      <Link href={`/u/${p.username}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={p.name ?? p.username} size={44} />
        <span className="min-w-0">
          <span className="block truncate font-semibold">@{p.username}</span>
          {p.name ? <span className="block truncate text-sm text-text-muted">{p.name}</span> : null}
        </span>
      </Link>
      <FollowButton userId={p.id} following={p.isFollowing} />
    </li>
  );
}
