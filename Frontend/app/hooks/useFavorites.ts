import { useState, useCallback } from "react";
import type { HolidayRecommendationOption } from "~/lib/api";

export interface FavoriteVacation {
  id: string;
  title: string;
  destinationCity: string;
  destinationCountry: string;
  reason: string;
  bestSeason: string;
  estimatedBudget: string;
  suggestedDuration: string;
  highlights: string[];
  savedAt: string;
}

function storageKey(username: string) {
  return `geoatlas_favorites_${username}`;
}

function loadFavorites(username: string): FavoriteVacation[] {
  try {
    const raw = localStorage.getItem(storageKey(username));
    return raw ? (JSON.parse(raw) as FavoriteVacation[]) : [];
  } catch {
    return [];
  }
}

function saveFavorites(username: string, favorites: FavoriteVacation[]) {
  localStorage.setItem(storageKey(username), JSON.stringify(favorites));
}

export function useFavorites(username: string) {
  const [favorites, setFavorites] = useState<FavoriteVacation[]>(() =>
    loadFavorites(username)
  );

  const addFavorite = useCallback(
    (rec: HolidayRecommendationOption) => {
      const newFav: FavoriteVacation = {
        id: `${rec.destinationCity}_${Date.now()}`,
        title: rec.title || `${rec.destinationCity}, ${rec.destinationCountry}`,
        destinationCity: rec.destinationCity,
        destinationCountry: rec.destinationCountry,
        reason: rec.reason,
        bestSeason: rec.bestSeason,
        estimatedBudget: rec.estimatedBudget,
        suggestedDuration: rec.suggestedDuration,
        highlights: rec.highlights ?? [],
        savedAt: new Date().toISOString(),
      };
      setFavorites((prev) => {
        const updated = [newFav, ...prev];
        saveFavorites(username, updated);
        return updated;
      });
    },
    [username]
  );

  const removeFavorite = useCallback(
    (id: string) => {
      setFavorites((prev) => {
        const updated = prev.filter((f) => f.id !== id);
        saveFavorites(username, updated);
        return updated;
      });
    },
    [username]
  );

  const isFavorite = useCallback(
    (rec: HolidayRecommendationOption) =>
      favorites.some((f) => f.destinationCity === rec.destinationCity),
    [favorites]
  );

  const removeFavoriteByCity = useCallback(
    (city: string) => {
      setFavorites((prev) => {
        const updated = prev.filter((f) => f.destinationCity !== city);
        saveFavorites(username, updated);
        return updated;
      });
    },
    [username]
  );

  return { favorites, addFavorite, removeFavorite, removeFavoriteByCity, isFavorite };
}
