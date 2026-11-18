// Plaquinha de feira: a "assinatura" do Garfada. A nota de um lugar aparece
// como plaquinha amarela escrita a pincel atômico, meio torta.
import type { ReactNode } from "react";

export function Plaquinha({
  children,
  label,
  className = "",
}: {
  children: ReactNode;
  /** Texto para leitor de tela, ex.: "Nota 4,5 de 5" */
  label?: string;
  className?: string;
}) {
  return (
    <span className={`plaquinha ${className}`} role={label ? "img" : undefined} aria-label={label}>
      <span aria-hidden={label ? true : undefined}>{children}</span>
    </span>
  );
}

/** Nota de 1 a 10 (meias estrelas) → "4,5" com estrela. */
export function NotaPlaquinha({ nota, className }: { nota: number; className?: string }) {
  const estrelas = (nota / 2).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return (
    <Plaquinha label={`Nota ${estrelas} de 5`} className={className}>
      {estrelas}
      <span className="text-[0.7em]">★</span>
    </Plaquinha>
  );
}
