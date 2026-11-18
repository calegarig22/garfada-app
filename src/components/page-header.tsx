// Cabeçalho de cada aba: título em letra de letreiro + espaço para botões à direita.
export function PageHeader({
  title,
  actions,
}: {
  title: string;
  actions?: React.ReactNode;
}) {
  return (
    <header
      className="sticky top-0 z-10 border-b-2 border-text bg-bg px-4 pb-2"
      style={{ paddingTop: "max(env(safe-area-inset-top), 1.25rem)" }}
    >
      <div className="flex min-h-11 items-end justify-between gap-3">
        <h1 className="letreiro text-[2.75rem]">{title}</h1>
        {actions ? <div className="flex items-center gap-1 pb-1">{actions}</div> : null}
      </div>
    </header>
  );
}
