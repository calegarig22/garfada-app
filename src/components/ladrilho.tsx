// Ladrilho hidráulico (o piso clássico de boteco) desenhado em SVG.
// Usa `currentColor`: a cor vem da classe de texto de quem usa.
import { useId } from "react";

export function Ladrilho({ className = "" }: { className?: string }) {
  const id = useId();
  return (
    <svg aria-hidden className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}>
      <defs>
        <pattern id={id} width="64" height="64" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="1.5">
            {/* moldura do ladrilho */}
            <rect x="0.75" y="0.75" width="62.5" height="62.5" />
            {/* flor central de 4 pétalas */}
            <path d="M32 14 C40 22 40 26 32 32 C24 26 24 22 32 14Z" />
            <path d="M32 50 C24 42 24 38 32 32 C40 38 40 42 32 50Z" />
            <path d="M14 32 C22 24 26 24 32 32 C26 40 22 40 14 32Z" />
            <path d="M50 32 C42 40 38 40 32 32 C38 24 42 24 50 32Z" />
            {/* quartos de círculo nos cantos: viram flor quando os ladrilhos se encontram */}
            <path d="M0 14 A14 14 0 0 0 14 0" />
            <path d="M50 0 A14 14 0 0 0 64 14" />
            <path d="M64 50 A14 14 0 0 0 50 64" />
            <path d="M14 64 A14 14 0 0 0 0 50" />
          </g>
          <circle cx="32" cy="32" r="2.5" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
