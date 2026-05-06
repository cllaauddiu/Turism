import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { weatherApi, type TrackedCity, type WeatherHistoryEntry } from "~/lib/api";

interface Props {
  onClose: () => void;
}

const MAX_SELECTED = 5;
const RANGES = [
  { label: "7 zile", value: 7 },
  { label: "14 zile", value: 14 },
  { label: "30 zile", value: 30 },
  { label: "90 zile", value: 90 },
];

const METRICS: { key: keyof WeatherHistoryEntry; label: string; unit: string }[] = [
  { key: "temperature", label: "Temperatura", unit: "°C" },
  { key: "humidity", label: "Umiditate", unit: "%" },
  { key: "windSpeed", label: "Vant", unit: "km/h" },
  { key: "pressure", label: "Presiune", unit: "hPa" },
];

const COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ef4444", // red
  "#a855f7", // violet
];

export default function WeatherHistory({ onClose }: Props) {
  const [cities, setCities] = useState<TrackedCity[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [days, setDays] = useState(30);
  const [history, setHistory] = useState<WeatherHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCities, setLoadingCities] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load city list
  useEffect(() => {
    weatherApi
      .getCities()
      .then((data) => {
        setCities(data);
        // Pre-select first 3 (Cluj, Paris, Tokyo)
        const defaults = ["Cluj-Napoca", "Paris", "Tokyo"].filter((n) =>
          data.some((c) => c.name === n)
        );
        setSelected(defaults);
      })
      .catch((e) => setError(e?.message ?? "Eroare incarcare orase"))
      .finally(() => setLoadingCities(false));
  }, []);

  // Load history when selection or range changes
  useEffect(() => {
    if (selected.length === 0) {
      setHistory([]);
      return;
    }
    setLoading(true);
    setError(null);
    weatherApi
      .getHistory(selected, days)
      .then(setHistory)
      .catch((e) => setError(e?.message ?? "Eroare incarcare istoric"))
      .finally(() => setLoading(false));
  }, [selected, days]);

  const toggleCity = (name: string) => {
    setSelected((prev) => {
      if (prev.includes(name)) return prev.filter((n) => n !== name);
      if (prev.length >= MAX_SELECTED) return prev;
      return [...prev, name];
    });
  };

  // Group history by timestamp -> { time, [city1]: temp, [city2]: temp, ... }
  const chartData = useMemo(() => {
    return METRICS.map((metric) => {
      const byTime = new Map<string, Record<string, string | number>>();
      for (const entry of history) {
        const t = new Date(entry.recordedAt).toLocaleString("ro-RO", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
        if (!byTime.has(t)) byTime.set(t, { time: t });
        const row = byTime.get(t)!;
        row[entry.city] = entry[metric.key] as number;
      }
      const data = Array.from(byTime.values()).sort((a, b) =>
        String(a.time).localeCompare(String(b.time))
      );
      return { metric, data };
    });
  }, [history]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-200/80 backdrop-blur-sm p-4">
      <div className="bg-stone-100 border border-emerald-200/50 rounded-2xl shadow-2xl shadow-emerald-200/30 w-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-200/40 bg-stone-50/60">
          <div>
            <h2 className="text-emerald-700 font-bold tracking-widest text-sm uppercase font-mono">
              Istoric Vreme — Comparator
            </h2>
            <p className="text-stone-500 font-mono text-xs mt-0.5">
              Date colectate automat de la Open-Meteo · TimescaleDB
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded border border-red-300/60 text-red-700 hover:bg-red-100/30 hover:border-red-600 transition-all font-mono uppercase tracking-wider"
          >
            Inchide
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Sidebar — orase + interval */}
          <aside className="lg:w-72 lg:border-r border-emerald-200/40 p-4 overflow-y-auto bg-stone-50/30">
            <div className="mb-5">
              <p className="text-emerald-600 font-mono text-xs tracking-widest uppercase mb-2">
                Interval
              </p>
              <div className="grid grid-cols-2 gap-2">
                {RANGES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setDays(r.value)}
                    className={`px-3 py-2 rounded-lg font-mono text-xs transition-all ${
                      days === r.value
                        ? "bg-emerald-500/20 border border-emerald-600 text-emerald-800"
                        : "bg-stone-50/60 border border-stone-300 text-stone-600 hover:border-emerald-400/60"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-emerald-600 font-mono text-xs tracking-widest uppercase mb-2">
                Orase ({selected.length}/{MAX_SELECTED})
              </p>
              {loadingCities ? (
                <p className="text-stone-500 font-mono text-xs animate-pulse">
                  Se incarca...
                </p>
              ) : (
                <div className="space-y-1">
                  {cities.map((city) => {
                    const isSelected = selected.includes(city.name);
                    const colorIdx = selected.indexOf(city.name);
                    const disabled =
                      !isSelected && selected.length >= MAX_SELECTED;
                    return (
                      <button
                        key={city.name}
                        onClick={() => toggleCity(city.name)}
                        disabled={disabled}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-mono text-xs transition-all ${
                          isSelected
                            ? "bg-stone-50/80 border border-emerald-400/60"
                            : "bg-stone-50/30 border border-stone-300/60 hover:border-emerald-200/60"
                        } ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              backgroundColor: isSelected
                                ? COLORS[colorIdx % COLORS.length]
                                : "#244438",
                            }}
                          />
                          <div className="text-left min-w-0">
                            <p
                              className={`truncate ${
                                isSelected ? "text-emerald-800" : "text-stone-600"
                              }`}
                            >
                              {city.name}
                            </p>
                            <p className="text-stone-500 text-[10px] truncate">
                              {city.country}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          {/* Charts */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {error && (
              <div className="bg-red-100/30 border border-red-500/60 rounded-lg p-3 text-red-700 font-mono text-sm">
                {error}
              </div>
            )}

            {selected.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[300px]">
                <p className="text-stone-500 font-mono text-sm">
                  Selecteaza cel putin un oras pentru a afisa graficele.
                </p>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-full min-h-[300px]">
                <p className="text-emerald-700 font-mono text-sm animate-pulse">
                  Se incarca datele...
                </p>
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-2">
                <p className="text-stone-600 font-mono text-sm">
                  Nu exista date in baza pentru orasele si intervalul ales.
                </p>
                <p className="text-stone-500 font-mono text-xs">
                  Datele se acumuleaza la fiecare pornire a containerului si la
                  miezul noptii.
                </p>
              </div>
            ) : (
              chartData.map(({ metric, data }) => (
                <section
                  key={metric.key as string}
                  className="bg-stone-50/60 border border-emerald-200/40 rounded-xl p-4"
                >
                  <h3 className="text-emerald-700 font-mono text-xs tracking-widest uppercase mb-3">
                    {metric.label} ({metric.unit})
                  </h3>
                  <div style={{ width: "100%", height: 260 }}>
                    <ResponsiveContainer>
                      <LineChart data={data}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#ece5d6"
                        />
                        <XAxis
                          dataKey="time"
                          stroke="#3d6655"
                          tick={{ fontSize: 11, fontFamily: "monospace" }}
                        />
                        <YAxis
                          stroke="#3d6655"
                          tick={{ fontSize: 11, fontFamily: "monospace" }}
                          unit={metric.unit}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#f4efe6",
                            border: "1px solid #196b46",
                            borderRadius: "8px",
                            fontFamily: "monospace",
                            fontSize: "12px",
                          }}
                          labelStyle={{ color: "#196b46" }}
                        />
                        <Legend
                          wrapperStyle={{
                            fontFamily: "monospace",
                            fontSize: "11px",
                          }}
                        />
                        {selected.map((cityName, idx) => (
                          <Line
                            key={cityName}
                            type="monotone"
                            dataKey={cityName}
                            stroke={COLORS[idx % COLORS.length]}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              ))
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
