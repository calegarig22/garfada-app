"use client";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { X } from "lucide-react";
import { Field, FormError, inputClass, SubmitButton } from "@/components/form";
import { PhotoPicker } from "@/components/photo-picker";
import { StarPicker } from "@/components/star-picker";
import { editarReview, type AvaliarState } from "@/app/(app)/restaurantes/actions";

const hoje = () => new Date().toLocaleDateString("sv-SE");

export function EditReviewForm({
  reviewId,
  rating,
  visitedOn,
  body,
  photos,
  photosEnabled,
}: {
  reviewId: string;
  rating: number;
  visitedOn: string;
  body: string;
  photos: { id: string; url: string }[];
  photosEnabled: boolean;
}) {
  const [state, action, pending] = useActionState<AvaliarState, FormData>(editarReview.bind(null, reviewId), {});
  const [kept, setKept] = useState(photos);

  return (
    <form
      // Envio "à mão" para o React não limpar o formulário se der erro.
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      className="flex flex-col gap-6"
    >
      <StarPicker defaultValue={rating} />

      <Field id="visitedOn" label="Quando você foi?">
        <input id="visitedOn" name="visitedOn" type="date" required max={hoje()} defaultValue={visitedOn} className={inputClass} />
      </Field>

      <Field id="body" label="Como foi? (opcional)">
        <textarea
          id="body"
          name="body"
          rows={5}
          maxLength={2000}
          defaultValue={body}
          placeholder="O que você pediu, o que valeu a pena, o que não voltaria a pedir…"
          className={`${inputClass} h-auto py-3 leading-relaxed`}
        />
      </Field>

      {kept.length ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-semibold">Fotos que já estão na avaliação</legend>
          <ul className="grid grid-cols-4 gap-2">
            {kept.map((p, i) => (
              <li key={p.id} className="relative aspect-square overflow-hidden rounded-control border-2 border-text">
                <input type="hidden" name="keepPhoto" value={p.id} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={`Sua foto ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setKept((cur) => cur.filter((x) => x.id !== p.id))}
                  aria-label={`Tirar foto ${i + 1}`}
                  className="absolute right-0.5 top-0.5 flex size-8 items-center justify-center rounded-control bg-text text-bg"
                >
                  <X aria-hidden size={16} />
                </button>
              </li>
            ))}
          </ul>
          {kept.length < photos.length ? (
            <p className="text-sm text-text-muted">A foto tirada só some quando você salvar.</p>
          ) : null}
        </fieldset>
      ) : null}

      {photosEnabled && kept.length < 4 ? (
        <PhotoPicker max={4 - kept.length} label={kept.length ? "Mais fotos (opcional)" : "Fotos (opcional)"} />
      ) : null}

      <FormError>{state.error}</FormError>
      <SubmitButton pending={pending} pendingText="Salvando…">
        Salvar alterações
      </SubmitButton>
      <Link
        href={`/avaliacoes/${reviewId}`}
        className="-mt-3 inline-flex min-h-11 items-center justify-center font-semibold text-text-muted underline underline-offset-4 hover:text-text"
      >
        Cancelar
      </Link>
    </form>
  );
}
