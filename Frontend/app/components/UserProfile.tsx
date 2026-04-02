import { useEffect, useState } from "react";
import { useAuth } from "~/hooks/useAuth";
import { fogApi, type FogProgress } from "~/lib/api";
import { useFavorites } from "~/hooks/useFavorites";

interface UserProfileProps {
  onClose: () => void;
}

type Tab = "info" | "favorites";

export default function UserProfile({ onClose }: UserProfileProps) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<FogProgress | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("info");

  const { favorites, removeFavorite } = useFavorites(user?.username ?? "");

  useEffect(() => {
    fogApi
      .getProgress()
      .then(setProgress)
      .catch(() => setProgress(null))
      .finally(() => setLoadingProgress(false));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!user) return null;

  const roleColor =
    user.role === "ADMIN"
      ? "text-yellow-400 border-yellow-700 bg-yellow-900/20"
      : "text-green-400 border-green-700 bg-green-900/20";

  const unlockedPercent =
    progress && progress.totalZones > 0
      ? Math.round((progress.unlockedZones / progress.totalZones) * 100)
      : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md bg-gray-950 border border-green-900/60 rounded-2xl shadow-2xl shadow-green-950/50 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Top accent bar */}
        <div className="h-1 w-full bg-linear-to-r from-green-700 via-emerald-500 to-teal-600 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-green-900/40 shrink-0">
          <span className="text-green-500 font-mono text-xs tracking-widest uppercase">◈ Profil Utilizator</span>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-green-400 transition-colors font-mono text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Avatar + Identity */}
        <div className="px-6 py-5 flex items-center gap-5 border-b border-green-900/30 shrink-0">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-green-900/40 border-2 border-green-600/60 flex items-center justify-center">
              <span className="text-2xl font-bold text-green-300 font-mono uppercase select-none">
                {user.username.charAt(0)}
              </span>
            </div>
            <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-gray-950" />
          </div>
          <div>
            <h2 className="text-white font-bold text-xl font-mono tracking-wide">{user.username}</h2>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded border font-mono uppercase tracking-wider ${roleColor}`}>
              {user.role}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-green-900/30 shrink-0">
          <TabBtn label="Informații" active={activeTab === "info"} onClick={() => setActiveTab("info")} />
          <TabBtn
            label={`Favorite ${favorites.length > 0 ? `(${favorites.length})` : ""}`}
            active={activeTab === "favorites"}
            onClick={() => setActiveTab("favorites")}
          />
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          {activeTab === "info" && (
            <div className="px-6 py-4 space-y-5">
              {/* Account info */}
              <div>
                <p className="text-green-600 font-mono text-xs uppercase tracking-widest mb-3">Informații Cont</p>
                <div className="space-y-2 font-mono text-sm">
                  <Row label="Utilizator" value={user.username} />
                  <Row label="Rol" value={user.role} />
                  <Row
                    label="Status"
                    value={
                      <span className="flex items-center gap-1.5 text-green-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
                        Online
                      </span>
                    }
                  />
                </div>
              </div>

              {/* Fog of War stats */}
              <div>
                <p className="text-green-600 font-mono text-xs uppercase tracking-widest mb-3">Progres Fog of War</p>
                {loadingProgress ? (
                  <div className="text-green-700 font-mono text-xs animate-pulse">Se încarcă statisticile...</div>
                ) : progress ? (
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="text-gray-500">Zone deblocate</span>
                        <span className="text-green-300">{progress.unlockedZones} / {progress.totalZones}</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-green-600 to-emerald-400 rounded-full transition-all duration-700"
                          style={{ width: `${unlockedPercent}%` }}
                        />
                      </div>
                      <div className="text-right text-xs font-mono text-green-700 mt-0.5">{unlockedPercent}%</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <StatMini label="Scor" value={String(progress.score)} />
                      <StatMini label="Active" value={String(progress.activeRiddles)} />
                      <StatMini label="Blocate" value={String(progress.totalZones - progress.unlockedZones - progress.activeRiddles)} />
                    </div>
                    {progress.lastUnlockedZone && (
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-gray-500">Ultima zonă</span>
                        <span className="text-emerald-300 truncate max-w-[60%] text-right">{progress.lastUnlockedZone}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-600 font-mono text-xs">Nu s-au putut încărca statisticile.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === "favorites" && (
            <div className="px-6 py-4">
              {favorites.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <span className="text-4xl">☆</span>
                  <p className="text-gray-500 font-mono text-sm">Nu ai vacante favorite încă.</p>
                  <p className="text-gray-700 font-mono text-xs">Apasă ★ pe o recomandare din Holiday Planner.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {favorites.map((fav) => (
                    <div
                      key={fav.id}
                      className="rounded-xl border border-indigo-900/40 bg-gray-900/60 p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-indigo-100 font-semibold text-sm font-mono">{fav.title}</p>
                          <p className="text-indigo-400 text-xs font-mono">{fav.destinationCity}, {fav.destinationCountry}</p>
                        </div>
                        <button
                          onClick={() => removeFavorite(fav.id)}
                          title="Elimină din favorite"
                          className="text-yellow-400 hover:text-red-400 transition-colors text-lg leading-none shrink-0"
                        >
                          ★
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono text-gray-500">
                        <span>Sezon: <span className="text-gray-300">{fav.bestSeason}</span></span>
                        <span>Buget: <span className="text-gray-300">{fav.estimatedBudget}</span></span>
                        <span>Durata: <span className="text-gray-300">{fav.suggestedDuration}</span></span>
                        <span>Salvat: <span className="text-gray-300">{new Date(fav.savedAt).toLocaleDateString("ro-RO")}</span></span>
                      </div>
                      {fav.highlights.length > 0 && (
                        <p className="text-xs text-gray-500 font-mono leading-relaxed">
                          {fav.highlights.slice(0, 2).join(" · ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-900/40 border-t border-green-900/30 shrink-0">
          <p className="text-green-900 font-mono text-xs text-center">GeoAtlas Platform · Sesiune activă</p>
        </div>
      </div>
    </div>
  );
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 text-xs font-mono uppercase tracking-widest transition-colors ${
        active
          ? "text-green-400 border-b-2 border-green-500 bg-green-900/10"
          : "text-gray-600 border-b-2 border-transparent hover:text-green-600"
      }`}
    >
      {label}
    </button>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500">{label}</span>
      <span className="text-green-300">{value}</span>
    </div>
  );
}

function StatMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center bg-gray-900/60 border border-green-900/40 rounded-lg py-2 px-1">
      <span className="text-green-300 font-bold text-base font-mono">{value}</span>
      <span className="text-gray-600 text-xs uppercase tracking-wider mt-0.5">{label}</span>
    </div>
  );
}
