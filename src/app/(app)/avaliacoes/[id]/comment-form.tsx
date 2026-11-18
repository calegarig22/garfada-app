"use client";
import { useActionState } from "react";
import { FormError } from "@/components/form";
import { comentar, type ComentarState } from "../../social/actions";

export function CommentForm({ reviewId }: { reviewId: string }) {
  const [state, action, pending] = useActionState<ComentarState, FormData>(comentar.bind(null, reviewId), {});

  return (
    // Depois de enviar com sucesso, o React limpa o campo sozinho.
    <form action={action} className="mt-5 flex flex-col gap-2">
      <label htmlFor="comentario" className="sr-only">
        Escreva um comentário
      </label>
      <div className="flex items-end gap-2">
        <textarea
          id="comentario"
          name="body"
          required
          maxLength={500}
          rows={2}
          placeholder="Escreva um comentário…"
          className="min-h-12 flex-1 resize-y rounded-control border-2 border-border bg-surface px-3.5 py-2.5 text-base placeholder:text-text-muted/70 hover:border-text-muted focus-visible:border-ring focus-visible:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="pressable letreiro h-12 shrink-0 rounded-control bg-primary px-4 pt-0.5 text-lg text-primary-fg shadow-[0_3px_0_var(--text)] active:shadow-[0_1px_0_var(--text)] disabled:opacity-60"
        >
          {pending ? "…" : "Enviar"}
        </button>
      </div>
      <FormError>{state.error}</FormError>
    </form>
  );
}
