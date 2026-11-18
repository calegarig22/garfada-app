"use client";
// Texto do comentário. Para quem escreveu, um botão "Editar" troca o texto por um campo.
import { startTransition, useActionState, useState } from "react";
import { FormError } from "@/components/form";
import { editarComentario, type EditarComentarioState } from "../../social/actions";

export function CommentBody({ commentId, body, mine }: { commentId: string; body: string; mine: boolean }) {
  // Guarda o "número de salvamentos" de quando abriu a edição; salvou de novo = fecha.
  const [openedAt, setOpenedAt] = useState<number | null>(null);
  const [state, action, pending] = useActionState<EditarComentarioState, FormData>(
    editarComentario.bind(null, commentId),
    {},
  );
  const editing = openedAt !== null && (state.ok ?? 0) === openedAt;
  const setEditing = (on: boolean) => setOpenedAt(on ? (state.ok ?? 0) : null);

  if (!editing) {
    return (
      <>
        <p className="mt-0.5 whitespace-pre-line break-words leading-relaxed">{body}</p>
        {mine ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="-ml-1 inline-flex min-h-9 items-center px-1 text-sm font-medium text-text-muted underline-offset-4 hover:text-text hover:underline"
          >
            Editar
          </button>
        ) : null}
      </>
    );
  }

  const id = `editar-${commentId}`;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      className="mt-1 flex flex-col gap-2"
    >
      <label htmlFor={id} className="sr-only">
        Editar comentário
      </label>
      <textarea
        id={id}
        name="body"
        required
        autoFocus
        maxLength={500}
        rows={2}
        defaultValue={body}
        className="min-h-12 w-full resize-y rounded-control border-2 border-border bg-surface px-3 py-2 text-base hover:border-text-muted focus-visible:border-ring focus-visible:outline-none"
      />
      <FormError>{state.error}</FormError>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="pressable inline-flex min-h-11 items-center rounded-control bg-primary px-4 font-semibold text-primary-fg disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Salvar"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="inline-flex min-h-11 items-center px-3 font-semibold text-text-muted hover:text-text"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
