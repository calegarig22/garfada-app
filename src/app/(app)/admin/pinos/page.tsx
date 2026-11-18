import Link from "next/link";
import { desc, isNull, sql, eq } from "drizzle-orm";
import { MapPin } from "lucide-react";
import { BackHeader } from "@/components/back-header";
import { EmptyState } from "@/components/empty-state";
import { db } from "@/db";
import { placeReports, restaurants } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { descartarAvisos } from "../actions";

export const metadata = { title: "Pinos para corrigir" };

export default async function AdminPinosPage({ searchParams }: PageProps<"/admin/pinos">) {
  await requireAdmin();
  const salvo = (await searchParams).salvo === "1";
  const avisos = await db
    .select({
      restaurantId: placeReports.restaurantId,
      name: restaurants.name,
      neighborhood: restaurants.neighborhood,
      address: restaurants.address,
      count: sql<number>`count(*)::int`,
      notes: sql<string[]>`array_remove(array_agg(${placeReports.note}), null)`,
      last: sql<Date>`max(${placeReports.createdAt})`,
    })
    .from(placeReports)
    .innerJoin(restaurants, eq(restaurants.id, placeReports.restaurantId))
    .where(isNull(placeReports.resolvedAt))
    .groupBy(placeReports.restaurantId, restaurants.name, restaurants.neighborhood, restaurants.address)
    .orderBy(desc(sql`max(${placeReports.createdAt})`));

  return (
    <>
      <BackHeader href="/perfil" title="Pinos para corrigir" />
      <div className="px-4 pt-4 lg:max-w-2xl">
        <p className="text-sm text-text-muted">
          Avisos de “o pino está no lugar errado”. Abra, arraste o pino até o lugar certo e salve. Só a sua conta vê esta
          tela.
        </p>
        {salvo ? (
          <p role="status" className="mt-3 border-l-4 border-accent bg-surface-sunken p-3 text-sm font-semibold">
            Pino salvo.
          </p>
        ) : null}
        {avisos.length === 0 ? (
          <EmptyState Icon={MapPin} title="Nenhum aviso">
            Quando alguém avisar que um pino está errado, ele aparece aqui. Você também pode corrigir qualquer lugar pelo
            link “Corrigir pino” na página dele.
          </EmptyState>
        ) : (
          <ul className="mt-4 flex flex-col">
            {avisos.map((a) => (
              <li key={a.restaurantId} className="flex items-center gap-3 border-b border-border py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {a.name}
                    {a.neighborhood ? ` · ${a.neighborhood}` : ""}
                  </p>
                  <p className="truncate text-sm text-text-muted">
                    {a.count === 1 ? "1 aviso" : `${a.count} avisos`}
                    {a.notes[0] ? ` — “${a.notes[0]}”` : ""}
                  </p>
                </div>
                <form action={descartarAvisos.bind(null, a.restaurantId)}>
                  <button type="submit" className="h-11 px-2 text-sm font-semibold text-text-muted underline underline-offset-4">
                    Estava certo
                  </button>
                </form>
                <Link
                  href={`/admin/pinos/${a.restaurantId}`}
                  className="pressable letreiro inline-flex h-11 items-center rounded-control bg-primary px-3 pt-0.5 text-lg text-primary-fg"
                >
                  Corrigir
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
