"use client";
// Carrossel de fotos do restaurante. Toda foto nova entra aqui (a mais nova
// primeiro) e nenhuma das anteriores some. Arrastar no celular, setas no computador.
import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type CarouselPhoto = {
  url: string;
  width: number;
  height: number;
  credit?: string | null;
  creditUrl?: string | null;
  by?: string | null;
  reviewId?: string | null;
  illustrative?: boolean;
};

export function PhotoCarousel({ photos, name }: { photos: CarouselPhoto[]; name: string }) {
  const track = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const total = photos.length;

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const next = Math.max(0, Math.min(total - 1, i));
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  return (
    <section aria-roledescription="carrossel" aria-label={`Fotos de ${name}`} className="relative">
      <ul
        ref={track}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] lg:rounded-card [&::-webkit-scrollbar]:hidden"
      >
        {photos.map((p, i) => (
          <li
            key={p.url}
            aria-roledescription="slide"
            aria-label={`${i + 1} de ${total}`}
            className="relative w-full shrink-0 snap-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt={p.by ? `Foto de @${p.by} em ${name}` : `Foto de ${name}`}
              width={p.width}
              height={p.height}
              loading={i === 0 ? "eager" : "lazy"}
              className="aspect-[4/3] max-h-[34rem] w-full bg-surface-sunken object-cover"
            />
            {/* Crédito de cada foto */}
            <p className="absolute bottom-0 left-0 max-w-[85%] truncate bg-text/75 px-2 py-1 text-xs text-bg">
              {p.by ? (
                <>
                  Foto de{" "}
                  <Link href={`/u/${p.by}`} className="font-semibold underline underline-offset-2">
                    @{p.by}
                  </Link>
                  {p.reviewId ? (
                    <>
                      {" · "}
                      <Link href={`/avaliacoes/${p.reviewId}`} className="underline underline-offset-2">
                        ver avaliação
                      </Link>
                    </>
                  ) : null}
                </>
              ) : p.creditUrl ? (
                <a href={p.creditUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                  {p.credit}
                </a>
              ) : (
                p.credit
              )}
            </p>
          </li>
        ))}
      </ul>

      {total > 1 ? (
        <>
          <span className="absolute right-2 top-2 rounded-full bg-text/75 px-2.5 py-1 text-xs font-semibold tabular-nums text-bg">
            {index + 1}/{total}
          </span>
          <button
            type="button"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            aria-label="Foto anterior"
            className="absolute left-2 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border-2 border-text bg-surface text-text shadow-[0_2px_0_var(--text)] disabled:opacity-0 sm:flex"
          >
            <ChevronLeft aria-hidden size={22} />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            disabled={index === total - 1}
            aria-label="Próxima foto"
            className="absolute right-2 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border-2 border-text bg-surface text-text shadow-[0_2px_0_var(--text)] disabled:opacity-0 sm:flex"
          >
            <ChevronRight aria-hidden size={22} />
          </button>
          {/* Bolinhas (até 10; acima disso o contador basta) */}
          {total <= 10 ? (
            <div aria-hidden className="mt-2 flex justify-center gap-1.5">
              {photos.map((p, i) => (
                <span key={p.url} className={`size-2 rounded-full ${i === index ? "bg-text" : "bg-border"}`} />
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
