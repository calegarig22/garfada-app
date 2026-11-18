import { notFound } from "next/navigation";
import { BackHeader } from "@/components/back-header";
import { getRestaurant } from "@/lib/restaurants";
import { requireAdmin } from "@/lib/session";
import { FixPin } from "./fix-pin";

export const metadata = { title: "Corrigir pino" };

export default async function CorrigirPinoPage({ params }: PageProps<"/admin/pinos/[id]">) {
  await requireAdmin();
  const r = await getRestaurant((await params).id);
  if (!r) notFound();
  // Sem posição ainda: começa no centro de São Paulo (Praça da Sé)
  const inicio = { lat: r.latitude ?? -23.5503, lng: r.longitude ?? -46.6342 };

  return (
    <>
      <BackHeader href="/admin/pinos" title={`Pino: ${r.name}`} />
      <div className="px-4 pt-4 lg:max-w-2xl">
        <p className="font-semibold">{[r.address, r.neighborhood, r.city].filter(Boolean).join(" — ")}</p>
        <p className="mt-1 text-sm text-text-muted">Arraste o pino (ou toque no mapa) até a porta do lugar e salve.</p>
        <div className="mt-4">
          <FixPin restaurantId={r.id} inicio={inicio} />
        </div>
      </div>
    </>
  );
}
