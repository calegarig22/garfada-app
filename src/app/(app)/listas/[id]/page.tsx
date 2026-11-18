import Link from "next/link";
import { notFound } from "next/navigation";
import { Bookmark, Lock, Trash2, Unlock } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { BackHeader } from "@/components/back-header";
import { EmptyState } from "@/components/empty-state";
import { RestaurantCard } from "@/components/restaurant-card";
import { db } from "@/db";
import { getCollection, QUERO_IR } from "@/lib/lists";
import { requireUser } from "@/lib/session";
import { apagarLista, alternarPrivacidade } from "../../salvos/actions";

export const metadata = { title: "Lista" };

export default async function ListaPage({ params }: PageProps<"/listas/[id]">) {
  const { id } = await params;
  const me = await requireUser();
  const lista = await getCollection(id, me.id);
  if (!lista) notFound();
  const dono = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, lista.ownerId),
    columns: { name: true, username: true },
  });
  const isMine = lista.ownerId === me.id;

  return (
    <>
      <BackHeader href={isMine ? "/salvos" : `/u/${dono?.username}`} title={lista.name} />
      <div className="px-4 pt-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Link href={`/u/${dono?.username}`} className="inline-flex min-h-11 items-center gap-2 font-semibold hover:underline">
            <Avatar name={dono?.name ?? dono?.username ?? "?"} size={32} />@{dono?.username}
          </Link>
          <span className="text-sm text-text-muted">
            {lista.restaurantes.length === 1 ? "1 lugar" : `${lista.restaurantes.length} lugares`}
          </span>
          {lista.isPrivate ? (
            <span className="inline-flex items-center gap-1 text-sm text-text-muted">
              <Lock aria-hidden size={14} /> privada
            </span>
          ) : null}
        </div>
        {lista.description ? <p className="mt-3 max-w-prose leading-relaxed">{lista.description}</p> : null}

        {isMine ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <form action={alternarPrivacidade.bind(null, lista.id)}>
              <button
                type="submit"
                className="pressable inline-flex h-11 items-center gap-2 rounded-control border-2 border-text bg-surface px-3.5 text-sm font-semibold hover:bg-surface-sunken"
              >
                {lista.isPrivate ? <Unlock aria-hidden size={16} /> : <Lock aria-hidden size={16} />}
                {lista.isPrivate ? "Tornar pública" : "Tornar privada"}
              </button>
            </form>
            {lista.kind !== QUERO_IR ? (
              <details>
                <summary className="pressable inline-flex h-11 cursor-pointer list-none items-center gap-2 rounded-control px-3 text-sm font-semibold text-text-muted hover:text-danger">
                  <Trash2 aria-hidden size={16} /> Apagar lista
                </summary>
                <form action={apagarLista.bind(null, lista.id)} className="flex items-center gap-3 py-2">
                  <span className="text-sm text-text-muted">A lista some; os restaurantes continuam no app.</span>
                  <button type="submit" className="pressable h-11 shrink-0 rounded-control bg-danger px-3 font-semibold text-bg">
                    Apagar
                  </button>
                </form>
              </details>
            ) : null}
          </div>
        ) : null}

        {lista.restaurantes.length ? (
          <div className="columns-2 gap-4 pb-10 pt-5 md:columns-3 xl:columns-4">
            {lista.restaurantes.map((r) => (
              <RestaurantCard key={r.id} r={r} />
            ))}
          </div>
        ) : (
          <EmptyState Icon={Bookmark} title="Lista vazia">
            {isMine
              ? "Abra um restaurante e use “Quero ir” ou “Listas” para salvar aqui."
              : "Esta pessoa ainda não salvou nada aqui."}
          </EmptyState>
        )}
      </div>
    </>
  );
}
