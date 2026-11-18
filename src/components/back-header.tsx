import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Cabeçalho de telas internas: voltar + título em letreiro. */
export function BackHeader({ href, title }: { href: string; title: string }) {
  return (
    <header
      className="sticky top-0 z-10 flex items-end gap-2 border-b-2 border-text bg-bg px-2 pb-2 lg:px-4"
      style={{ paddingTop: "max(env(safe-area-inset-top), 1.25rem)" }}
    >
      <Link
        href={href}
        aria-label="Voltar"
        className="pressable flex size-11 shrink-0 items-center justify-center rounded-control hover:bg-surface-sunken"
      >
        <ArrowLeft aria-hidden size={24} />
      </Link>
      <h1 className="letreiro min-w-0 truncate pb-0.5 pt-1.5 text-[2.25rem] leading-none">{title}</h1>
    </header>
  );
}
