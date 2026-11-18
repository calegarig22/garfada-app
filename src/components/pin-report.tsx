"use client";
// "O pino deste lugar está errado?" → manda um aviso para a administração.
import Link from "next/link";
import { useState, useTransition } from "react";
import { avisarPinoErrado } from "@/app/(app)/admin/actions";

export function PinReport({ restaurantId, admin }: { restaurantId: string; admin: boolean }) {
  const [nota, setNota] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [pending, start] = useTransition();

  return (
    <div className="mt-2 text-sm">
      {admin ? (
        <Link href={`/admin/pinos/${restaurantId}`} className="mr-3 inline-flex min-h-11 items-center font-semibold underline underline-offset-4">
          Corrigir pino (administração)
        </Link>
      ) : null}
      {enviado ? (
        <p role="status" className="inline-flex min-h-11 items-center text-text-muted">
          Obrigado! A administração vai conferir o pino.
        </p>
      ) : (
        <details className="inline-block">
          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center text-text-muted underline underline-offset-4 hover:text-text">
            O pino está no lugar errado?
          </summary>
          <div className="mt-2 flex flex-col gap-2">
            <label htmlFor={`nota-${restaurantId}`} className="sr-only">
              O que está errado (opcional)
            </label>
            <input
              id={`nota-${restaurantId}`}
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              maxLength={300}
              placeholder="Opcional: ex. fica na esquina de baixo"
              className="h-11 rounded-control border-2 border-border bg-surface px-3 text-base hover:border-text-muted focus-visible:border-ring focus-visible:outline-none"
            />
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  await avisarPinoErrado(restaurantId, nota);
                  setEnviado(true);
                })
              }
              className="pressable h-11 self-start rounded-control border-2 border-text bg-surface px-3 font-semibold hover:bg-surface-sunken disabled:opacity-60"
            >
              {pending ? "Enviando…" : "Avisar"}
            </button>
          </div>
        </details>
      )}
    </div>
  );
}
