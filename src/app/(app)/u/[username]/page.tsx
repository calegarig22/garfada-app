import { notFound, redirect } from "next/navigation";
import { BackHeader } from "@/components/back-header";
import { ProfileView } from "@/components/profile-view";
import { requireUser } from "@/lib/session";
import { loadProfile } from "@/lib/profile";

export async function generateMetadata({ params }: PageProps<"/u/[username]">) {
  return { title: `@${(await params).username}` };
}

export default async function PerfilPublicoPage({ params }: PageProps<"/u/[username]">) {
  const { username } = await params;
  const me = await requireUser();
  if (username.toLowerCase() === me.username) redirect("/perfil");

  const data = await loadProfile(me.id, decodeURIComponent(username));
  if (!data) notFound();

  return (
    <>
      <BackHeader href="/social" title={`@${data.p.username}`} />
      <ProfileView {...data} isMe={false} />
    </>
  );
}
