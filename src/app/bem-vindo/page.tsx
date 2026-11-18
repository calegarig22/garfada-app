import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UsernameForm } from "./username-form";

export const metadata = { title: "Bem-vindo" };

export default async function BemVindoPage() {
  const session = await auth();
  if (!session?.user) redirect("/entrar");
  if (session.user.username) redirect("/explorar");

  // Sugestão a partir do e-mail: "maria.silva@gmail.com" → "maria.silva"
  const suggestion = (session.user.email?.split("@")[0] ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9_.]/g, "")
    .slice(0, 20);

  const firstName = session.user.name?.split(" ")[0];

  return (
    <main
      className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6"
      style={{ paddingTop: "max(env(safe-area-inset-top), 2rem)" }}
    >
      <h1 className="letreiro text-[clamp(3.5rem,18vw,5rem)]">
        {firstName ? `Oi, ${firstName}!` : "Oi!"}
      </h1>
      <p className="mt-3 text-lg text-text-muted">Escolha como você vai aparecer no app.</p>
      <UsernameForm suggestion={suggestion} />
    </main>
  );
}
