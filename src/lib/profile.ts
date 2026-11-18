// Junta tudo o que a página de perfil precisa (o seu e o dos outros).
import "server-only";
import { listCollections, listFavorites, ratingHistogram } from "@/lib/lists";
import { listRestaurantsByIds } from "@/lib/restaurants";
import { getProfile, listUserReviews } from "@/lib/social";

export async function loadProfile(viewerId: string, username: string) {
  const p = await getProfile(viewerId, username);
  if (!p) return null;
  const [reviews, favorites, histogram, lists] = await Promise.all([
    listUserReviews(viewerId, p.id),
    listFavorites(p.id),
    ratingHistogram(p.id),
    listCollections(p.id, viewerId),
  ]);
  const places = await listRestaurantsByIds([...new Set(reviews.map((r) => r.restaurantId))]);
  return {
    p,
    reviews,
    favorites,
    histogram,
    lists,
    recentPlaces: new Map(places.map((r) => [r.id, r])),
  };
}
