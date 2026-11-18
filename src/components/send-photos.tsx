"use client";
// "Mandar foto": fotos do prato, do cardápio ou da fachada, sem precisar avaliar.
import { startTransition, useActionState, useState } from "react";
import { Camera } from "lucide-react";
import { enviarFotosLugar, type FotosState } from "@/app/(app)/restaurantes/actions";
import { FormError } from "./form";
import { PhotoPicker } from "./photo-picker";

export function SendPhotos({ restaurantId, semFotoReal }: { restaurantId: string; semFotoReal: boolean }) {
  const [state, action, pending] = useActionState<FotosState, FormData>(enviarFotosLugar.bind(null, restaurantId), {});
  const [chave, setChave] = useState(0); // recria o seletor depois de enviar

  return (
    <details className="mt-4 rounded-card border-2 border-dashed border-text-muted bg-surface" key={state.enviadas ? `ok-${chave}` : "aberto"}>
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 font-semibold">
        <Camera aria-hidden size={20} />
        {semFotoReal ? "Ninguém mandou foto daqui ainda — seja a primeira pessoa" : "Mandar foto deste lugar"}
      </summary>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(() => action(fd));
          setChave((c) => c + 1);
        }}
        className="flex flex-col gap-3 border-t-2 border-dashed border-border p-4"
      >
        <p className="text-sm text-text-muted">Prato, cardápio, fachada ou o salão — ajuda quem ainda não foi.</p>
        <PhotoPicker key={chave} label="Fotos" />
        <FormError>{state.error}</FormError>
        {state.enviadas ? (
          <p role="status" className="text-sm font-semibold">
            {state.enviadas === 1 ? "Foto enviada! Já está no carrossel." : `${state.enviadas} fotos enviadas! Já estão no carrossel.`}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="pressable letreiro h-12 rounded-control bg-primary pt-0.5 text-[1.25rem] text-primary-fg shadow-[0_3px_0_var(--text)] disabled:opacity-60"
        >
          {pending ? "Enviando…" : "Enviar fotos"}
        </button>
      </form>
    </details>
  );
}
