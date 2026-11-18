// Capa de uma lista (como no rascunho de Salvos): 1 foto grande + 2 pequenas,
// nome, quantidade de lugares e cadeado se for privada.
import Link from "next/link";
import { Bookmark, Lock } from "lucide-react";
import type { CollectionSummary } from "@/lib/lists";
import type { RestaurantListItem } from "@/lib/restaurants";

function Tile({ r, className = "" }: { r?: RestaurantListItem; className?: string }) {
  if (!r) return <span className={`block bg-surface-sunken ${className}`} />;
  if (r.cover) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={r.cover.url} alt="" loading="lazy" className={`block h-full w-full object-cover ${className}`} />;
  }
  return <span className={`block bg-accent ${className}`} />;
}

const quando = (d: Date) => {
  const dias = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (dias < 1) return "hoje";
  if (dias < 7) return `${dias} d`;
  if (dias < 60) return `${Math.floor(dias / 7)} sem`;
  return `${Math.floor(dias / 30)} m`;
};

export function CollectionCard({ c }: { c: CollectionSummary }) {
  const [a, b, d] = c.covers;
  return (
    <Link href={`/listas/${c.id}`} className="group block">
      <div className="relative grid aspect-[4/3] grid-cols-[2fr_1fr] grid-rows-2 gap-0.5 overflow-hidden rounded-card border-2 border-text bg-text">
        <span className="row-span-2 overflow-hidden">
          <Tile r={a} className="transition-transform duration-300 group-hover:scale-105" />
        </span>
        <span className="overflow-hidden">
          <Tile r={b} />
        </span>
        <span className="overflow-hidden">
          <Tile r={d} />
        </span>
        {c.count === 0 ? (
          <span className="absolute inset-0 flex items-center justify-center bg-surface-sunken text-text-muted">
            <Bookmark aria-hidden size={28} />
          </span>
        ) : null}
        {c.isPrivate ? (
          <span className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-text text-bg" aria-label="Lista privada">
            <Lock aria-hidden size={14} />
          </span>
        ) : null}
      </div>
      <p className="letreiro mt-2 truncate pt-0.5 text-[1.375rem] leading-none group-hover:text-primary">{c.name}</p>
      <p className="mt-1 text-sm text-text-muted">
        {c.count === 1 ? "1 lugar" : `${c.count} lugares`} · {quando(c.updatedAt)}
      </p>
    </Link>
  );
}
