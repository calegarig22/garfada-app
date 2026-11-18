"use client";
// Explorar: busca + botão de filtros (abre um painel) + mosaico.
// Os filtros rodam no próprio aparelho: a localização da pessoa NUNCA sai do celular.
import { useMemo, useRef, useState } from "react";
import { MapPin, Search, SlidersHorizontal, Soup, TrainFront, X } from "lucide-react";
import dynamic from "next/dynamic";
import { EmptyState } from "@/components/empty-state";
import { RestaurantCard } from "@/components/restaurant-card";
import { distanceMeters, METRO_NEAR_MINUTES, type NearStation } from "@/lib/geo";
import type { RestaurantListItem } from "@/lib/restaurants";

// O mapa só carrega no navegador (e só quando aparece)
const PinMap = dynamic(() => import("@/components/pin-map").then((m) => m.PinMap), {
  ssr: false,
  loading: () => <div className="h-[200px] w-full animate-pulse rounded-card bg-surface-sunken" />,
});

export type ExploreItem = RestaurantListItem & { station: NearStation | null };

const ORDENS = {
  nota: "Melhor nota",
  avaliados: "Mais avaliados",
  recentes: "Mais recentes",
  perto: "Mais perto de mim",
} as const;
type Ordem = keyof typeof ORDENS;
const PRECOS = [1, 2, 3, 4];
const NOTAS = [0, 3.5, 4, 4.5];
const DISTANCIAS = [1, 3, 5, 10];
const SEM_LIMITE = 51; // ponta da barra = "50+" (sem limite)

type Filtros = {
  ordem: Ordem;
  precos: number[];
  tipos: string[];
  notaMin: number;
  maxKm: number | null;
  metro: boolean;
  naoFui: boolean;
  queroIr: boolean;
};
const VAZIO: Filtros = { ordem: "nota", precos: [], tipos: [], notaMin: 0, maxKm: null, metro: false, naoFui: false, queroIr: false };

const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function ExploreClient({
  items,
  tipos,
  reviewedIds,
  queroIrIds,
}: {
  items: ExploreItem[];
  tipos: { name: string; slug: string }[];
  reviewedIds: string[];
  queroIrIds: string[];
}) {
  const [q, setQ] = useState("");
  const [f, setF] = useState<Filtros>(VAZIO);
  const [rascunho, setRascunho] = useState<Filtros>(VAZIO); // o que está no painel antes de aplicar
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locErro, setLocErro] = useState<string | null>(null);
  const [locBusy, setLocBusy] = useState(false);
  const [precisao, setPrecisao] = useState<number | null>(null); // metros
  const [ajustada, setAjustada] = useState(false); // a pessoa arrastou o pino
  const painel = useRef<HTMLDialogElement>(null);

  const reviewed = useMemo(() => new Set(reviewedIds), [reviewedIds]);
  const queroIr = useMemo(() => new Set(queroIrIds), [queroIrIds]);

  /**
   * Localização PRECISA: acompanha o GPS por até ~10 s e fica com a leitura mais exata
   * (para antes se chegar a ~25 m). No computador, sem GPS, o navegador estima pela rede.
   */
  function pedirLocalizacao(then?: (l: { lat: number; lng: number }) => void) {
    if (!("geolocation" in navigator)) {
      setLocErro("Este aparelho não informa a localização.");
      return;
    }
    setLocBusy(true);
    setLocErro(null);
    setAjustada(false);
    let melhor: GeolocationPosition | null = null;
    let avisou = false;
    const terminar = () => {
      navigator.geolocation.clearWatch(watch);
      clearTimeout(limite);
      setLocBusy(false);
      if (!melhor) return;
      const l = { lat: melhor.coords.latitude, lng: melhor.coords.longitude };
      setLoc(l);
      setPrecisao(Math.round(melhor.coords.accuracy));
      if (!avisou) {
        avisou = true;
        then?.(l);
      }
    };
    const watch = navigator.geolocation.watchPosition(
      (pos) => {
        if (!melhor || pos.coords.accuracy < melhor.coords.accuracy) melhor = pos;
        // Já mostra a primeira leitura e vai refinando
        setLoc({ lat: melhor.coords.latitude, lng: melhor.coords.longitude });
        setPrecisao(Math.round(melhor.coords.accuracy));
        if (melhor.coords.accuracy <= 25) terminar();
      },
      () => {
        navigator.geolocation.clearWatch(watch);
        clearTimeout(limite);
        setLocBusy(false);
        if (!melhor) setLocErro("Não deu para pegar sua localização. Libere a permissão no navegador e tente de novo.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
    const limite = setTimeout(terminar, 10000);
  }

  const distKm = (r: ExploreItem) =>
    loc && r.latitude != null && r.longitude != null
      ? distanceMeters(loc, { lat: r.latitude, lng: r.longitude }) / 1000
      : null;

  function aplicar(filtros: Filtros, lista: ExploreItem[]) {
    const termo = norm(q.trim());
    const out = lista.filter((r) => {
      if (termo && !norm(`${r.name} ${r.neighborhood ?? ""} ${r.cuisine ?? ""}`).includes(termo)) return false;
      if (filtros.precos.length && !filtros.precos.includes(r.priceLevel ?? 0)) return false;
      if (filtros.tipos.length && !filtros.tipos.includes(r.cuisineSlug ?? "")) return false;
      if (filtros.notaMin && (r.ratingAvg ?? 0) < filtros.notaMin) return false;
      if (filtros.metro && !(r.station && r.station.minutes <= METRO_NEAR_MINUTES)) return false;
      if (filtros.naoFui && reviewed.has(r.id)) return false;
      if (filtros.queroIr && !queroIr.has(r.id)) return false;
      if (filtros.maxKm != null) {
        const d = distKm(r);
        if (d == null || d > filtros.maxKm) return false;
      }
      return true;
    });
    const by = {
      nota: (a: ExploreItem, b: ExploreItem) => (b.ratingAvg ?? -1) - (a.ratingAvg ?? -1) || b.ratingCount - a.ratingCount,
      avaliados: (a: ExploreItem, b: ExploreItem) => b.ratingCount - a.ratingCount || (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0),
      recentes: (a: ExploreItem, b: ExploreItem) => +new Date(b.createdAt) - +new Date(a.createdAt),
      perto: (a: ExploreItem, b: ExploreItem) => (distKm(a) ?? 1e9) - (distKm(b) ?? 1e9),
    }[filtros.ordem];
    return [...out].sort(by);
  }

  const lista = aplicar(f, items);
  const previa = aplicar(rascunho, items).length; // quantos ficariam com o que está no painel
  const ativos =
    f.precos.length + f.tipos.length + (f.notaMin ? 1 : 0) + (f.maxKm != null ? 1 : 0) + (f.metro ? 1 : 0) + (f.naoFui ? 1 : 0) + (f.queroIr ? 1 : 0);

  const abrir = () => {
    setRascunho(f);
    painel.current?.showModal();
  };
  const fechar = () => painel.current?.close();

  // Pílulas dos filtros ativos (tocar tira o filtro)
  const pilulas: { label: string; tirar: () => void }[] = [
    ...f.precos.map((p) => ({ label: "$".repeat(p), tirar: () => setF((x) => ({ ...x, precos: toggle(x.precos, p) })) })),
    ...f.tipos.map((t) => ({
      label: tipos.find((x) => x.slug === t)?.name ?? t,
      tirar: () => setF((x) => ({ ...x, tipos: toggle(x.tipos, t) })),
    })),
    ...(f.notaMin ? [{ label: `${f.notaMin.toLocaleString("pt-BR")}★ ou mais`, tirar: () => setF((x) => ({ ...x, notaMin: 0 })) }] : []),
    ...(f.maxKm != null ? [{ label: `Até ${f.maxKm} km de você`, tirar: () => setF((x) => ({ ...x, maxKm: null })) }] : []),
    ...(f.metro ? [{ label: "Perto do metrô", tirar: () => setF((x) => ({ ...x, metro: false })) }] : []),
    ...(f.naoFui ? [{ label: "Ainda não fui", tirar: () => setF((x) => ({ ...x, naoFui: false })) }] : []),
    ...(f.queroIr ? [{ label: "No meu Quero ir", tirar: () => setF((x) => ({ ...x, queroIr: false })) }] : []),
  ];

  return (
    <>
      <div className="px-4 pt-4">
        {/* Busca + botão de filtros */}
        <div className="flex gap-2" role="search">
          <label htmlFor="busca" className="sr-only">
            Buscar por nome, bairro ou tipo de comida
          </label>
          <div className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-control border-2 border-border bg-surface px-3 focus-within:border-ring hover:border-text-muted">
            <Search aria-hidden size={18} className="text-text-muted" />
            <input
              id="busca"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nome, bairro ou comida"
              className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-text-muted/70"
            />
          </div>
          <button
            type="button"
            onClick={abrir}
            aria-label={ativos ? `Filtros (${ativos} ativos)` : "Filtros"}
            className="pressable relative flex h-12 shrink-0 items-center gap-2 rounded-control border-2 border-text bg-surface px-3.5 font-semibold hover:bg-surface-sunken"
          >
            <SlidersHorizontal aria-hidden size={20} />
            <span className="hidden sm:inline">Filtros</span>
            {ativos ? (
              <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-fg">
                {ativos}
              </span>
            ) : null}
          </button>
        </div>

        {/* Filtros ativos + ordem + contagem */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {pilulas.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={p.tirar}
              aria-label={`Tirar filtro ${p.label}`}
              className="pressable inline-flex h-9 items-center gap-1.5 rounded-full bg-text px-3 text-sm font-semibold text-bg"
            >
              {p.label}
              <X aria-hidden size={14} />
            </button>
          ))}
          {pilulas.length ? (
            <button type="button" onClick={() => setF((x) => ({ ...VAZIO, ordem: x.ordem }))} className="h-9 px-2 text-sm font-semibold underline underline-offset-4">
              Limpar
            </button>
          ) : null}
        </div>
        <p className="mt-2 border-b-2 border-dashed border-border pb-3 text-sm text-text-muted" aria-live="polite">
          {lista.length === 1 ? "1 lugar" : `${lista.length} lugares`} · {ORDENS[f.ordem].toLowerCase()}
        </p>
      </div>

      {lista.length ? (
        <div className="columns-2 gap-4 px-4 pt-5 md:columns-3 xl:columns-4">
          {lista.map((r) => (
            <RestaurantCard key={r.id} r={r} station={r.station} distanceKm={distKm(r)} />
          ))}
        </div>
      ) : (
        <EmptyState Icon={Soup} title="Nada encontrado">
          Tire algum filtro ou busque outro nome. Se o lugar não está no app, cadastre pelo botão Novo lugar.
        </EmptyState>
      )}

      {/* Painel de filtros: sobe de baixo no celular, abre à direita no computador */}
      <dialog
        ref={painel}
        aria-labelledby="titulo-filtros"
        onClick={(e) => e.target === e.currentTarget && fechar()}
        className="m-0 mt-auto max-h-[88dvh] w-full max-w-none rounded-t-card border-2 border-b-0 border-text bg-bg p-0 text-text backdrop:bg-text/60 sm:m-auto sm:mr-0 sm:h-dvh sm:max-h-dvh sm:w-[26rem] sm:rounded-none sm:rounded-l-card sm:border-b-2"
      >
        <div className="flex h-full max-h-[88dvh] flex-col sm:max-h-dvh">
          <header className="flex items-center justify-between border-b-2 border-text px-4 py-3">
            <h2 id="titulo-filtros" className="letreiro pt-1 text-[2rem] leading-none">
              Filtros
            </h2>
            <button type="button" onClick={fechar} aria-label="Fechar filtros" className="flex size-11 items-center justify-center rounded-control hover:bg-surface-sunken">
              <X aria-hidden size={22} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <Secao titulo="Ordenar por">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(ORDENS) as Ordem[]).map((o) => (
                  <Opcao
                    key={o}
                    tipo="radio"
                    ativo={rascunho.ordem === o}
                    onClick={() => {
                      if (o === "perto" && !loc) pedirLocalizacao(() => setRascunho((x) => ({ ...x, ordem: "perto" })));
                      else setRascunho((x) => ({ ...x, ordem: o }));
                    }}
                  >
                    {o === "perto" ? <MapPin aria-hidden size={14} /> : null}
                    {ORDENS[o]}
                  </Opcao>
                ))}
              </div>
            </Secao>

            <Secao titulo="Preço">
              <div className="grid grid-cols-4 gap-2">
                {PRECOS.map((p) => (
                  <Opcao key={p} ativo={rascunho.precos.includes(p)} onClick={() => setRascunho((x) => ({ ...x, precos: toggle(x.precos, p) }))}>
                    {"$".repeat(p)}
                  </Opcao>
                ))}
              </div>
            </Secao>

            <Secao titulo="Tipo de comida">
              <div className="flex flex-wrap gap-2">
                {tipos.map((t) => (
                  <Opcao key={t.slug} ativo={rascunho.tipos.includes(t.slug)} onClick={() => setRascunho((x) => ({ ...x, tipos: toggle(x.tipos, t.slug) }))}>
                    {t.name}
                  </Opcao>
                ))}
              </div>
            </Secao>

            <Secao titulo="Nota mínima">
              <div className="grid grid-cols-4 gap-2">
                {NOTAS.map((n) => (
                  <Opcao key={n} tipo="radio" ativo={rascunho.notaMin === n} onClick={() => setRascunho((x) => ({ ...x, notaMin: n }))}>
                    {n ? `${n.toLocaleString("pt-BR")}★+` : "Qualquer"}
                  </Opcao>
                ))}
              </div>
            </Secao>

            <Secao titulo="Distância de você">
              {/* Barra de 1 a 50 km; na ponta direita, "50+" = sem limite */}
              <div className="flex items-baseline justify-between">
                <label htmlFor="distancia" className="text-sm text-text-muted">
                  {loc ? "Mostrar lugares" : "Libere sua localização para usar"}
                </label>
                <output htmlFor="distancia" className="letreiro pt-1 text-[1.5rem] leading-none tabular-nums">
                  {rascunho.maxKm == null ? "Sem limite" : `até ${rascunho.maxKm} km`}
                </output>
              </div>
              <input
                id="distancia"
                type="range"
                min={1}
                max={SEM_LIMITE}
                step={1}
                disabled={!loc}
                value={rascunho.maxKm ?? SEM_LIMITE}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setRascunho((x) => ({ ...x, maxKm: v >= SEM_LIMITE ? null : v }));
                }}
                aria-valuetext={rascunho.maxKm == null ? "sem limite" : `até ${rascunho.maxKm} quilômetros`}
                className="mt-2 h-11 w-full cursor-pointer accent-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-40"
              />
              {loc ? (
                <div className="mb-3 mt-1">
                  <PinMap
                    value={loc}
                    accuracy={ajustada ? null : precisao}
                    onChange={(p) => {
                      setLoc(p);
                      setAjustada(true);
                    }}
                  />
                  <p className="mt-1 text-xs text-text-muted">
                    {ajustada
                      ? "Posição ajustada por você."
                      : "O pino está no lugar errado? Arraste até onde você está (ou toque no mapa)."}
                  </p>
                </div>
              ) : null}
              <div aria-hidden className="flex justify-between text-xs tabular-nums text-text-muted">
                <span>1</span>
                <span>10</span>
                <span>20</span>
                <span>30</span>
                <span>40</span>
                <span>50+</span>
              </div>
              {loc ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => pedirLocalizacao()}
                    disabled={locBusy}
                    aria-label="Atualizar minha localização"
                    className="pressable inline-flex min-h-11 items-center gap-1.5 rounded-control border-2 border-border bg-surface px-3 text-sm font-semibold hover:border-text-muted disabled:opacity-60"
                  >
                    <MapPin aria-hidden size={14} />
                    {locBusy ? "Localizando…" : "Atualizar"}
                  </button>
                  {DISTANCIAS.map((d) => (
                    <Opcao key={d} tipo="radio" ativo={rascunho.maxKm === d} onClick={() => setRascunho((x) => ({ ...x, maxKm: d }))}>
                      {d} km
                    </Opcao>
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => pedirLocalizacao(() => setRascunho((x) => ({ ...x, maxKm: x.maxKm ?? 10 })))}
                  disabled={locBusy}
                  className="pressable mt-3 inline-flex h-11 items-center gap-2 rounded-control border-2 border-text bg-surface px-3.5 font-semibold hover:bg-surface-sunken disabled:opacity-60"
                >
                  <MapPin aria-hidden size={18} />
                  {locBusy ? "Pegando localização…" : "Usar minha localização"}
                </button>
              )}
              <p className="mt-2 flex items-center gap-1 text-xs text-text-muted">
                {locErro ?? (
                  <>
                    <MapPin aria-hidden size={12} />
                    {loc
                      ? `Usando sua localização${precisao ? ` (precisão de ~${precisao >= 1000 ? `${(precisao / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km` : `${precisao} m`})` : ""}${locBusy ? ", refinando…" : ""} · distâncias em linha reta · `
                      : ""}
                    fica só neste aparelho; o Garfada não guarda nem envia.
                  </>
                )}
              </p>
            </Secao>

            <Secao titulo="Transporte">
              <Opcao ativo={rascunho.metro} onClick={() => setRascunho((x) => ({ ...x, metro: !x.metro }))}>
                <TrainFront aria-hidden size={16} />
                Perto do metrô ou trem (até {METRO_NEAR_MINUTES} min a pé)
              </Opcao>
              <p className="mt-2 text-xs text-text-muted">Estações: © colaboradores do OpenStreetMap.</p>
            </Secao>

            <Secao titulo="Mais">
              <div className="flex flex-wrap gap-2">
                <Opcao ativo={rascunho.naoFui} onClick={() => setRascunho((x) => ({ ...x, naoFui: !x.naoFui }))}>
                  Ainda não fui
                </Opcao>
                <Opcao ativo={rascunho.queroIr} onClick={() => setRascunho((x) => ({ ...x, queroIr: !x.queroIr }))}>
                  No meu Quero ir
                </Opcao>
              </div>
            </Secao>
          </div>

          <footer
            className="flex gap-3 border-t-2 border-text px-4 pt-3"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.75rem)" }}
          >
            <button
              type="button"
              onClick={() => setRascunho((x) => ({ ...VAZIO, ordem: x.ordem }))}
              className="h-12 px-3 font-semibold underline underline-offset-4"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => {
                setF(rascunho);
                fechar();
              }}
              className="pressable letreiro h-12 flex-1 rounded-control bg-primary pt-0.5 text-[1.375rem] text-primary-fg shadow-[0_3px_0_var(--text)]"
            >
              {previa === 1 ? "Ver 1 lugar" : `Ver ${previa} lugares`}
            </button>
          </footer>
        </div>
      </dialog>
    </>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b border-border py-4 last:border-b-0">
      <legend className="letreiro float-left mb-2 w-full pt-1 text-[1.25rem] leading-none">{titulo}</legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

function Opcao({
  ativo,
  onClick,
  children,
  tipo = "checkbox",
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tipo?: "checkbox" | "radio";
}) {
  return (
    <button
      type="button"
      role={tipo}
      aria-checked={ativo}
      onClick={onClick}
      className={`pressable inline-flex min-h-11 items-center justify-center gap-1.5 rounded-control border-2 px-3 text-sm font-semibold ${
        ativo ? "border-text bg-text text-bg" : "border-border bg-surface text-text hover:border-text-muted"
      }`}
    >
      {children}
    </button>
  );
}
