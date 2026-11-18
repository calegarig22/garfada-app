import { LogOut } from "lucide-react";
import { notFound } from "next/navigation";
import { signOut } from "@/auth";
import { PageHeader } from "@/components/page-header";
import { ProfileView } from "@/components/profile-view";
import Link from "next/link";
import { isAdmin, requireUser } from "@/lib/session";
import { loadProfile } from "@/lib/profile";

export const metadata = { title: "Perfil" };

export default async function PerfilPage() {
  const me = await requireUser();
  const data = await loadProfile(me.id, me.username);
  if (!data) notFound();
  const souAdmin = await isAdmin(me.id);

  // "Server action": função que roda no servidor quando o botão é tocado.
  async function sair() {
    "use server";
    await signOut({ redirectTo: "/entrar" });
  }

  return (
    <>
      <PageHeader
        title="Perfil"
        actions={
          <form action={sair}>
            <button
              type="submit"
              className="pressable flex h-11 items-center gap-2 rounded-control px-3 text-sm font-medium text-text-muted hover:bg-surface-sunken hover:text-text"
            >
              <LogOut aria-hidden size={18} />
              Sair
            </button>
          </form>
        }
      />
      {souAdmin ? (
        <div className="px-4 pt-3">
          <Link href="/admin/pinos" className="inline-flex min-h-11 items-center text-sm font-semibold underline decoration-primary decoration-2 underline-offset-4">
            Administração: pinos para corrigir
          </Link>
        </div>
      ) : null}
      <ProfileView {...data} isMe />
    </>
  );
}
