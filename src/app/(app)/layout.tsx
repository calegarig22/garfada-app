// Moldura de todas as telas com abas. "(app)" entre parênteses é um
// "grupo de rotas": organiza pastas sem aparecer no endereço do site.
// Aqui verificamos o login: quem não entrou vai para /entrar.
// Celular: conteúdo em coluna + abas embaixo. Computador: barra lateral + conteúdo largo.
import { AppNav } from "@/components/app-nav";
import { requireUser } from "@/lib/session";
import { unreadCount } from "@/lib/social";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const unread = await unreadCount(user.id);

  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-surface focus:px-4 focus:py-2"
      >
        Pular para o conteúdo
      </a>
      <AppNav username={user.username} unread={unread} />
      <main id="conteudo" className="min-h-dvh pb-28 lg:pb-16 lg:pl-64">
        <div className="mx-auto max-w-2xl lg:max-w-6xl lg:px-6">{children}</div>
      </main>
    </>
  );
}
