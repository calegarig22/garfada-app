"use client";
// Navegação principal com as 4 abas.
// Celular: barra fixa embaixo. Computador (lg, ≥1024 px): barra lateral verde à esquerda.
// "use client" = este pedaço roda no navegador (precisa saber em qual aba estamos).
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, CircleUserRound, Plus, Soup, Users, type LucideIcon } from "lucide-react";
import { Ladrilho } from "./ladrilho";

const tabs: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/explorar", label: "Explorar", Icon: Soup },
  { href: "/social", label: "Social", Icon: Users },
  { href: "/salvos", label: "Salvos", Icon: Bookmark },
  { href: "/perfil", label: "Perfil", Icon: CircleUserRound },
];

export function AppNav({ username, unread = 0 }: { username: string; unread?: number }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    (href === "/explorar" && pathname.startsWith("/restaurantes")) ||
    (href === "/social" && /^\/(u|avaliacoes|notificacoes)(\/|$)/.test(pathname));
  // Bolinha de "tem novidade" na aba Social
  const badge = (href: string) =>
    href === "/social" && unread > 0 ? (
      <span aria-label={`${unread} notificações novas`} className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-bg bg-primary" />
    ) : null;

  return (
    <>
      {/* ── Computador: barra lateral ── */}
      <nav
        aria-label="Navegação principal"
        className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col overflow-hidden bg-accent text-accent-fg lg:flex"
      >
        <Ladrilho className="opacity-[0.07]" />
        <div className="relative flex flex-1 flex-col px-5 pb-6 pt-8">
          <Link href="/explorar" className="letreiro text-[3.5rem]">
            Garfada
          </Link>
          <ul className="mt-10 flex flex-col gap-1.5">
            {tabs.map(({ href, label, Icon }) => {
              const active = isActive(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`pressable letreiro flex h-12 items-center gap-3 rounded-control px-3 pt-0.5 text-[1.5rem] ${
                      active ? "bg-nav-active text-nav-active-fg" : "hover:bg-accent-fg/10"
                    }`}
                  >
                    <span className="relative -mt-0.5">
                      <Icon aria-hidden size={22} strokeWidth={active ? 2.25 : 1.75} />
                      {badge(href)}
                    </span>
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-auto flex flex-col gap-3">
            <Link
              href="/restaurantes/novo"
              className="pressable letreiro flex h-12 items-center justify-center gap-2 rounded-control bg-primary pt-0.5 text-[1.375rem] text-primary-fg shadow-[0_3px_0_var(--text)] active:shadow-[0_1px_0_var(--text)]"
            >
              <Plus aria-hidden size={20} strokeWidth={2.5} className="-mt-0.5" />
              Novo lugar
            </Link>
            <p className="truncate text-sm opacity-80">@{username}</p>
          </div>
        </div>
      </nav>

      {/* ── Celular: barra de baixo ── */}
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-text bg-bg lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="mx-auto flex max-w-2xl items-stretch justify-around px-2">
          {tabs.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className="group flex h-16 flex-col items-center justify-center gap-1 rounded-control"
                >
                  {/* Fundo amarelo-gema atrás do ícone ativo (a mesma cor da plaquinha) */}
                  <span
                    className={`pressable flex h-8 w-14 items-center justify-center rounded-control ${
                      active ? "bg-nav-active text-nav-active-fg" : "text-text-muted group-hover:text-text"
                    }`}
                  >
                    <span className="relative">
                      <Icon aria-hidden size={22} strokeWidth={active ? 2.25 : 1.75} />
                      {badge(href)}
                    </span>
                  </span>
                  <span
                    className={`text-[11px] font-semibold uppercase leading-none tracking-wide ${
                      active ? "text-text" : "text-text-muted"
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
