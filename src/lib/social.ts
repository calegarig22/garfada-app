// Consultas da parte social: feed, avaliações com curtidas/comentários,
// perfis, busca de pessoas e notificações.
import "server-only";
import { and, desc, eq, ilike, isNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { cuisines, notifications, restaurants, reviewComments, reviews, users } from "@/db/schema";
import type { Photo } from "@/lib/restaurants";
import { withUrls } from "@/lib/storage";

// Em consultas só com a tabela users, o Drizzle escreve a coluna sem o nome da tabela
// ("id"); dentro de uma subconsulta em reviews isso apontaria para reviews.id.
// Por isso, nos contadores, o nome completo é escrito à mão.
const USER_ID = sql.raw('"users"."id"');

/** Campos de uma avaliação "em cartão" (como um post do Instagram). */
function reviewCardFields(meId: string) {
  return {
    id: reviews.id,
    rating: reviews.rating,
    body: reviews.body,
    visitedOn: reviews.visitedOn,
    createdAt: reviews.createdAt,
    editedAt: reviews.editedAt,
    userId: reviews.userId,
    username: users.username,
    name: users.name,
    restaurantId: restaurants.id,
    restaurantName: restaurants.name,
    neighborhood: restaurants.neighborhood,
    cuisine: cuisines.name,
    photos: sql<Photo[]>`coalesce((
      select json_agg(json_build_object('key', storage_key, 'width', width, 'height', height) order by position)
      from review_photos where review_id = ${reviews.id}
    ), '[]'::json)`,
    likes: sql<number>`(select count(*)::int from review_likes where review_id = ${reviews.id})`,
    likedByMe: sql<boolean>`exists(select 1 from review_likes where review_id = ${reviews.id} and user_id = ${meId})`,
    comments: sql<number>`(select count(*)::int from review_comments where review_id = ${reviews.id})`,
  };
}

async function reviewCards(meId: string, where: SQL | undefined, limit = 30) {
  const rows = await db
    .select(reviewCardFields(meId))
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.userId))
    .innerJoin(restaurants, eq(restaurants.id, reviews.restaurantId))
    .leftJoin(cuisines, eq(cuisines.id, restaurants.cuisineId))
    .where(where)
    .orderBy(desc(reviews.createdAt))
    .limit(limit);
  return Promise.all(rows.map(async (r) => ({ ...r, photos: await withUrls(r.photos) })));
}

export type ReviewCard = Awaited<ReturnType<typeof reviewCards>>[number];

/** Feed: "seguindo" = de quem eu sigo (e minhas); "todos" = de todo mundo. */
export function listFeed(meId: string, modo: "seguindo" | "todos") {
  const where =
    modo === "todos"
      ? undefined
      : or(
          eq(reviews.userId, meId),
          sql`${reviews.userId} in (select following_id from follows where follower_id = ${meId})`,
        );
  return reviewCards(meId, where);
}

export function listRestaurantReviews(meId: string, restaurantId: string) {
  return reviewCards(meId, eq(reviews.restaurantId, restaurantId), 100);
}

export function listUserReviews(meId: string, userId: string) {
  return reviewCards(meId, eq(reviews.userId, userId), 60);
}

export async function getReviewCard(meId: string, reviewId: string) {
  const [r] = await reviewCards(meId, eq(reviews.id, reviewId), 1);
  return r ?? null;
}

export function listComments(reviewId: string) {
  return db
    .select({
      id: reviewComments.id,
      body: reviewComments.body,
      createdAt: reviewComments.createdAt,
      editedAt: reviewComments.editedAt,
      userId: reviewComments.userId,
      username: users.username,
      name: users.name,
    })
    .from(reviewComments)
    .innerJoin(users, eq(users.id, reviewComments.userId))
    .where(eq(reviewComments.reviewId, reviewId))
    .orderBy(reviewComments.createdAt)
    .limit(200);
}

/** Perfil público por @username, com contadores e se eu sigo. */
export async function getProfile(meId: string, username: string) {
  const [p] = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      bio: users.bio,
      image: users.image,
      reviews: sql<number>`(select count(*)::int from reviews where user_id = ${USER_ID})`,
      followers: sql<number>`(select count(*)::int from follows where following_id = ${USER_ID})`,
      following: sql<number>`(select count(*)::int from follows where follower_id = ${USER_ID})`,
      isFollowing: sql<boolean>`exists(select 1 from follows where follower_id = ${meId} and following_id = ${USER_ID})`,
    })
    .from(users)
    .where(eq(users.username, username.toLowerCase()));
  return p ?? null;
}

/** Busca de pessoas por @ ou nome. */
export function searchUsers(meId: string, q: string) {
  const like = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`).replace(/^@/, "")}%`;
  return db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      isFollowing: sql<boolean>`exists(select 1 from follows where follower_id = ${meId} and following_id = ${USER_ID})`,
    })
    .from(users)
    .where(and(sql`${users.username} is not null`, or(ilike(users.username, like), ilike(users.name, like))))
    .limit(20);
}

/** Pessoas para seguir: quem mais avaliou e eu ainda não sigo. */
export function suggestUsers(meId: string) {
  return db
    .select({ id: users.id, name: users.name, username: users.username })
    .from(users)
    .where(
      and(
        sql`${users.username} is not null`,
        sql`${users.id} <> ${meId}`,
        sql`${USER_ID} not in (select following_id from follows where follower_id = ${meId})`,
      ),
    )
    .orderBy(sql`(select count(*) from reviews where user_id = ${USER_ID}) desc`)
    .limit(5);
}

export function listNotifications(meId: string) {
  return db
    .select({
      id: notifications.id,
      type: notifications.type,
      createdAt: notifications.createdAt,
      readAt: notifications.readAt,
      reviewId: notifications.reviewId,
      actorUsername: users.username,
      actorName: users.name,
      restaurantName: sql<string | null>`(
        select r.name from reviews rv join restaurants r on r.id = rv.restaurant_id where rv.id = ${notifications.reviewId}
      )`,
      commentBody: sql<string | null>`(select body from review_comments where id = ${notifications.commentId})`,
    })
    .from(notifications)
    .innerJoin(users, eq(users.id, notifications.actorId))
    .where(eq(notifications.recipientId, meId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function unreadCount(meId: string) {
  const [r] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.recipientId, meId), isNull(notifications.readAt)));
  return r?.n ?? 0;
}

export function markAllRead(meId: string) {
  return db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.recipientId, meId), isNull(notifications.readAt)));
}
