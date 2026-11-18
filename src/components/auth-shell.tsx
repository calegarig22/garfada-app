import type { ReactNode } from "react";
import { Ladrilho } from "./ladrilho";
import { Plaquinha } from "./plaquinha";

/**
 * Moldura das telas sem login (Entrar, Criar conta).
 * Celular: faixa verde-garrafa com ladrilho no topo e o formulário embaixo.
 * Computador: tela dividida — painel verde à esquerda, formulário à direita.
 * A plaquinha de feira fica "pregada" na beirada do formulário.
 */
export function AuthShell({
  title,
  subtitle,
  tag,
  children,
}: {
  title: string;
  subtitle: string;
  tag: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col lg:flex-row">
      <section
        className="relative overflow-hidden bg-accent text-accent-fg lg:flex lg:min-h-dvh lg:w-1/2 lg:flex-col lg:justify-end"
        style={{ paddingTop: "max(env(safe-area-inset-top), 2.5rem)" }}
      >
        <Ladrilho className="opacity-[0.09]" />
        <div className="relative mx-auto w-full max-w-md px-6 pb-12 lg:mx-0 lg:max-w-none lg:px-14 lg:pb-16">
          <h1 className="letreiro text-[clamp(4.25rem,23vw,7rem)] lg:text-[clamp(6rem,10vw,10rem)]">{title}</h1>
          <p className="mt-4 max-w-[30ch] text-[1.0625rem] leading-snug opacity-90 lg:text-xl">{subtitle}</p>
        </div>
      </section>

      <section
        className="relative flex flex-1 flex-col lg:w-1/2 lg:justify-center"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2rem)" }}
      >
        <div className="relative mx-auto flex w-full max-w-md flex-col gap-5 px-6 pt-10 lg:max-w-sm lg:px-0 lg:pt-8">
          <Plaquinha className="absolute -top-6 right-6 text-2xl lg:static lg:mb-2 lg:self-start lg:text-3xl">
            {tag}
          </Plaquinha>
          {children}
        </div>
      </section>
    </main>
  );
}
