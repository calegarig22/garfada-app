"use server";
// Ações sociais: curtir, comentar, seguir. Cada uma avisa a outra pessoa
// (notificação), nunca a si mesmo.
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { follows, notifications, reviewComments, reviewLikes, reviews, users } from "@/db/schema";
import { requireUser } from "@/lib/session";

/** Curtir/descurtir. Devolve o estado novo para o botão. */
export async function alternarCurtida(reviewId: string): Promise<{ liked: boolean; likes: number }> {
  const me = await requireUser();
  const review = await db.query.reviews.findFirst({
    where: eq(reviews.id, reviewId),
    columns: { id: true, userId: true },
  });
  if (!review) return { liked: false, likes: 0 };

  const removed = await db
    .delete(reviewLikes)
    .where(and(eq(reviewLikes.reviewId, reviewId), eq(reviewLikes.userId, me.id)))
    .returning({ r: reviewLikes.reviewId });
  const liked = removed.length === 0;
  if (liked) {
    await db.insert(reviewLikes).values({ reviewId, userId: me.id }).onConflictDoNothing();
    if (review.userId !== me.id) {
      await db.insert(notifications).values({ recipientId: review.userId, actorId: me.id, type: "review_like", reviewId });
    }
  } else {
    // Descurtiu: some o aviso de curtida que tinha gerado.
    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.type, "review_like"),
          eq(notifications.actorId, me.id),
          eq(notifications.reviewId, reviewId),
        ),
      );
  }
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(reviewLikes)
    .where(eq(reviewLikes.reviewId, reviewId));
  return { liked, likes: n };
}

export type ComentarState = { error?: string; ok?: number };

const comentarioSchema = z.string().trim().min(1, "Escreva algo.").max(500, "Máximo de 500 caracteres.");

export async function comentar(reviewId: string, prev: ComentarState, fd: FormData): Promise<ComentarState> {
  const me = await requireUser();
  const parsed = comentarioSchema.safeParse(String(fd.get("body") ?? ""));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const review = await db.query.reviews.findFirst({
    where: eq(reviews.id, reviewId),
    columns: { id: true, userId: true },
  });
  if (!review) return { error: "Esta avaliação não existe mais." };

  const [c] = await db
    .insert(reviewComments)
    .values({ reviewId, userId: me.id, body: parsed.data })
    .returning({ id: reviewComments.id });
  if (review.userId !== me.id) {
    await db
      .insert(notifications)
      .values({ recipientId: review.userId, actorId: me.id, type: "review_comment", reviewId, commentId: c.id });
  }
  revalidatePath(`/avaliacoes/${reviewId}`);
  return { ok: (prev.ok ?? 0) + 1 };
}

export type EditarComentarioState = { error?: string; ok?: number };

/** Edita um comentário: só quem escreveu. */
export async function editarComentario(
  commentId: string,
  prev: EditarComentarioState,
  fd: FormData,
): Promise<EditarComentarioState> {
  const me = await requireUser();
  const parsed = comentarioSchema.safeParse(String(fd.get("body") ?? ""));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const [c] = await db
    .update(reviewComments)
    .set({ body: parsed.data, editedAt: new Date() })
    .where(and(eq(reviewComments.id, commentId), eq(reviewComments.userId, me.id)))
    .returning({ reviewId: reviewComments.reviewId });
  if (!c) return { error: "Este comentário não existe ou não é seu." };
  revalidatePath(`/avaliacoes/${c.reviewId}`);
  return { ok: (prev.ok ?? 0) + 1 };
}

/** Apaga um comentário: quem escreveu, ou o dono da avaliação. */
export async function apagarComentario(commentId: string) {
  const me = await requireUser();
  const [c] = await db
    .select({ reviewId: reviewComments.reviewId, author: reviewComments.userId, reviewOwner: reviews.userId })
    .from(reviewComments)
    .innerJoin(reviews, eq(reviews.id, reviewComments.reviewId))
    .where(eq(reviewComments.id, commentId));
  if (!c || (c.author !== me.id && c.reviewOwner !== me.id)) return;
  await db.delete(reviewComments).where(eq(reviewComments.id, commentId));
  revalidatePath(`/avaliacoes/${c.reviewId}`);
}

/** Seguir/deixar de seguir. */
export async function alternarSeguir(userId: string): Promise<{ following: boolean; followers: number }> {
  const me = await requireUser();
  if (userId === me.id) return { following: false, followers: 0 };
  const target = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { id: true, username: true } });
  if (!target) return { following: false, followers: 0 };

  const removed = await db
    .delete(follows)
    .where(and(eq(follows.followerId, me.id), eq(follows.followingId, userId)))
    .returning({ f: follows.followerId });
  const following = removed.length === 0;
  if (following) {
    await db.insert(follows).values({ followerId: me.id, followingId: userId }).onConflictDoNothing();
    await db.insert(notifications).values({ recipientId: userId, actorId: me.id, type: "follow" });
  } else {
    await db
      .delete(notifications)
      .where(and(eq(notifications.type, "follow"), eq(notifications.actorId, me.id), eq(notifications.recipientId, userId)));
  }
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(follows)
    .where(eq(follows.followingId, userId));
  revalidatePath(`/u/${target.username}`);
  revalidatePath("/social");
  return { following, followers: n };
}
