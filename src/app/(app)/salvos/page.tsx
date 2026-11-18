import { Bookmark } from "lucide-react";
import { CollectionCard } from "@/components/collection-card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { listCollections } from "@/lib/lists";
import { requireUser } from "@/lib/session";
import { NewListForm } from "./new-list-form";

export const metadata = { title: "Salvos" };

export default async function SalvosPage() {
  const me = await requireUser();
  const listas = await listCollections(me.id, me.id);

  return (
    <>
      <PageHeader title="Salvos" />
      <div className="px-4 pt-4">
        <NewListForm />
        {listas.length === 0 ? (
          <EmptyState Icon={Bookmark} title="Nada salvo ainda">
            Na página de um restaurante, toque em “Quero ir” para guardar ou em “Listas” para montar listas como
            “Almoço barato” ou “Encontro”.
          </EmptyState>
        ) : (
          <ul className="grid grid-cols-2 gap-x-3 gap-y-6 pb-10 pt-5 md:grid-cols-3 xl:grid-cols-4">
            {listas.map((c) => (
              <li key={c.id}>
                <CollectionCard c={c} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
