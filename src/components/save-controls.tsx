"use client";
// Botões da página do restaurante: "Quero ir", "Favorito" (até 4) e "Listas".
import { useActionState, useOptimistic, useState, useTransition } from "react";
import { Bookmark, Check, ListPlus, Lock, Star } from "lucide-react";
import {
  alternarFavorito,
  alternarNaLista,
  alternarQueroIr,
  criarLista,
  type NovaListaState,
} from "@/app/(app)/salvos/actions";

type ListOption = { id: string; name: string; isPrivate: boolean; has: boolean };

const chip =
  "pressable inline-flex h-11 items-center gap-2 rounded-control border-2 px-3.5 text-sm font-semibold";
const on = "border-text bg-text text-bg";
const off = "border-text bg-surface text-text hover:bg-surface-sunken";

export function SaveControls({
  restaurantId,
  queroIr,
  isFavorite,
  lists,
}: {
  restaurantId: string;
  queroIr: boolean;
  isFavorite: boolean;
  lists: ListOption[];
}) {
  const [, start] = useTransition();

  // Quero ir
  const [qiConfirmed, setQi] = useState(queroIr);
  const [qi, setQiOpt] = useOptimistic(qiConfirmed);

  // Favorito
  const [favConfirmed, setFav] = useState(isFavorite);
  const [fav, setFavOpt] = useOptimistic(favConfirmed);
  const [favError, setFavError] = useState<string | null>(null);

  // Listas
  const [myLists, setMyLists] = useState(lists);
  const [listState, listAction, creating] = useActionState<NovaListaState, FormData>(async (prev, fd) => {
    const r = await criarLista(prev, fd);
    if (r.created) setMyLists((l) => [...l, { ...r.created!, isPrivate: fd.get("isPrivate") === "on", has: true }]);
    return r;
  }, {});

  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={qi}
          onClick={() =>
            start(async () => {
              setQiOpt(!qi);
              setQi((await alternarQueroIr(restaurantId)).saved);
            })
          }
          className={`${chip} ${qi ? on : off}`}
        >
          <Bookmark aria-hidden size={18} className={qi ? "fill-current" : ""} />
          {qi ? "Na lista Quero ir" : "Quero ir"}
        </button>

        <button
          type="button"
          aria-pressed={fav}
          onClick={() =>
            start(async () => {
              setFavError(null);
              setFavOpt(!fav);
              const r = await alternarFavorito(restaurantId);
              setFav(r.isFavorite);
              if (r.error) setFavError(r.error);
            })
          }
          className={`${chip} ${fav ? "border-text bg-tag text-tag-fg" : off}`}
        >
          <Star aria-hidden size={18} className={fav ? "fill-current" : ""} />
          {fav ? "Favorito" : "Favoritar"}
        </button>

        {/* Listas: abre um painel com as minhas listas */}
        <details className="group relative">
          <summary className={`${chip} ${off} cursor-pointer list-none`}>
            <ListPlus aria-hidden size={18} />
            Listas
          </summary>
          <div className="absolute left-0 z-20 mt-2 w-72 rounded-card border-2 border-text bg-surface p-3 shadow-[0_4px_0_var(--text)]">
            <p className="letreiro text-[1.25rem]">Salvar em lista</p>
            {myLists.length ? (
              <ul className="mt-2 flex max-h-56 flex-col overflow-y-auto">
                {myLists.map((l) => (
                  <li key={l.id}>
                    <ListToggle restaurantId={restaurantId} list={l} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-text-muted">Você ainda não tem listas. Crie a primeira:</p>
            )}
            <form action={listAction} className="mt-3 flex flex-col gap-2 border-t-2 border-dashed border-border pt-3">
              <input type="hidden" name="restaurantId" value={restaurantId} />
              <label htmlFor="nova-lista" className="text-sm font-semibold">
                Nova lista
              </label>
              <input
                id="nova-lista"
                name="name"
                required
                maxLength={60}
                placeholder="Ex.: Almoço barato"
                className="h-11 rounded-control border-2 border-border bg-bg px-3 text-base hover:border-text-muted focus-visible:border-ring focus-visible:outline-none"
              />
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input type="checkbox" name="isPrivate" className="size-5 accent-[var(--text)]" />
                <Lock aria-hidden size={14} /> Só eu vejo (privada)
              </label>
              {listState.error ? <p className="text-sm font-medium text-danger">{listState.error}</p> : null}
              <button
                type="submit"
                disabled={creating}
                className="pressable letreiro h-11 rounded-control bg-primary pt-0.5 text-lg text-primary-fg disabled:opacity-60"
              >
                {creating ? "Criando…" : "Criar e salvar aqui"}
              </button>
            </form>
          </div>
        </details>
      </div>
      {favError ? (
        <p role="alert" className="mt-2 text-sm font-medium text-danger">
          {favError}
        </p>
      ) : null}
    </div>
  );
}

function ListToggle({ restaurantId, list }: { restaurantId: string; list: ListOption }) {
  const [confirmed, setConfirmed] = useState(list.has);
  const [has, setOpt] = useOptimistic(confirmed);
  const [, start] = useTransition();
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={has}
      onClick={() =>
        start(async () => {
          setOpt(!has);
          setConfirmed((await alternarNaLista(list.id, restaurantId)).saved);
        })
      }
      className="flex min-h-11 w-full items-center gap-2 rounded-control px-2 text-left hover:bg-surface-sunken"
    >
      <span
        aria-hidden
        className={`flex size-5 shrink-0 items-center justify-center rounded border-2 border-text ${has ? "bg-text text-bg" : ""}`}
      >
        {has ? <Check size={14} strokeWidth={3} /> : null}
      </span>
      <span className="min-w-0 flex-1 truncate">{list.name}</span>
      {list.isPrivate ? <Lock aria-label="privada" size={14} className="text-text-muted" /> : null}
    </button>
  );
}
