// ─────────────────────────────────────────────────────────────
// SCHEMA = a descrição das tabelas do banco (as "planilhas").
// Cada `pgTable` vira uma tabela no Postgres.
// Quando mudamos algo aqui, rodamos `pnpm db:generate` (cria a
// migration, um arquivo com o SQL da mudança) e `pnpm db:migrate`
// (aplica a mudança no banco da Neon).
// ─────────────────────────────────────────────────────────────
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

/** Pessoas que usam o app. */
export const users = pgTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    email: text("email").unique(),
    emailVerified: timestamp("email_verified", { mode: "date" }),
    image: text("image"),
    // Campos nossos (o resto acima é exigido pelo Auth.js):
    username: text("username"), // @username, escolhido no primeiro acesso
    bio: text("bio"),
    // Senha "embaralhada" (scrypt). Vazia para quem entrou só pelo Google.
    // A senha original nunca é guardada.
    passwordHash: text("password_hash"),
    // Administração (corrigir pinos etc.). Por enquanto só a conta do dono do app.
    isAdmin: boolean("is_admin").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_username_unique").on(t.username)],
);

// ── Tabelas que o Auth.js usa para o login funcionar ──

/** Contas externas ligadas a um usuário (ex.: a conta Google). */
export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

/** Sessões abertas (quem está logado em qual aparelho). */
export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

/** Códigos temporários do link mágico por e-mail. */
export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// ─────────────────────────────────────────────────────────────
// Tabelas do app (ver PLANO.md, seção 4)
// ─────────────────────────────────────────────────────────────

/** Gera um id aleatório (mesmo formato do `users.id`). */
const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
  timestamp("created_at", { mode: "date" }).notNull().defaultNow();

/** Tipos de comida ("Japonesa", "Italiana"...). */
export const cuisines = pgTable("cuisines", {
  id: id(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(), // apelido para URL: "japonesa"
  // Foto ilustrativa do prato típico (uso livre, com crédito). Aparece nos lugares
  // que ainda não têm foto própria.
  photoUrl: text("photo_url"),
  photoCredit: text("photo_credit"),
  photoCreditUrl: text("photo_credit_url"),
  photoWidth: integer("photo_width"),
  photoHeight: integer("photo_height"),
});

/** Marca/rede com mais de uma unidade (ex.: DCK Burguer). Cada unidade é um restaurante. */
export const brands = pgTable("brands", {
  id: id(),
  name: text("name").notNull(),
  createdAt: createdAt(),
});

/** Restaurantes. */
export const restaurants = pgTable(
  "restaurants",
  {
    id: id(),
    name: text("name").notNull(),
    address: text("address"),
    neighborhood: text("neighborhood"), // bairro: "Pinheiros"
    // Unidade de uma marca (vazio = lugar único).
    brandId: text("brand_id").references((): AnyPgColumn => brands.id, { onDelete: "set null" }),
    // Código do lugar no Google (pode ser guardado; as fotos do Google não).
    googlePlaceId: text("google_place_id").unique(),
    city: text("city").notNull(),
    cuisineId: text("cuisine_id").references(() => cuisines.id, {
      onDelete: "set null",
    }),
    priceLevel: smallint("price_level"), // 1 a 4 ($ a $$$$)
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    createdById: text("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    // Placar já calculado. Quem mantém esses números atualizados é o
    // próprio banco (gatilho na migration 0003), toda vez que uma review
    // é criada, editada ou apagada.
    ratingSum: integer("rating_sum").notNull().default(0),
    ratingCount: integer("rating_count").notNull().default(0),
    // Média em estrelas (0,5 a 5), calculada sozinha a partir dos dois acima.
    ratingAvg: real("rating_avg").generatedAlwaysAs(
      sql`CASE WHEN rating_count > 0 THEN rating_sum::real / rating_count / 2 END`,
    ),
    createdAt: createdAt(),
  },
  (t) => [
    check("restaurants_price_level", sql`${t.priceLevel} BETWEEN 1 AND 4`),
    index("restaurants_city_idx").on(t.city),
    index("restaurants_cuisine_idx").on(t.cuisineId),
    index("restaurants_brand_idx").on(t.brandId),
    // Índice de "textos parecidos" para achar duplicados rápido.
    index("restaurants_name_trgm_idx").using(
      "gin",
      t.name.op("gin_trgm_ops"),
    ),
  ],
);

/** Fotos de restaurante (o arquivo fica no R2; aqui só o endereço). */
export const restaurantPhotos = pgTable(
  "restaurant_photos",
  {
    id: id(),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    uploadedById: text("uploaded_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    // Foto enviada ao app: caminho do arquivo no armazenamento (Backblaze B2).
    storageKey: text("storage_key"),
    // Foto de uso livre de fora (ex.: Wikimedia Commons): endereço + crédito obrigatório.
    externalUrl: text("external_url"),
    attribution: text("attribution"), // "Foto: Fulano, CC BY-SA 4.0"
    attributionUrl: text("attribution_url"), // página da foto com a licença
    // Largura/altura: o mosaico sabe a altura do card antes da foto carregar.
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index("restaurant_photos_restaurant_idx").on(t.restaurantId),
    check("restaurant_photos_has_source", sql`${t.storageKey} IS NOT NULL OR ${t.externalUrl} IS NOT NULL`),
  ],
);

/**
 * Avaliações (o diário). Nota de 1 a 10: cada ponto = meia estrela
 * (9 = 4,5 ★). A mesma pessoa pode avaliar o mesmo lugar várias vezes
 * (uma por visita).
 */
export const reviews = pgTable(
  "reviews",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    rating: smallint("rating").notNull(),
    body: text("body"), // texto opcional
    visitedOn: date("visited_on", { mode: "string" }).notNull(), // "2026-11-12"
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    editedAt: timestamp("edited_at", { mode: "date" }), // quando a pessoa editou (mostra "editada")
  },
  (t) => [
    check("reviews_rating_range", sql`${t.rating} BETWEEN 1 AND 10`),
    index("reviews_user_visited_idx").on(t.userId, t.visitedOn), // diário
    index("reviews_restaurant_created_idx").on(t.restaurantId, t.createdAt),
    index("reviews_created_idx").on(t.createdAt), // feed do Social
  ],
);

/** Fotos de uma review. */
export const reviewPhotos = pgTable(
  "review_photos",
  {
    id: id(),
    reviewId: text("review_id")
      .notNull()
      .references(() => reviews.id, { onDelete: "cascade" }),
    storageKey: text("storage_key").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    position: smallint("position").notNull().default(0), // ordem das fotos
  },
  (t) => [index("review_photos_review_idx").on(t.reviewId)],
);

/** Curtidas em reviews. Cada pessoa curte uma review no máximo 1 vez. */
export const reviewLikes = pgTable(
  "review_likes",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reviewId: text("review_id")
      .notNull()
      .references(() => reviews.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.reviewId] }),
    index("review_likes_review_idx").on(t.reviewId),
  ],
);

/** Comentários em reviews. */
export const reviewComments = pgTable(
  "review_comments",
  {
    id: id(),
    reviewId: text("review_id")
      .notNull()
      .references(() => reviews.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: createdAt(),
    editedAt: timestamp("edited_at", { mode: "date" }), // quando a pessoa editou (mostra "editado")
  },
  (t) => [
    check("review_comments_body_len", sql`char_length(${t.body}) BETWEEN 1 AND 500`),
    index("review_comments_review_created_idx").on(t.reviewId, t.createdAt),
  ],
);

/** Quem segue quem. */
export const follows = pgTable(
  "follows",
  {
    followerId: text("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.followerId, t.followingId] }),
    check("follows_not_self", sql`${t.followerId} <> ${t.followingId}`),
    index("follows_following_idx").on(t.followingId), // "seguidores"
  ],
);

/** Os 4 restaurantes favoritos do perfil (posição 1 a 4). */
export const favorites = pgTable(
  "favorites",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    position: smallint("position").notNull(),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.position] }),
    uniqueIndex("favorites_user_restaurant_unique").on(
      t.userId,
      t.restaurantId,
    ),
    check("favorites_position_range", sql`${t.position} BETWEEN 1 AND 4`),
  ],
);

/** Coleções e subpastas. `parentId` vazio = coleção principal. */
export const collections = pgTable(
  "collections",
  {
    id: id(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    isPrivate: boolean("is_private").notNull().default(false),
    // "quero_ir" = a lista automática "Quero ir" (cada pessoa tem no máximo uma).
    kind: text("kind"),
    parentId: text("parent_id").references((): AnyPgColumn => collections.id, {
      onDelete: "cascade",
    }),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("collections_owner_idx").on(t.ownerId),
    index("collections_parent_idx").on(t.parentId),
    uniqueIndex("collections_owner_kind_unique").on(t.ownerId, t.kind).where(sql`${t.kind} IS NOT NULL`),
    check("collections_name_len", sql`char_length(${t.name}) BETWEEN 1 AND 60`),
  ],
);

/**
 * Tipo do que se salva numa coleção. Hoje só "restaurant"; no futuro
 * entra "dish" (prato) sem precisar mudar o resto.
 */
export const itemType = pgEnum("item_type", ["restaurant"]);

/** O que tem dentro de cada coleção. */
export const collectionItems = pgTable(
  "collection_items",
  {
    id: id(),
    collectionId: text("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    itemType: itemType("item_type").notNull().default("restaurant"),
    restaurantId: text("restaurant_id").references(() => restaurants.id, {
      onDelete: "cascade",
    }),
    createdAt: createdAt(), // "quando foi salvo"
  },
  (t) => [
    // Se o tipo é restaurante, o restaurante tem que estar preenchido.
    check(
      "collection_items_restaurant_ref",
      sql`${t.itemType} <> 'restaurant' OR ${t.restaurantId} IS NOT NULL`,
    ),
    // Não salvar o mesmo restaurante duas vezes na mesma coleção.
    uniqueIndex("collection_items_collection_restaurant_unique").on(
      t.collectionId,
      t.restaurantId,
    ),
    index("collection_items_restaurant_idx").on(t.restaurantId),
  ],
);

/** Tipos de aviso. */
export const notificationType = pgEnum("notification_type", [
  "follow", // alguém começou a te seguir
  "review_like", // alguém curtiu sua review
  "review_comment", // alguém comentou na sua review
]);

/** Avisos (sino do Social). */
export const notifications = pgTable(
  "notifications",
  {
    id: id(),
    recipientId: text("recipient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationType("type").notNull(),
    actorId: text("actor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }), // quem causou
    reviewId: text("review_id").references(() => reviews.id, {
      onDelete: "cascade",
    }), // preenchido nas curtidas e comentários
    commentId: text("comment_id").references((): AnyPgColumn => reviewComments.id, {
      onDelete: "cascade",
    }), // preenchido nos comentários
    readAt: timestamp("read_at", { mode: "date" }), // vazio = não lida
    createdAt: createdAt(),
  },
  (t) => [
    index("notifications_recipient_created_idx").on(
      t.recipientId,
      t.createdAt,
    ),
  ],
);

/** Avisos de "o pino deste lugar está errado" (a administração corrige). */
export const placeReports = pgTable(
  "place_reports",
  {
    id: id(),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    note: text("note"),
    resolvedAt: timestamp("resolved_at", { mode: "date" }),
    createdAt: createdAt(),
  },
  (t) => [index("place_reports_open_idx").on(t.resolvedAt, t.createdAt)],
);
