"use client";
import dynamic from "next/dynamic";
import { useState, useTransition } from "react";
import { salvarPino } from "../../actions";

const PinMap = dynamic(() => import("@/components/pin-map").then((m) => m.PinMap), {
  ssr: false,
  loading: () => <div className="h-[360px] w-full animate-pulse rounded-card bg-surface-sunken" />,
});

export function FixPin({ restaurantId, inicio }: { restaurantId: string; inicio: { lat: number; lng: number } }) {
  const [pos, setPos] = useState(inicio);
  const [pending, start] = useTransition();
  return (
    <>
      <PinMap value={pos} onChange={setPos} label="Pino do restaurante" height={360} />
      <p className="mt-2 text-xs tabular-nums text-text-muted">
        {pos.lat.toFixed(6)}, {pos.lng.toFixed(6)}
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => salvarPino(restaurantId, pos.lat, pos.lng))}
        className="pressable letreiro mt-3 h-12 w-full rounded-control bg-primary pt-0.5 text-[1.375rem] text-primary-fg shadow-[0_3px_0_var(--text)] disabled:opacity-60"
      >
        {pending ? "Salvando…" : "Salvar pino"}
      </button>
    </>
  );
}
