"use client";
// Mapinha com um pino que dá para ARRASTAR (ou tocar no mapa para mover).
// Usado para ajustar "você está aqui" e, na administração, corrigir o pino de um lugar.
// Mapa aberto e grátis: OpenStreetMap (com crédito), biblioteca Leaflet.
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, Marker } from "leaflet";

type LatLng = { lat: number; lng: number };

export function PinMap({
  value,
  onChange,
  accuracy,
  label = "Você está aqui",
  height = 200,
}: {
  value: LatLng;
  onChange: (p: LatLng) => void;
  /** raio de precisão do GPS, em metros (desenha um círculo) */
  accuracy?: number | null;
  label?: string;
  height?: number;
}) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const circle = useRef<import("leaflet").Circle | null>(null);
  const onChangeRef = useRef(onChange);
  // Guarda sempre a versão mais nova do onChange (atualizado depois de desenhar)
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Cria o mapa uma vez
  useEffect(() => {
    let cancel = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancel || !box.current || map.current) return;
      const m = L.map(box.current, { zoomControl: true, attributionControl: true }).setView([value.lat, value.lng], 17);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(m);
      // Pino desenhado aqui mesmo (sem imagens externas), nas cores do Garfada
      const icon = L.divIcon({
        className: "",
        html: `<span style="display:block;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:var(--primary);border:3px solid var(--text);box-shadow:0 2px 0 var(--text)"></span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });
      const mk = L.marker([value.lat, value.lng], { draggable: true, icon, title: label, keyboard: true }).addTo(m);
      mk.on("dragend", () => {
        const p = mk.getLatLng();
        onChangeRef.current({ lat: p.lat, lng: p.lng });
      });
      m.on("click", (e) => {
        mk.setLatLng(e.latlng);
        onChangeRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
      map.current = m;
      marker.current = mk;
    })();
    return () => {
      cancel = true;
      map.current?.remove();
      map.current = null;
    };
    // só na criação
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Atualiza pino e círculo quando o valor muda por fora (ex.: GPS refinando)
  useEffect(() => {
    (async () => {
      const L = (await import("leaflet")).default;
      const m = map.current;
      if (!m || !marker.current) return;
      const cur = marker.current.getLatLng();
      if (Math.abs(cur.lat - value.lat) > 1e-7 || Math.abs(cur.lng - value.lng) > 1e-7) {
        marker.current.setLatLng([value.lat, value.lng]);
        m.panTo([value.lat, value.lng]);
      }
      circle.current?.remove();
      circle.current = accuracy
        ? L.circle([value.lat, value.lng], {
            radius: accuracy,
            // cor do token --primary (vermelho-tomate)
            color: getComputedStyle(document.documentElement).getPropertyValue("--primary").trim(),
            weight: 1,
            fillOpacity: 0.08,
          }).addTo(m)
        : null;
    })();
  }, [value.lat, value.lng, accuracy]);

  return (
    <div
      ref={box}
      role="application"
      aria-label={`${label}. Arraste o pino ou toque no mapa para ajustar.`}
      className="z-0 w-full overflow-hidden rounded-card border-2 border-text"
      style={{ height }}
    />
  );
}
