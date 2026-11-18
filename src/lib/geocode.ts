// Endereço → coordenadas (latitude/longitude) pelo OpenStreetMap (Nominatim).
// Grátis, aberto e sem chave. Regra de uso deles: no máximo 1 pedido por segundo
// e identificar o app — aqui só pedimos 1 vez, quando alguém cadastra um lugar.
import "server-only";

export async function geocode(address: string, city: string): Promise<{ lat: number; lng: number } | null> {
  const q = [address.replace(/\s*\(.*\)/, ""), city, "Brasil"].join(", ");
  try {
    const res = await fetch(
      "https://nominatim.openstreetmap.org/search?" +
        new URLSearchParams({ q, format: "json", limit: "1", countrycodes: "br" }),
      {
        headers: { "User-Agent": "GarfadaApp/0.1 (personal project)" },
        signal: AbortSignal.timeout(4000),
        cache: "no-store",
      },
    );
    if (!res.ok) return null;
    const [hit] = (await res.json()) as { lat: string; lon: string }[];
    return hit ? { lat: Number(hit.lat), lng: Number(hit.lon) } : null;
  } catch {
    return null; // sem coordenadas o lugar funciona igual, só sem a fachada
  }
}
