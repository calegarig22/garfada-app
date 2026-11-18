import { BackHeader } from "@/components/back-header";
import { googleEnabled } from "@/lib/google-places";
import { getRestaurant, listCuisines } from "@/lib/restaurants";
import { photosEnabled } from "@/lib/storage";
import { NovoLugarForm } from "./novo-form";

export const metadata = { title: "Novo lugar" };

export default async function NovoLugarPage({ searchParams }: PageProps<"/restaurantes/novo">) {
  const sp = await searchParams;
  const unidadeDeId = typeof sp.unidadeDe === "string" ? sp.unidadeDe : null;
  const [tipos, base] = await Promise.all([listCuisines(), unidadeDeId ? getRestaurant(unidadeDeId) : null]);

  // "Cadastrar outra unidade": nome, tipo, preço e cidade já vêm da unidade que existe.
  const inicial = base
    ? {
        name: base.name,
        city: base.city,
        cuisineId: base.cuisineId ?? "",
        priceLevel: base.priceLevel ? String(base.priceLevel) : "",
      }
    : undefined;

  return (
    <>
      <BackHeader href={base ? `/restaurantes/${base.id}` : "/explorar"} title={base ? "Nova unidade" : "Novo lugar"} />
      <div className="px-4 pt-5 lg:max-w-xl">
        <p className="mb-6 text-text-muted">
          {base ? (
            <>
              Outra unidade de <strong className="text-text">{base.name}</strong>. Só falta o endereço e o bairro desta
              unidade — ela terá nota e avaliações próprias.
            </>
          ) : (
            "Cadastre um restaurante, bar ou café. Depois de salvar, você já pode dar sua nota."
          )}
        </p>
        <NovoLugarForm
          tipos={tipos}
          photosEnabled={photosEnabled}
          googleEnabled={googleEnabled && !base}
          inicial={inicial}
          unidadeDe={base?.id}
        />
      </div>
    </>
  );
}
