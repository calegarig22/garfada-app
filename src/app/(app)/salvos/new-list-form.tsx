"use client";
// "Nova lista" na aba Salvos (fechado por padrão, abre ao tocar).
import { useActionState } from "react";
import { Lock, Plus } from "lucide-react";
import { FormError } from "@/components/form";
import { criarLista, type NovaListaState } from "./actions";

export function NewListForm() {
  const [state, action, pending] = useActionState<NovaListaState, FormData>(criarLista, {});

  return (
    <details className="rounded-card border-2 border-text bg-surface" key={state.created?.id}>
      <summary className="letreiro flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 pt-0.5 text-[1.375rem]">
        <Plus aria-hidden size={20} className="-mt-0.5" />
        Nova lista
      </summary>
      <form action={action} className="flex flex-col gap-3 border-t-2 border-dashed border-border p-4">
        <label htmlFor="lista-nome" className="text-sm font-semibold">
          Nome
        </label>
        <input
          id="lista-nome"
          name="name"
          required
          maxLength={60}
          placeholder="Ex.: Quero levar meus pais"
          className="h-12 rounded-control border-2 border-border bg-bg px-3.5 text-base hover:border-text-muted focus-visible:border-ring focus-visible:outline-none"
        />
        <label htmlFor="lista-desc" className="text-sm font-semibold">
          Descrição (opcional)
        </label>
        <textarea
          id="lista-desc"
          name="description"
          maxLength={300}
          rows={2}
          className="rounded-control border-2 border-border bg-bg px-3.5 py-2.5 text-base hover:border-text-muted focus-visible:border-ring focus-visible:outline-none"
        />
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" name="isPrivate" className="size-5 accent-[var(--text)]" />
          <Lock aria-hidden size={14} /> Só eu vejo (privada)
        </label>
        <FormError>{state.error}</FormError>
        <button
          type="submit"
          disabled={pending}
          className="pressable letreiro h-12 rounded-control bg-primary pt-0.5 text-[1.25rem] text-primary-fg shadow-[0_3px_0_var(--text)] disabled:opacity-60"
        >
          {pending ? "Criando…" : "Criar lista"}
        </button>
      </form>
    </details>
  );
}
