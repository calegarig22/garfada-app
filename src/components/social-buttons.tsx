"use client";
// Botões que mudam na hora (antes da resposta do servidor): curtir e seguir.
// O estado "confirmado" guarda a resposta do servidor; o "otimista" mostra a
// mudança imediatamente enquanto a resposta não chega.
import { useOptimistic, useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { alternarCurtida, alternarSeguir } from "@/app/(app)/social/actions";

export function LikeButton({ reviewId, liked, likes }: { reviewId: string; liked: boolean; likes: number }) {
  const [confirmed, setConfirmed] = useState({ liked, likes });
  const [state, setOptimistic] = useOptimistic(confirmed);
  const [, start] = useTransition();

  return (
    <button
      type="button"
      aria-pressed={state.liked}
      aria-label={state.liked ? "Descurtir" : "Curtir"}
      onClick={() =>
        start(async () => {
          setOptimistic((s) => ({ liked: !s.liked, likes: s.likes + (s.liked ? -1 : 1) }));
          const result = await alternarCurtida(reviewId);
          setConfirmed(result);
        })
      }
      className="pressable inline-flex min-h-11 items-center gap-1.5 rounded-control px-2 font-semibold hover:bg-surface-sunken"
    >
      <Heart
        aria-hidden
        size={22}
        strokeWidth={2}
        className={state.liked ? "fill-primary text-primary" : "text-text"}
      />
      <span className="tabular-nums">{state.likes}</span>
    </button>
  );
}

export function FollowButton({ userId, following }: { userId: string; following: boolean }) {
  const [confirmed, setConfirmed] = useState(following);
  const [state, setOptimistic] = useOptimistic(confirmed);
  const [, start] = useTransition();

  return (
    <button
      type="button"
      aria-pressed={state}
      onClick={() =>
        start(async () => {
          setOptimistic((s) => !s);
          const result = await alternarSeguir(userId);
          setConfirmed(result.following);
        })
      }
      className={`pressable letreiro inline-flex h-11 min-w-28 items-center justify-center rounded-control px-4 pt-0.5 text-lg ${
        state
          ? "border-2 border-text bg-surface text-text hover:bg-surface-sunken"
          : "bg-primary text-primary-fg shadow-[0_3px_0_var(--text)] active:shadow-[0_1px_0_var(--text)]"
      }`}
    >
      {state ? "Seguindo" : "Seguir"}
    </button>
  );
}
