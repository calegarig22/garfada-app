"use client";
// Fotos de uma avaliação: quadradinhos pequenos ao lado do texto. Tocar abre a
// foto grande em tela cheia (com setas entre as fotos e botão de fechar; Esc fecha).
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type P = { url: string; width: number; height: number };

export function PhotoThumbs({ photos, alt }: { photos: P[]; alt: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [i, setI] = useState(0);
  const total = photos.length;
  const open = (n: number) => {
    setI(n);
    dialog.current?.showModal();
  };

  // Até 2 quadradinhos; o segundo mostra "+N" se houver mais fotos
  const shown = photos.slice(0, 2);

  return (
    <>
      <ul className="flex shrink-0 gap-1.5">
        {shown.map((p, n) => (
          <li key={p.url}>
            <button
              type="button"
              onClick={() => open(n)}
              aria-label={`Abrir foto ${n + 1} de ${total}`}
              className="pressable relative block size-20 overflow-hidden rounded-control border-2 border-text sm:size-24"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" loading="lazy" className="h-full w-full object-cover" />
              {n === 1 && total > 2 ? (
                <span className="absolute inset-0 flex items-center justify-center bg-text/60 text-lg font-bold text-bg">
                  +{total - 2}
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        aria-label={alt}
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close(); // tocar fora fecha
        }}
        className="m-auto max-h-[92dvh] w-[min(92vw,56rem)] overflow-visible bg-transparent p-0 backdrop:bg-text/85"
      >
        {photos[i] ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[i].url}
              alt={`${alt} — foto ${i + 1} de ${total}`}
              width={photos[i].width}
              height={photos[i].height}
              className="mx-auto max-h-[86dvh] w-auto max-w-full rounded-card object-contain"
            />
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label="Fechar foto"
              className="absolute right-2 top-2 flex size-11 items-center justify-center rounded-full bg-text/80 text-bg"
            >
              <X aria-hidden size={22} />
            </button>
            {total > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => setI((n) => (n - 1 + total) % total)}
                  aria-label="Foto anterior"
                  className="absolute left-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-text/80 text-bg"
                >
                  <ChevronLeft aria-hidden size={24} />
                </button>
                <button
                  type="button"
                  onClick={() => setI((n) => (n + 1) % total)}
                  aria-label="Próxima foto"
                  className="absolute right-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-text/80 text-bg"
                >
                  <ChevronRight aria-hidden size={24} />
                </button>
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-text/80 px-2.5 py-1 text-xs font-semibold tabular-nums text-bg">
                  {i + 1}/{total}
                </span>
              </>
            ) : null}
          </div>
        ) : null}
      </dialog>
    </>
  );
}
