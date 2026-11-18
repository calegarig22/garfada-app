// Google Places API (New): buscar lugares e pegar a foto principal.
// Regras do Google: podemos guardar o "place id" para sempre; as fotos NÃO
// podem ser guardadas — são pedidas na hora e mostradas com o crédito do autor.
// Sem GOOGLE_PLACES_API_KEY, tudo isto fica desligado.
import "server-only";
import { cache } from "react";

const KEY = (process.env.GOOGLE_PLACES_API_KEY ?? "").replace(/\s+/g, "").replace(/^(['"])(.*)\1$/, "$2");
export const googleEnabled = KEY.length > 0;

const BASE = "https://places.googleapis.com/v1";

export type GooglePlace = {
  id: string;
  name: string;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
};

type AddressComponent = { longText: string; shortText: string; types: string[] };

function parseAddress(components: AddressComponent[] = []) {
  const get = (type: string) => components.find((c) => c.types.includes(type));
  const route = get("route")?.shortText;
  const number = get("street_number")?.longText;
  return {
    address: route ? (number ? `${route}, ${number}` : route) : null,
    neighborhood: (get("sublocality_level_1") ?? get("sublocality") ?? get("neighborhood"))?.longText ?? null,
    city: (get("administrative_area_level_2") ?? get("locality"))?.longText ?? null,
  };
}

/** Busca por texto ("mocotó são paulo"). Devolve até 5 lugares. */
export async function searchPlaces(text: string): Promise<GooglePlace[]> {
  if (!googleEnabled) return [];
  const res = await fetch(`${BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": KEY,
      "X-Goog-FieldMask": "places.id,places.displayName,places.addressComponents",
    },
    body: JSON.stringify({ textQuery: text, languageCode: "pt-BR", regionCode: "BR", pageSize: 5 }),
    cache: "no-store",
  });
  if (!res.ok) {
    console.error(`[google] busca falhou: ${res.status}`);
    return [];
  }
  const data = (await res.json()) as {
    places?: { id: string; displayName?: { text: string }; addressComponents?: AddressComponent[] }[];
  };
  return (data.places ?? []).map((p) => ({
    id: p.id,
    name: p.displayName?.text ?? "Sem nome",
    ...parseAddress(p.addressComponents),
  }));
}

export type GooglePhoto = { url: string; width: number; height: number; credit: string; creditUrl: string | null };

/**
 * Foto principal do lugar no Google (pedida na hora, não fica guardada).
 * `cache` do React: no máximo 1 pedido por lugar a cada carregamento de página.
 */
export const getPlacePhoto = cache(async (placeId: string): Promise<GooglePhoto | null> => {
  if (!googleEnabled || !/^[A-Za-z0-9_-]+$/.test(placeId)) return null;
  try {
    const details = await fetch(`${BASE}/places/${placeId}`, {
      headers: { "X-Goog-Api-Key": KEY, "X-Goog-FieldMask": "photos" },
      cache: "no-store",
    });
    if (!details.ok) return null;
    const { photos } = (await details.json()) as {
      photos?: {
        name: string;
        widthPx: number;
        heightPx: number;
        authorAttributions?: { displayName: string; uri?: string }[];
      }[];
    };
    const photo = photos?.[0];
    if (!photo) return null;

    const media = await fetch(`${BASE}/${photo.name}/media?maxWidthPx=1280&skipHttpRedirect=true`, {
      headers: { "X-Goog-Api-Key": KEY },
      cache: "no-store",
    });
    if (!media.ok) return null;
    const { photoUri } = (await media.json()) as { photoUri?: string };
    if (!photoUri) return null;

    const scale = Math.min(1, 1280 / photo.widthPx);
    const author = photo.authorAttributions?.[0];
    return {
      url: photoUri,
      width: Math.round(photo.widthPx * scale),
      height: Math.round(photo.heightPx * scale),
      credit: `Foto: ${author?.displayName ?? "colaborador"} · Google`,
      creditUrl: author?.uri ?? null,
    };
  } catch {
    return null;
  }
});
