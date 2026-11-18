import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthShell } from "@/components/auth-shell";
import { PASSWORD_MIN } from "@/lib/password";
import { SignupForm } from "./signup-form";

export const metadata = { title: "Criar conta" };

export default async function CriarContaPage() {
  const session = await auth();
  if (session?.user) redirect("/explorar");

  return (
    <AuthShell
      title="Criar conta"
      subtitle="Leva um minuto. Depois você escolhe seu @ e já pode avaliar o primeiro lugar."
      tag="de graça"
    >
      <SignupForm minLength={PASSWORD_MIN} />
      <p className="text-center text-sm text-text-muted">
        Já tem conta?{" "}
        <Link href="/entrar" className="inline-flex min-h-11 items-center font-semibold text-text underline decoration-primary decoration-2 underline-offset-4">
          Entrar
        </Link>
      </p>
    </AuthShell>
  );
}
