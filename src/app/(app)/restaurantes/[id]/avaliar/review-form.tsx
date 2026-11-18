"use client";
import { startTransition, useActionState } from "react";
import { Field, FormError, inputClass, SubmitButton } from "@/components/form";
import { PhotoPicker } from "@/components/photo-picker";
import { StarPicker } from "@/components/star-picker";
import { avaliar, type AvaliarState } from "../../actions";

/** Hoje no fuso de quem está usando, no formato do campo de data (2026-11-14). */
const hoje = () => new Date().toLocaleDateString("sv-SE");

export function ReviewForm({ restaurantId, photosEnabled }: { restaurantId: string; photosEnabled: boolean }) {
  const [state, action, pending] = useActionState<AvaliarState, FormData>(avaliar.bind(null, restaurantId), {});

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
      <StarPicker />

      <Field id="visitedOn" label="Quando você foi?">
        <input id="visitedOn" name="visitedOn" type="date" required max={hoje()} defaultValue={hoje()} className={inputClass} />
      </Field>

      <Field id="body" label="Como foi? (opcional)">
        <textarea
          id="body"
          name="body"
          rows={5}
          maxLength={2000}
          placeholder="O que você pediu, o que valeu a pena, o que não voltaria a pedir…"
          className={`${inputClass} h-auto py-3 leading-relaxed`}
        />
      </Field>

      {photosEnabled ? <PhotoPicker label="Fotos (opcional)" /> : null}

      <FormError>{state.error}</FormError>
      <SubmitButton pending={pending} pendingText="Salvando…">
        Salvar avaliação
      </SubmitButton>
    </form>
  );
}
