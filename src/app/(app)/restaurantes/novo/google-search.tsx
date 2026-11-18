"use client";
// "Buscar no Google": acha o lugar e preenche nome, endereço, bairro e cidade.
import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import type { GooglePlace } from "@/lib/google-places";
import { buscarNoGoogle } from "../actions";

export function GoogleSearch({ onPick }: { onPick: (p: GooglePlace) => void }) {
  const [texto, setTexto] = useState("");
  const [places, setPlaces] = useState<GooglePlace[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function buscar() {
    start(async () => {
      const r = await buscarNoGoogle(texto);
      setError(r.error ?? null);
      setPlaces(r.places ?? []);
      setPicked(null);
    });
  }

  return (
    <section aria-labelledby="busca-google" className="rounded-card border-2 border-text bg-surface p-4">
      <h2 id="busca-google" className="letreiro text-[1.5rem]">
        Buscar no Google
      </h2>
      <p className="mt-1 text-sm text-text-muted">Ache o lugar e os dados se preenchem sozinhos, com a foto do Google.</p>
      <div className="mt-3 flex gap-2">
        <label htmlFor="google-q" className="sr-only">
          Nome do lugar e bairro
        </label>
        <input
          id="google-q"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            // Enter aqui busca no Google (e não envia o cadastro)
            if (e.key === "Enter") {
              e.preventDefault();
              buscar();
            }
          }}
          placeholder="Ex.: Mocotó Vila Medeiros"
          className="h-12 min-w-0 flex-1 rounded-control border-2 border-border bg-bg px-3.5 text-base placeholder:text-text-muted/70 hover:border-text-muted focus-visible:border-ring focus-visible:outline-none"
        />
        <button
          type="button"
          onClick={buscar}
          disabled={pending}
          className="pressable letreiro flex h-12 shrink-0 items-center gap-1.5 rounded-control border-2 border-text bg-surface px-3.5 pt-0.5 text-lg hover:bg-surface-sunken disabled:opacity-60"
        >
          <Search aria-hidden size={18} className="-mt-0.5" />
          {pending ? "Buscando…" : "Buscar"}
        </button>
      </div>

      <div aria-live="polite">
        {error ? <p className="mt-3 text-sm font-medium text-danger">{error}</p> : null}
        {places.length ? (
          <ul className="mt-3 flex flex-col gap-1.5">
            {places.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    setPicked(p.id);
                    onPick(p);
                  }}
                  aria-pressed={picked === p.id}
                  className={`flex min-h-11 w-full flex-col items-start rounded-control border-2 px-3 py-2 text-left ${
                    picked === p.id ? "border-text bg-nav-active text-nav-active-fg" : "border-border hover:border-text-muted"
                  }`}
                >
                  <span className="font-semibold">{p.name}</span>
                  <span className="text-sm opacity-80">
                    {[p.address, p.neighborhood, p.city].filter(Boolean).join(" — ")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {picked ? <p className="mt-2 text-sm text-text-muted">Pronto: confira os dados abaixo, escolha o tipo e o preço.</p> : null}
      </div>
    </section>
  );
}
