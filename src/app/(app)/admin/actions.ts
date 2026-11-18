"use server";
// Pinos: qualquer pessoa avisa que está errado; só a administração corrige.
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { placeReports, restaurants } from "@/db/schema";
import { requireAdmin, requireUser } from "@/lib/session";

/** "O pino deste lugar está errado" — 1 aviso aberto por pessoa e lugar. */
export async function avisarPinoErrado(restaurantId: string, note: string): Promise<{ ok: boolean }> {
  const me = await requireUser();
  const aberto = await db.query.placeReports.findFirst({
    where: and(eq(placeReports.restaurantId, restaurantId), eq(placeReports.userId, me.id), isNull(placeReports.resolvedAt)),
    columns: { id: true },
  });
  if (!aberto) {
    await db.insert(placeReports).values({ restaurantId, userId: me.id, note: note.trim().slice(0, 300) || null });
  }
  revalidatePath("/admin/pinos");
  return { ok: true };
}

/** Salva a posição corrigida e fecha os avisos daquele lugar. */
export async function salvarPino(restaurantId: string, lat: number, lng: number) {
  await requireAdmin();
  if (!(Math.abs(lat) <= 90 && Math.abs(lng) <= 180)) return;
  await db.update(restaurants).set({ latitude: lat, longitude: lng }).where(eq(restaurants.id, restaurantId));
  await db
    .update(placeReports)
    .set({ resolvedAt: new Date() })
    .where(and(eq(placeReports.restaurantId, restaurantId), isNull(placeReports.resolvedAt)));
  revalidatePath("/admin/pinos");
  revalidatePath(`/restaurantes/${restaurantId}`);
  revalidatePath("/explorar");
  redirect("/admin/pinos?salvo=1");
}

/** Fecha os avisos sem mexer no pino (o pino estava certo). */
export async function descartarAvisos(restaurantId: string) {
  await requireAdmin();
  await db
    .update(placeReports)
    .set({ resolvedAt: new Date() })
    .where(and(eq(placeReports.restaurantId, restaurantId), isNull(placeReports.resolvedAt)));
  revalidatePath("/admin/pinos");
}
