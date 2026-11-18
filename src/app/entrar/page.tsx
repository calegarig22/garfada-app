import { redirect } from "next/navigation";
import { Mail } from "lucide-react";
import Link from "next/link";
import { auth, googleEnabled, magicLinkEnabled, signIn } from "@/auth";
import { AuthShell } from "@/components/auth-shell";
import { secondaryButtonClass } from "@/components/form";
import { LoginForm } from "./login-form";

export const metadata = { title: "Entrar" };

const errorMessages: Record<string, string> = {
  OAuthAccountNotLinked: "Este e-mail já tem conta com senha. Entre com e-mail e senha.",
  Verification: "O link expirou ou já foi usado. Peça um novo.",
  Configuration: "O login não está configurado. Confira o .env.local.",
};

export default async function EntrarPage({ searchParams }: PageProps<"/entrar">) {
  const session = await auth();
  if (session?.user) redirect("/explorar");

  const { error } = await searchParams;
  const errorMessage =
    typeof error === "string" ? (errorMessages[error] ?? "Não deu para entrar. Tente de novo.") : null;

  async function entrarComGoogle() {
    "use server";
    await signIn("google", { redirectTo: "/explorar" });
  }

  async function entrarComEmail(formData: FormData) {
    "use server";
    await signIn("resend", { email: formData.get("email"), redirectTo: "/explorar" });
  }

  return (
    <AuthShell
      title="Garfada"
      subtitle="Anote onde você comeu, dê sua nota e guarde os lugares que quer conhecer."
      tag="nota 10"
    >
      {errorMessage ? (
        <p role="alert" className="border-l-4 border-danger bg-surface-sunken px-3 py-2.5 text-sm font-medium text-danger">
          {errorMessage}
        </p>
      ) : null}

      <LoginForm />

      <div className="flex flex-col gap-2 border-t-2 border-dashed border-border pt-5">
        <p className="text-sm text-text-muted">Primeira vez por aqui?</p>
        <Link href="/criar-conta" className={secondaryButtonClass}>
          Criar uma conta
        </Link>
      </div>

      {googleEnabled || magicLinkEnabled ? (
        <div className="flex items-center gap-3 text-xs text-text-muted" aria-hidden>
          <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
        </div>
      ) : null}

      {googleEnabled ? (
        <form action={entrarComGoogle}>
          <button
            type="submit"
            className="pressable flex h-12 w-full items-center justify-center gap-3 rounded-control border border-border bg-surface font-medium shadow-sm hover:bg-surface-sunken"
          >
            <GoogleLogo />
            Entrar com Google
          </button>
        </form>
      ) : null}

      {magicLinkEnabled ? (
        <form action={entrarComEmail} className="flex flex-col gap-2">
          <label htmlFor="magic-email" className="text-sm font-medium">
            Receber link de acesso por e-mail
          </label>
          <input
            id="magic-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="voce@exemplo.com"
            className="h-12 rounded-control border border-border bg-surface px-4 text-base placeholder:text-text-muted/70"
          />
          <button
            type="submit"
            className="pressable mt-1 flex h-12 items-center justify-center gap-2 rounded-control border border-border bg-surface font-medium hover:bg-surface-sunken"
          >
            <Mail aria-hidden size={18} />
            Enviar link
          </button>
        </form>
      ) : null}
    </AuthShell>
  );
}

function GoogleLogo() {
  return (
    <svg aria-hidden width="20" height="20" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 38.2 44 33 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
