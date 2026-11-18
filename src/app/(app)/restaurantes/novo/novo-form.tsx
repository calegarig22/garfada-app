"use client";
import Link from "next/link";
import { startTransition, useActionState, useRef, useState } from "react";
import { Field, FormError, inputClass, SubmitButton, TextInput } from "@/components/form";
import { PhotoPicker } from "@/components/photo-picker";
import type { GooglePlace } from "@/lib/google-places";
import { redeGrande } from "@/lib/chains";
import { criarRestaurante, sugerirParecidos, type NovoLugarState } from "../actions";
import { GoogleSearch } from "./google-search";

const PRECOS = [
  { v: "1", label: "$", hint: "barato" },
  { v: "2", label: "$$", hint: "médio" },
  { v: "3", label: "$$$", hint: "caro" },
  { v: "4", label: "$$$$", hint: "ocasião especial" },
];

export function NovoLugarForm({
  tipos,
  photosEnabled,
  googleEnabled,
  inicial,
  unidadeDe,
}: {
  tipos: { id: string; name: string }[];
  photosEnabled: boolean;
  googleEnabled: boolean;
  /** valores já preenchidos (ao cadastrar outra unidade) */
  inicial?: { name: string; city: string; cuisineId: string; priceLevel: string };
  unidadeDe?: string;
}) {
  const [state, action, pending] = useActionState<NovoLugarState, FormData>(criarRestaurante, {});
  const v: Record<string, string> = state.values ?? inicial ?? {};
  const [aviso, setAviso] = useState<string | null>(null); // rede grande
  const formRef = useRef<HTMLFormElement>(null);
  const [parecidos, setParecidos] = useState<Parecido[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Espera a pessoa parar de digitar (0,4 s) antes de procurar
  function buscarParecidos(nome: string) {
    if (timer.current) clearTimeout(timer.current);
    if (nome.trim().length < 3) {
      setParecidos([]);
      return;
    }
    timer.current = setTimeout(async () => {
      const cidade = (formRef.current?.elements.namedItem("city") as HTMLInputElement | null)?.value ?? "";
      setParecidos(await sugerirParecidos(nome, cidade));
    }, 400);
  }
  const [googlePlaceId, setGooglePlaceId] = useState("");

  // Lugar escolhido na busca do Google: preenche os campos (a pessoa ainda pode editar).
  function preencher(p: GooglePlace) {
    const form = formRef.current;
    if (!form) return;
    const set = (name: string, value: string | null) => {
      const el = form.elements.namedItem(name);
      if (el instanceof HTMLInputElement && value) el.value = value;
    };
    set("name", p.name);
    set("address", p.address);
    set("neighborhood", p.neighborhood);
    set("city", p.city);
    setGooglePlaceId(p.id);
  }

  return (
    <form
      // Envio "à mão" para o React não limpar o formulário: se aparecer um aviso,
      // tudo o que a pessoa preencheu (inclusive as fotos) continua ali.
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      ref={formRef}
      className="flex flex-col gap-5"
    >
      {googleEnabled ? <GoogleSearch onPick={preencher} /> : null}
      <input type="hidden" name="googlePlaceId" value={googlePlaceId} />
      {unidadeDe ? <input type="hidden" name="unidadeDe" value={unidadeDe} /> : null}

      <Field id="name" label="Nome do lugar">
        <TextInput
          id="name"
          name="name"
          required
          maxLength={80}
          defaultValue={v.name}
          autoComplete="off"
          // Mudou o nome à mão? Então deixa de ser o lugar escolhido no Google.
          onChange={(e) => {
            setGooglePlaceId("");
            setAviso(redeGrande(e.target.value) ? "Redes grandes (com muitas lojas iguais) não entram no Garfada — aqui é para descobrir lugares." : null);
            if (!unidadeDe) buscarParecidos(e.target.value);
          }}
        />
      </Field>
      {aviso ? (
        <p role="alert" className="-mt-2 border-l-4 border-danger bg-surface-sunken p-3 text-sm font-medium text-danger">
          {aviso}
        </p>
      ) : null}
      {/* Enquanto digita: lugares parecidos que JÁ existem (para avaliar em vez de cadastrar de novo) */}
      {parecidos.length && !state.similares ? (
        <div aria-live="polite" className="-mt-2 border-l-4 border-tag bg-surface-sunken p-3">
          <p className="text-sm font-semibold">Já está no Garfada? Avalie direto:</p>
          <ParecidosLista itens={parecidos} />
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="neighborhood" label="Bairro">
          <TextInput id="neighborhood" name="neighborhood" maxLength={60} defaultValue={v.neighborhood} placeholder="Ex.: Pinheiros" />
        </Field>
        <Field id="city" label="Cidade">
          <TextInput id="city" name="city" required maxLength={60} defaultValue={v.city ?? "São Paulo"} />
        </Field>
      </div>

      <Field id="address" label="Endereço (opcional)">
        <TextInput id="address" name="address" maxLength={120} defaultValue={v.address} placeholder="Rua e número" />
      </Field>

      <Field id="cuisineId" label="Tipo de comida">
        <select
          id="cuisineId"
          name="cuisineId"
          required
          defaultValue={v.cuisineId ?? ""}
          className={inputClass}
        >
          <option value="" disabled>
            Escolha…
          </option>
          {tipos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </Field>

      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold">Quanto custa</legend>
        <div className="grid grid-cols-4 gap-2">
          {PRECOS.map((p) => (
            <label key={p.v} className="cursor-pointer">
              <input type="radio" name="priceLevel" value={p.v} required defaultChecked={v.priceLevel === p.v} className="peer sr-only" />
              <span className="flex h-16 flex-col items-center justify-center rounded-control border-2 border-border bg-surface peer-checked:border-text peer-checked:bg-text peer-checked:text-bg peer-focus-visible:outline-2 peer-focus-visible:outline-ring hover:border-text-muted">
                <span className="letreiro text-2xl">{p.label}</span>
                <span className="text-[11px] opacity-80">{p.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {photosEnabled ? <PhotoPicker label="Fotos do lugar (opcional)" /> : null}

      {state.similares ? (
        <div role="alert" className="border-l-4 border-tag bg-surface-sunken p-4">
          <p className="font-semibold">Este lugar já está no Garfada?</p>
          <ParecidosLista itens={state.similares} />
          <p className="mt-2 text-sm text-text-muted">
            Se for um deles, toque em <strong className="text-text">Avaliar</strong>. Se for outra unidade ou outro lugar,
            salve de novo.
          </p>
          <input type="hidden" name="confirmaNovo" value="1" />
        </div>
      ) : null}

      <FormError>{state.error}</FormError>
      <SubmitButton pending={pending} pendingText="Salvando…">
        {state.similares ? "É outro lugar, cadastrar" : "Salvar lugar"}
      </SubmitButton>
    </form>
  );
}

type Parecido = { id: string; name: string; neighborhood: string | null; address: string | null };

function ParecidosLista({ itens }: { itens: Parecido[] }) {
  return (
    <ul className="mt-2 flex flex-col gap-1.5">
      {itens.map((p) => (
        <li key={p.id} className="flex items-center justify-between gap-3">
          <Link href={`/restaurantes/${p.id}`} className="min-w-0 hover:underline">
            <span className="block truncate font-semibold">{p.name}</span>
            <span className="block truncate text-xs text-text-muted">
              {[p.address, p.neighborhood].filter(Boolean).join(" · ") || "sem endereço"}
            </span>
          </Link>
          <Link
            href={`/restaurantes/${p.id}/avaliar`}
            className="pressable letreiro inline-flex h-11 shrink-0 items-center rounded-control bg-primary px-3 pt-0.5 text-base text-primary-fg"
          >
            Avaliar
          </Link>
        </li>
      ))}
    </ul>
  );
}
