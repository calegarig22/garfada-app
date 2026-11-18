// Distâncias e estação de metrô/trem mais próxima.
// Estações: © OpenStreetMap contributors (ODbL) — src/data/estacoes-sp.json.
// Funciona no servidor e no navegador (nada aqui depende de um ou outro).
import estacoes from "@/data/estacoes-sp.json";

type Station = { name: string; kind: "metrô" | "trem"; lat: number; lng: number };
const STATIONS = estacoes.stations as Station[];

/** Distância em metros entre dois pontos (fórmula de Haversine). */
export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Minutos a pé (≈ 80 m por minuto, já contando que a rua não é linha reta). */
export const walkMinutes = (meters: number) => Math.max(1, Math.round((meters * 1.25) / 80));

export type NearStation = { name: string; kind: "metrô" | "trem"; meters: number; minutes: number };

/** Estação mais próxima de um ponto (ou null se não houver coordenadas). */
export function nearestStation(lat: number | null, lng: number | null): NearStation | null {
  if (lat == null || lng == null) return null;
  let best: Station | null = null;
  let bestD = Infinity;
  for (const s of STATIONS) {
    const d = distanceMeters({ lat, lng }, s);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best ? { name: best.name, kind: best.kind, meters: Math.round(bestD), minutes: walkMinutes(bestD) } : null;
}

/** "Perto do metrô" = até ~8 minutos a pé. */
export const METRO_NEAR_MINUTES = 8;
