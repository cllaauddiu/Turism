import axios from "axios";

const API_BASE_URL = typeof window !== "undefined"
  ? "/api"
  : (process.env.API_URL ?? "http://user-service:8081");

const WEATHER_BASE_URL = typeof window !== "undefined"
  ? "/weather"
  : (process.env.WEATHER_URL ?? "http://weather-service:8082/weather");

const TURISM_BASE_URL = typeof window !== "undefined"
  ? "/api/turism"
  : (process.env.TURISM_URL ?? "http://turism-service:8085/api/turism");

const CHATBOX_BASE_URL = typeof window !== "undefined"
  ? "/chatbox"
  : (process.env.CHATBOX_URL ?? "http://chatbox-service:8086/chatbox");

const GAMES_BASE_URL = typeof window !== "undefined"
  ? "/games"
  : (process.env.GAMES_URL ?? "http://games-service:8084");

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  email: string;
  role: string;
}

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<AuthResponse>("/auth/login", data).then((r) => r.data),
  register: (data: RegisterRequest) =>
    api.post<AuthResponse>("/auth/register", data).then((r) => r.data),
};

// ── Users (Admin) ─────────────────────────────────────────────────────────────

export type UserRole = "ADMIN" | "CLIENT";

export interface UserDTO {
  id: number;
  username: string;
  role: UserRole;
}

export interface CreateUserRequest {
  username: string;
  password: string;
}

export interface UpdateUserRequest {
  username: string;
  password?: string;
}

export interface ChangeRoleRequest {
  role: UserRole;
}

export const usersApi = {
  getAll: () =>
    api.get<UserDTO[]>("/users").then((r) => r.data),
  getById: (id: number) =>
    api.get<UserDTO>(`/users/${id}`).then((r) => r.data),
  create: (data: CreateUserRequest) =>
    api.post<UserDTO>("/users", data).then((r) => r.data),
  update: (id: number, data: UpdateUserRequest) =>
    api.put<UserDTO>(`/users/${id}`, data).then((r) => r.data),
  delete: (id: number) =>
    api.delete(`/users/${id}`).then((r) => r.data),
  changeRole: (id: number, data: ChangeRoleRequest) =>
    api.patch<UserDTO>(`/users/${id}/role`, data).then((r) => r.data),
};

// ── Weather ───────────────────────────────────────────────────────────────────

export interface WeatherData {
  resolvedAddress: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  windDirectionLabel: string;
  uvIndex: number;
  visibility: number;
  cloudCover: number;
  precipProbability: number;
  pressure: number;
  dewPoint: number;
  conditions: string;
  icon: string;
  description: string;
  tempMax: number;
  tempMin: number;
  sunrise: string;
  sunset: string;
}

const weatherAxios = axios.create({
  baseURL: WEATHER_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export const weatherApi = {
  getWeather: (lat: number, lon: number) =>
    weatherAxios.get<WeatherData>("", { params: { lat, lon } }).then((r) => r.data),
};

// ── Turism ───────────────────────────────────────────────────────────────────

export interface TourismEvent {
  id: string;
  name: string;
  url: string;
  date: string | null;
  time: string | null;
  venue: string | null;
  city: string | null;
  imageUrl: string | null;
}

export interface TourismPlace {
  id: string;
  name: string;
  address: string | null;
  rating: number | null;
  userRatingsTotal: number | null;
  types: string[];
  latitude: number | null;
  longitude: number | null;
  googleMapsUrl: string | null;
  imageUrl: string | null;
}

const turismAxios = axios.create({
  baseURL: TURISM_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export const turismApi = {
  getEvents: (
    lat?: number,
    lon?: number,
    radius = 30,
    size = 6,
    keyword?: string,
    city?: string,
  ) =>
    turismAxios
      .get<TourismEvent[]>("/events", { params: { lat, lon, radius, size, keyword, city } })
      .then((r) => r.data),
  getPlaces: (lat: number, lon: number, radius = 3000, size = 6, keyword?: string, type?: string) =>
    turismAxios
      .get<TourismPlace[]>("/places", { params: { lat, lon, radius, size, keyword, type } })
      .then((r) => r.data),
};

// ── ChatBox ──────────────────────────────────────────────────────────────────

export interface ChatMessageRequest {
  message: string;
}

export interface ChatMessageResponse {
  answer: string;
  model: string;
  prompt: string;
}

export type HolidayBudget = "ECONOMIC" | "MEDIUM" | "PREMIUM" | "LUXURY";
export type HolidayDuration = "CITY_BREAK" | "ONE_WEEK" | "EXTENDED";
export type HolidayDistanceRegion = "NEAR_HOME" | "MEDIUM_FLIGHT" | "EXOTIC";
export type HolidayCompanion = "SOLO" | "COUPLE" | "FAMILY" | "FRIENDS";
export type HolidayGoal = "RELAX" | "CULTURE" | "ADVENTURE" | "NIGHTLIFE";
export type HolidayClimate = "WARM" | "TEMPERATE" | "COLD";
export type HolidayPace = "SLOW" | "BALANCED" | "INTENSE";
export type HolidayAccommodation = "ALL_INCLUSIVE" | "CHAIN_HOTEL" | "BOUTIQUE" | "APARTMENT";
export type HolidayGastronomy = "EXPLORER" | "BALANCED" | "FINE_DINING";
export type HolidayCrowd = "FAMOUS" | "HIDDEN_GEMS";

export interface HolidayRecommendationRequest {
  logistics: {
    budget: HolidayBudget;
    duration: HolidayDuration;
    distanceRegion: HolidayDistanceRegion;
    companion: HolidayCompanion;
  };
  experience: {
    goal: HolidayGoal;
    climate: HolidayClimate;
    pace: HolidayPace;
  };
  comfort: {
    accommodation: HolidayAccommodation;
    gastronomy: HolidayGastronomy;
    crowd: HolidayCrowd;
  };
  recommendationsCount?: number;
  enrichWithTurismData?: boolean;
}

export interface HolidayRecommendationOption {
  destinationCity: string;
  destinationCountry: string;
  title: string;
  reason: string;
  bestSeason: string;
  estimatedBudget: string;
  suggestedDuration: string;
  climate: string;
  pace: string;
  highlights: string[];
  latitude: number | null;
  longitude: number | null;
  events: TourismEvent[];
  places: TourismPlace[];
}

export interface HolidayRecommendationResponse {
  recommendations: HolidayRecommendationOption[];
  model: string;
  source: string;
}

const chatboxAxios = axios.create({
  baseURL: CHATBOX_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export const chatApi = {
  sendMessage: (message: string) =>
    chatboxAxios
      .post<ChatMessageResponse>("/messages", { message } satisfies ChatMessageRequest)
      .then((r) => r.data),
  recommendHoliday: (payload: HolidayRecommendationRequest) =>
    chatboxAxios
      .post<HolidayRecommendationResponse>("/holiday/recommend", payload)
      .then((r) => r.data),
};

// ── Fog of War Game ───────────────────────────────────────────────────────────

export type ZoneStatus = "LOCKED" | "RIDDLE_ACTIVE" | "UNLOCKED";

export interface FogZone {
  id: number;
  name: string;
  continent: string;
  lat: number;
  lng: number;
  bboxSouth: number;
  bboxWest: number;
  bboxNorth: number;
  bboxEast: number;
  landmarkDescription: string | null;
  difficulty: number;
  emoji: string;
  status: ZoneStatus;
}

export interface FogRiddle {
  zoneId: number;
  zoneName: string;
  question: string;
  hint: string;
  difficulty: number;
  options: string[]; // ["A: ...", "B: ...", "C: ...", "D: ..."]
}

export interface FogUnlockResult {
  success: boolean;
  message: string;
  landmarkDescription?: string;
  zoneName?: string;
  emoji?: string;
  zoneId?: number;
  hint?: string;
}

export interface FogProgress {
  totalZones: number;
  unlockedZones: number;
  activeRiddles: number;
  lastUnlockedZone: string | null;
  score: number;
}

const gamesAxios = axios.create({
  baseURL: GAMES_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

gamesAxios.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const fogApi = {
  getZones: () =>
    gamesAxios.get<FogZone[]>("/fog/zones").then((r) => r.data),
  getRiddle: (zoneId: number) =>
    gamesAxios.get<FogRiddle>(`/fog/zones/${zoneId}/riddle`).then((r) => r.data),
  submitAnswer: (zoneId: number, answer: string) =>
    gamesAxios.post<FogUnlockResult>(`/fog/zones/${zoneId}/unlock`, { answer }).then((r) => r.data),
  getProgress: () =>
    gamesAxios.get<FogProgress>("/fog/progress").then((r) => r.data),
};

