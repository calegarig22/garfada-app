import Link from "next/link";
import { MailCheck } from "lucide-react";

export const metadata = { title: "Confira seu e-mail" };

export default function VerifiquePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-8 text-center">
      <span className="mb-6 flex size-16 items-center justify-center rounded-control bg-accent text-accent-fg">
        <MailCheck aria-hidden size={28} />
      </span>
      <h1 className="letreiro text-[2.5rem]">Confira seu e-mail</h1>
      <p className="mt-3 text-text-muted">
        Mandamos um link de acesso. Toque nele para entrar. Se não chegar em alguns minutos,
        olhe a caixa de spam.
      </p>
      <Link href="/entrar" className="mt-8 flex h-11 items-center px-4 font-medium text-primary underline-offset-4 hover:underline">
        Voltar
      </Link>
    </main>
  );
}
