import { useEffect, useMemo, useState } from "react";
import { chatApi, type HolidayRecommendationOption, type HolidayRecommendationRequest, type HolidayRecommendationResponse } from "~/lib/api";
import { useAuth } from "~/hooks/useAuth";
import { useFavorites } from "~/hooks/useFavorites";

interface HolidayPlannerProps {
  onClose: () => void;
}

type Option<T extends string> = { value: T; label: string };

const budgetOptions: Option<HolidayRecommendationRequest["logistics"]["budget"]>[] = [
  { value: "ECONOMIC", label: "Economic (sub 300 EUR)" },
  { value: "MEDIUM", label: "Mediu (300 - 800 EUR)" },
  { value: "PREMIUM", label: "Premium (800 - 2000 EUR)" },
  { value: "LUXURY", label: "Lux (peste 2000 EUR)" },
];

const durationOptions: Option<HolidayRecommendationRequest["logistics"]["duration"]>[] = [
  { value: "CITY_BREAK", label: "City Break (1-3 zile)" },
  { value: "ONE_WEEK", label: "O saptamana de deconectare (4-7 zile)" },
  { value: "EXTENDED", label: "Calatorie extinsa (peste 8 zile)" },
];

const distanceOptions: Option<HolidayRecommendationRequest["logistics"]["distanceRegion"]>[] = [
  { value: "NEAR_HOME", label: "Aproape de casa (Europa de Est / Balcani)" },
  { value: "MEDIUM_FLIGHT", label: "Zbor mediu (Europa, 2-4 ore)" },
  { value: "EXOTIC", label: "Destinatie exotica / indepartata" },
];

const companionOptions: Option<HolidayRecommendationRequest["logistics"]["companion"]>[] = [
  { value: "SOLO", label: "Calator singur (Solo)" },
  { value: "COUPLE", label: "In cuplu" },
  { value: "FAMILY", label: "Familie cu copii" },
  { value: "FRIENDS", label: "Grup de prieteni" },
];

const goalOptions: Option<HolidayRecommendationRequest["experience"]["goal"]>[] = [
  { value: "RELAX", label: "Relaxare totala" },
  { value: "CULTURE", label: "Explorare culturala" },
  { value: "ADVENTURE", label: "Aventura in natura" },
  { value: "NIGHTLIFE", label: "Viata de noapte si distractie" },
];

const climateOptions: Option<HolidayRecommendationRequest["experience"]["climate"]>[] = [
  { value: "WARM", label: "Cald si soare" },
  { value: "TEMPERATE", label: "Temperat" },
  { value: "COLD", label: "Racoros / Zapada" },
];

const paceOptions: Option<HolidayRecommendationRequest["experience"]["pace"]>[] = [
  { value: "SLOW", label: "Lent" },
  { value: "BALANCED", label: "Echilibrat" },
  { value: "INTENSE", label: "Intens" },
];

const accommodationOptions: Option<HolidayRecommendationRequest["comfort"]["accommodation"]>[] = [
  { value: "ALL_INCLUSIVE", label: "Resort All-Inclusive" },
  { value: "CHAIN_HOTEL", label: "Hotel de lant" },
  { value: "BOUTIQUE", label: "Pensiune / Boutique Hotel" },
  { value: "APARTMENT", label: "Apartament / Airbnb" },
];

const gastronomyOptions: Option<HolidayRecommendationRequest["comfort"]["gastronomy"]>[] = [
  { value: "EXPLORER", label: "Explorator (street-food, local)" },
  { value: "BALANCED", label: "Echilibrat (restaurante bune)" },
  { value: "FINE_DINING", label: "Fine Dining" },
];

const crowdOptions: Option<HolidayRecommendationRequest["comfort"]["crowd"]>[] = [
  { value: "FAMOUS", label: "Obiective faimoase" },
  { value: "HIDDEN_GEMS", label: "Ascunse / Off-the-beaten-path" },
];

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-indigo-300 font-mono">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="rounded-md bg-gray-900 border border-indigo-900/50 text-gray-100 px-3 py-2 text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function HolidayPlanner({ onClose }: HolidayPlannerProps) {
  const { user } = useAuth();
  const { addFavorite, removeFavoriteByCity, isFavorite } = useFavorites(user?.username ?? "");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HolidayRecommendationResponse | null>(null);

  const [form, setForm] = useState<HolidayRecommendationRequest>({
    logistics: {
      budget: "MEDIUM",
      duration: "ONE_WEEK",
      distanceRegion: "MEDIUM_FLIGHT",
      companion: "COUPLE",
    },
    experience: {
      goal: "CULTURE",
      climate: "TEMPERATE",
      pace: "BALANCED",
    },
    comfort: {
      accommodation: "BOUTIQUE",
      gastronomy: "BALANCED",
      crowd: "HIDDEN_GEMS",
    },
    recommendationsCount: 4,
    enrichWithTurismData: true,
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const canGoBack = step > 1;
  const canGoNext = step < 3;

  const stepTitle = useMemo(() => {
    if (step === 1) return "Pasul 1/3 - Detalii logistice";
    if (step === 2) return "Pasul 2/3 - Experienta si atmosfera";
    return "Pasul 3/3 - Confort si stil";
  }, [step]);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await chatApi.recommendHoliday(form);
      setResult(response);
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { data?: { error?: string } } }).response?.data?.error
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : "Nu am putut genera recomandarile acum.";
      setError(message ?? "Nu am putut genera recomandarile acum.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = (rec: HolidayRecommendationOption) => {
    if (isFavorite(rec)) {
      removeFavoriteByCity(rec.destinationCity);
    } else {
      addFavorite(rec);
      setToastMsg(`${rec.destinationCity} adăugat la favorite!`);
      setTimeout(() => setToastMsg(null), 2500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-6xl h-[86vh] bg-gray-950 rounded-2xl border border-indigo-900/50 overflow-hidden shadow-2xl shadow-indigo-950/40 flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-indigo-900/40 bg-gray-950/90">
          <div>
            <h2 className="text-indigo-300 font-mono font-bold text-sm tracking-widest uppercase">Holiday AI Planner</h2>
            <p className="text-indigo-800 font-mono text-xs">Alege criteriile si primesti vacante recomandate</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-red-400 text-xl leading-none font-mono">X</button>
        </div>

        {/* Toast notification */}
        {toastMsg && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 bg-indigo-900/90 border border-indigo-500/60 text-indigo-100 text-xs font-mono px-4 py-2 rounded-lg shadow-lg">
            ★ {toastMsg}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="text-indigo-200 font-mono text-sm">{stepTitle}</div>

          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <SelectField label="Buget" value={form.logistics.budget} options={budgetOptions} onChange={(value) => setForm((prev) => ({ ...prev, logistics: { ...prev.logistics, budget: value } }))} />
              <SelectField label="Durata" value={form.logistics.duration} options={durationOptions} onChange={(value) => setForm((prev) => ({ ...prev, logistics: { ...prev.logistics, duration: value } }))} />
              <SelectField label="Distanta / Regiune" value={form.logistics.distanceRegion} options={distanceOptions} onChange={(value) => setForm((prev) => ({ ...prev, logistics: { ...prev.logistics, distanceRegion: value } }))} />
              <SelectField label="Compania" value={form.logistics.companion} options={companionOptions} onChange={(value) => setForm((prev) => ({ ...prev, logistics: { ...prev.logistics, companion: value } }))} />
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <SelectField label="Scop principal" value={form.experience.goal} options={goalOptions} onChange={(value) => setForm((prev) => ({ ...prev, experience: { ...prev.experience, goal: value } }))} />
              <SelectField label="Clima" value={form.experience.climate} options={climateOptions} onChange={(value) => setForm((prev) => ({ ...prev, experience: { ...prev.experience, climate: value } }))} />
              <SelectField label="Ritmul vacantei" value={form.experience.pace} options={paceOptions} onChange={(value) => setForm((prev) => ({ ...prev, experience: { ...prev.experience, pace: value } }))} />
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <SelectField label="Tip cazare" value={form.comfort.accommodation} options={accommodationOptions} onChange={(value) => setForm((prev) => ({ ...prev, comfort: { ...prev.comfort, accommodation: value } }))} />
              <SelectField label="Gastronomie" value={form.comfort.gastronomy} options={gastronomyOptions} onChange={(value) => setForm((prev) => ({ ...prev, comfort: { ...prev.comfort, gastronomy: value } }))} />
              <SelectField label="Aglomeratie" value={form.comfort.crowd} options={crowdOptions} onChange={(value) => setForm((prev) => ({ ...prev, comfort: { ...prev.comfort, crowd: value } }))} />
              <label className="flex items-center gap-2 text-xs text-indigo-300 font-mono mt-6">
                <input
                  type="checkbox"
                  checked={form.enrichWithTurismData ?? true}
                  onChange={(e) => setForm((prev) => ({ ...prev, enrichWithTurismData: e.target.checked }))}
                />
                Include date live Turism (events/places)
              </label>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={!canGoBack || loading}
              className="px-4 py-2 rounded border border-indigo-900/50 text-indigo-300 disabled:opacity-40"
            >
              Inapoi
            </button>

            {canGoNext ? (
              <button
                onClick={() => setStep((s) => Math.min(3, s + 1))}
                disabled={loading}
                className="px-4 py-2 rounded border border-indigo-600/60 text-indigo-200"
              >
                Urmatorul
              </button>
            ) : (
              <button
                onClick={() => { void generate(); }}
                disabled={loading}
                className="px-4 py-2 rounded border border-indigo-500/70 text-indigo-100 disabled:opacity-40"
              >
                {loading ? "Se genereaza..." : "Genereaza vacante"}
              </button>
            )}
          </div>

          {error && <div className="text-red-400 text-sm font-mono">{error}</div>}

          {result && (
            <div className="pt-3 space-y-3">
              <div className="text-indigo-300 text-xs font-mono uppercase tracking-widest">
                Recomandari AI ({result.recommendations.length})
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.recommendations.map((rec, idx) => (
                  <div key={`${rec.destinationCity}-${idx}`} className="rounded-xl border border-indigo-900/50 bg-gray-900/70 p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-indigo-100 font-semibold text-base">
                        {rec.title || `${rec.destinationCity}, ${rec.destinationCountry}`}
                      </div>
                      <button
                        onClick={() => handleToggleFavorite(rec)}
                        title={isFavorite(rec) ? "Elimină din favorite" : "Adaugă la favorite"}
                        className={`shrink-0 text-lg transition-all duration-200 hover:scale-125 ${
                          isFavorite(rec) ? "text-yellow-400" : "text-gray-600 hover:text-yellow-400"
                        }`}
                      >
                        {isFavorite(rec) ? "★" : "☆"}
                      </button>
                    </div>
                    <div className="text-indigo-300 text-sm">
                      {rec.destinationCity}, {rec.destinationCountry}
                    </div>
                    <div className="text-gray-300 text-sm leading-relaxed">{rec.reason}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                      <div>Sezon: {rec.bestSeason}</div>
                      <div>Buget: {rec.estimatedBudget}</div>
                      <div>Durata: {rec.suggestedDuration}</div>
                      <div>Ritm: {rec.pace}</div>
                    </div>

                    {rec.highlights?.length > 0 && (
                      <div className="text-xs text-gray-300">Highlight: {rec.highlights.slice(0, 3).join(", ")}</div>
                    )}

                    {rec.events?.length > 0 && (
                      <div className="text-xs text-fuchsia-300">Evenimente: {rec.events.slice(0, 2).map((event) => event.name).join(" | ")}</div>
                    )}

                    {rec.places?.length > 0 && (
                      <div className="text-xs text-emerald-300">Locuri: {rec.places.slice(0, 2).map((place) => place.name).join(" | ")}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

