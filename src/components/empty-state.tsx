// Tela vazia: diz o que vai aparecer aqui e convida para agir.
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  Icon,
  title,
  children,
}: {
  Icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start px-4 py-12">
      <span className="mb-5 flex size-14 items-center justify-center rounded-control bg-accent text-accent-fg">
        <Icon aria-hidden size={26} strokeWidth={1.75} />
      </span>
      <h2 className="letreiro text-[2rem]">{title}</h2>
      <p className="mt-3 max-w-[34ch] leading-relaxed text-text-muted">{children}</p>
    </div>
  );
}
