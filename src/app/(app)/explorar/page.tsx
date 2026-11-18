import Link from "next/link";
import { eq } from "drizzle-orm";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import { collectionItems, collections, reviews } from "@/db/schema";
import { nearestStation } from "@/lib/geo";
import { listRestaurants, listUsedCuisines } from "@/lib/restaurants";
import { requireUser } from "@/lib/session";
import { ExploreClient } from "./explore-client";

export const metadata = { title: "Explorar" };

export default async function ExplorarPage() {
  const me = await requireUser();
  const [lista, tipos, avaliados, salvos] = await Promise.all([
    listRestaurants({}),
    listUsedCuisines(),
    // lugares que eu já avaliei (filtro "Ainda não fui")
    db.selectDistinct({ id: reviews.restaurantId }).from(reviews).where(eq(reviews.userId, me.id)),
    // lugares em qualquer lista minha (filtro "No meu Quero ir")
    db
      .selectDistinct({ id: collectionItems.restaurantId })
      .from(collectionItems)
      .innerJoin(collections, eq(collections.id, collectionItems.collectionId))
      .where(eq(collections.ownerId, me.id)),
  ]);
  // Estação de metrô/trem mais próxima: calculada aqui, uma vez por lugar.
  const items = lista.map((r) => ({ ...r, station: nearestStation(r.latitude, r.longitude) }));

  return (
    <>
      <PageHeader
        title="Explorar"
        actions={
          <Link
            href="/restaurantes/novo"
            className="pressable letreiro flex h-11 items-center gap-1.5 rounded-control bg-primary px-3.5 pt-0.5 text-lg text-primary-fg shadow-[0_3px_0_var(--text)] active:shadow-[0_1px_0_var(--text)] lg:hidden"
          >
            <Plus aria-hidden size={18} strokeWidth={2.5} className="-mt-0.5" />
            Novo lugar
          </Link>
        }
      />
      <ExploreClient
        items={items}
        tipos={tipos}
        reviewedIds={avaliados.map((a) => a.id)}
        queroIrIds={salvos.flatMap((s) => (s.id ? [s.id] : []))}
      />
    </>
  );
}
