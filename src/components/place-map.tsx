// Mapa do lugar (Google Maps embutido, sem chave de API) + atalhos de rota.
import { MapPin, Navigation } from "lucide-react";

export function PlaceMap({
  name,
  address,
  neighborhood,
  city,
  placeId,
}: {
  name: string;
  address: string | null;
  neighborhood: string | null;
  city: string;
  placeId?: string | null;
}) {
  const query = [name, address, neighborhood, city].filter(Boolean).join(", ");
  const q = encodeURIComponent(query);
  // Com o código do Google, os links abrem exatamente o lugar certo (não só o endereço).
  const pid = placeId ? encodeURIComponent(placeId) : null;
  const links = {
    embed: `https://www.google.com/maps?q=${q}&z=16&output=embed`,
    abrir: `https://www.google.com/maps/search/?api=1&query=${q}${pid ? `&query_place_id=${pid}` : ""}`,
    rota: `https://www.google.com/maps/dir/?api=1&destination=${q}${pid ? `&destination_place_id=${pid}` : ""}`,
    waze: `https://waze.com/ul?q=${q}&navigate=yes`,
  };
  const linkClass =
    "pressable letreiro flex h-12 flex-1 items-center justify-center gap-2 rounded-control border-2 border-text bg-surface pt-0.5 text-lg hover:bg-surface-sunken";

  return (
    <section aria-label="Onde fica" className="overflow-hidden rounded-card border-2 border-text bg-surface">
      <iframe
        title={`Mapa: ${name}`}
        src={links.embed}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="block aspect-[4/3] w-full border-0 border-b-2 border-text bg-surface-sunken"
      />
      <div className="p-3">
        <a
          href={links.abrir}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 items-start gap-2 hover:text-primary"
        >
          <MapPin aria-hidden size={20} className="mt-0.5 shrink-0" />
          <span className="text-sm leading-snug">{[address, neighborhood, city].filter(Boolean).join(" — ")}</span>
        </a>
        <div className="mt-2 flex gap-2">
          <a href={links.rota} target="_blank" rel="noopener noreferrer" className={linkClass}>
            <Navigation aria-hidden size={18} className="-mt-0.5" />
            Como chegar
          </a>
          <a href={links.waze} target="_blank" rel="noopener noreferrer" className={linkClass}>
            Waze
          </a>
        </div>
      </div>
    </section>
  );
}
