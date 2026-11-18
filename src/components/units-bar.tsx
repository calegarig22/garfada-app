// Rede com várias unidades: nota da rede + escolha da unidade (cada uma com a própria nota).
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Unit } from "@/lib/brands";
import { NotaPlaquinha } from "./plaquinha";

export function UnitsBar({
  currentId,
  brandName,
  units,
  brandAvg,
  brandCount,
}: {
  currentId: string;
  brandName: string;
  units: Unit[];
  brandAvg: number | null;
  brandCount: number;
}) {
  return (
    <section aria-labelledby="titulo-unidades" className="mt-5 rounded-card border-2 border-text bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 id="titulo-unidades" className="letreiro pt-1 text-[1.375rem] leading-none">
            Rede {brandName}
          </h3>
          <p className="mt-1 text-sm text-text-muted">
            {units.length} unidades ·{" "}
            {brandCount
              ? `nota da rede com ${brandCount === 1 ? "1 avaliação" : `${brandCount} avaliações`}`
              : "ninguém avaliou ainda"}
          </p>
        </div>
        {brandAvg != null ? <NotaPlaquinha nota={brandAvg * 2} className="shrink-0 text-xl" /> : null}
      </div>

      <p className="mt-4 text-sm font-semibold">Escolha a unidade:</p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {units.map((u) => {
          const atual = u.id === currentId;
          return (
            <li key={u.id}>
              <Link
                href={`/restaurantes/${u.id}`}
                aria-current={atual ? "page" : undefined}
                className={`flex min-h-12 items-center justify-between gap-3 rounded-control border-2 px-3 py-2 ${
                  atual ? "border-text bg-text text-bg" : "border-border hover:border-text-muted"
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold">
                    {u.neighborhood ?? "Unidade"} {atual ? "· você está aqui" : ""}
                  </span>
                  {u.address ? <span className="block truncate text-xs opacity-80">{u.address}</span> : null}
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {u.ratingCount && u.ratingAvg != null
                    ? `${u.ratingAvg.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}★ (${u.ratingCount})`
                    : "sem nota"}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <Link
        href={`/restaurantes/novo?unidadeDe=${currentId}`}
        className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold underline decoration-primary decoration-2 underline-offset-4"
      >
        <Plus aria-hidden size={16} /> Cadastrar outra unidade
      </Link>
    </section>
  );
}
