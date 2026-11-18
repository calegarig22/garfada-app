import { notFound } from "next/navigation";
import { BackHeader } from "@/components/back-header";
import Link from "next/link";
import { listUnits } from "@/lib/brands";
import { getRestaurant } from "@/lib/restaurants";
import { photosEnabled } from "@/lib/storage";
import { ReviewForm } from "./review-form";

export const metadata = { title: "Avaliar" };

export default async function AvaliarPage({ params, searchParams }: PageProps<"/restaurantes/[id]/avaliar">) {
  const { id } = await params;
  const jaExistia = (await searchParams).ja === "1";
  const r = await getRestaurant(id);
  if (!r) notFound();
  const units = r.brandId ? await listUnits(r.brandId) : [];

  return (
    <>
      <BackHeader href={`/restaurantes/${r.id}`} title={units.length > 1 && r.neighborhood ? `Avaliar ${r.name} · ${r.neighborhood}` : `Avaliar ${r.name}`} />
      <div className="px-4 pt-5 lg:max-w-xl">
        {jaExistia ? (
          <p role="status" className="mb-5 border-l-4 border-tag bg-surface-sunken p-4">
            <strong>{r.name}</strong> já estava no Garfada, então não criamos outro igual. É só dar sua nota aqui.
          </p>
        ) : null}
        {units.length > 1 ? (
          <fieldset className="mb-6">
            <legend className="mb-2 text-sm font-semibold">Qual unidade você foi?</legend>
            <ul className="flex flex-col gap-1.5">
              {units.map((u) => {
                const atual = u.id === r.id;
                return (
                  <li key={u.id}>
                    <Link
                      href={`/restaurantes/${u.id}/avaliar`}
                      aria-current={atual ? "true" : undefined}
                      className={`flex min-h-12 items-center gap-3 rounded-control border-2 px-3 py-2 ${
                        atual ? "border-text bg-text text-bg" : "border-border bg-surface hover:border-text-muted"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`size-5 shrink-0 rounded-full border-2 ${atual ? "border-bg bg-bg ring-4 ring-text ring-inset" : "border-text"}`}
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{u.neighborhood ?? "Unidade"}</span>
                        {u.address ? <span className="block truncate text-xs opacity-80">{u.address}</span> : null}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-xs text-text-muted">Sua nota vale só para a unidade escolhida.</p>
          </fieldset>
        ) : null}
        <ReviewForm restaurantId={r.id} photosEnabled={photosEnabled} />
      </div>
    </>
  );
}
