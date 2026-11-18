import { redirect } from "next/navigation";

// A página inicial "/" leva direto para a aba Explorar.
export default function Home() {
  redirect("/explorar");
}
