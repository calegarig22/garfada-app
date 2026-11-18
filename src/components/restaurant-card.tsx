import Link from "next/link";
import { TrainFront } from "lucide-react";
import type { NearStation } from "@/lib/geo";
import type { PhotoWithUrl, RestaurantListItem } from "@/lib/restaurants";
import { priceLabel } from "@/lib/format";
import { Ladrilho } from "./ladrilho";
import { NotaPlaquinha } from "./plaquinha";

/** Proporções para lugares sem foto: variam para o mosaico não ficar uma grade reta. */
const ASPECTS = ["1 / 1", "4 / 3", "5 / 6", "3 / 2"];
/** Cores das placas sem foto: azulejos de cores diferentes, como parede de boteco. */
const TILES = ["bg-accent text-accent-fg", "bg-primary text-primary-fg", "bg-text text-bg"];
const hash = (id: string) => [...id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const aspectFor = (id: string) => ASPECTS[hash(id) % ASPECTS.length];
const tileFor = (id: string) => TILES[(hash(id) >>> 3) % TILES.length];

/** Capa: a foto, ou uma placa verde com ladrilho e o tipo de comida. */
export function Cover({
  photo,
  label,
  id,
  className = "",
  sizes = "card",
}: {
  photo: PhotoWithUrl | null;
  label: string;
  id: string;
  className?: string;
  sizes?: "card" | "hero";
}) {
  if (photo) {
    return (
      <div className="relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt=""
          width={photo.width}
          height={photo.height}
          loading={sizes === "hero" ? "eager" : "lazy"}
          // Fotos em pé não passam de 4:5 no cartão (senão o cartão fica alto demais).
          style={sizes === "card" ? { aspectRatio: `${Math.max(photo.width / photo.height, 0.8)}` } : undefined}
          className={`block h-auto w-full bg-surface-sunken object-cover ${className}`}
        />
        {/* Crédito obrigatório de fotos de uso livre */}
        {photo.credit ? (
          <span className="absolute bottom-0 left-0 max-w-full truncate bg-text/70 px-1.5 py-0.5 text-[10px] text-bg">
            {photo.credit}
          </span>
        ) : null}
      </div>
    );
  }
  return (
    <div
      aria-hidden
      className={`relative flex items-end overflow-hidden p-3 ${sizes === "hero" ? "bg-accent text-accent-fg" : tileFor(id)} ${className}`}
      style={{ aspectRatio: sizes === "hero" ? "16 / 9" : aspectFor(id) }}
    >
      <Ladrilho className="opacity-[0.14]" />
      <span className={`letreiro relative min-w-0 break-words opacity-80 ${sizes === "hero" ? "text-[2.75rem]" : "text-[1.625rem] sm:text-[2.25rem]"}`}>
        {label}
      </span>
    </div>
  );
}

export function RestaurantCard({
  r,
  station,
  distanceKm,
}: {
  r: RestaurantListItem;
  /** estação de metrô/trem mais próxima */
  station?: NearStation | null;
  /** distância de quem está usando (só se a pessoa liberou a localização) */
  distanceKm?: number | null;
}) {
  const price = priceLabel(r.priceLevel);
  return (
    <Link
      href={`/restaurantes/${r.id}`}
      className="group relative mb-4 block break-inside-avoid overflow-hidden rounded-card border-2 border-text bg-surface"
    >
      <Cover photo={r.cover} label={r.cuisine ?? "Restaurante"} id={r.id} className="transition-transform duration-300 group-hover:scale-[1.02]" />
      {r.ratingCount > 0 && r.ratingAvg != null ? (
        <NotaPlaquinha nota={r.ratingAvg * 2} className="absolute right-2 top-2 text-xl" />
      ) : null}
      <div className="border-t-2 border-text p-3">
        <h2 className="letreiro text-[1.625rem] group-hover:text-primary">{r.name}</h2>
        <p className="mt-1.5 text-sm text-text-muted">
          {[r.neighborhood, r.cuisine].filter(Boolean).join(" · ")}
          {price ? <span className="ml-1.5 font-semibold text-text">{price}</span> : null}
        </p>
        {r.otherUnits > 0 ? (
          <p className="mt-1 text-xs font-semibold text-primary">
            + {r.otherUnits === 1 ? "1 unidade" : `${r.otherUnits} unidades`}
          </p>
        ) : null}
        {station && station.minutes <= 20 ? (
          <p className="mt-1 flex items-center gap-1 text-xs text-text-muted">
            <TrainFront aria-hidden size={13} className="shrink-0" />
            <span className="truncate">
              {station.name} · {station.minutes} min a pé
            </span>
          </p>
        ) : null}
        {distanceKm != null ? (
          <p className="mt-0.5 text-xs font-semibold">
            {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m de você` : `${distanceKm.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km de você`}
          </p>
        ) : null}
        {r.ratingCount === 0 ? <p className="mt-1 text-xs font-medium text-text-muted">Sem nota ainda</p> : null}
      </div>
    </Link>
  );
}
