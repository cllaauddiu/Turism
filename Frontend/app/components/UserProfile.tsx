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
      ? "text-amber-700 border-amber-500 bg-amber-100/20"
      : "text-emerald-700 border-emerald-400 bg-emerald-100/20";

  const unlockedPercent =
    progress && progress.totalZones > 0
      ? Math.round((progress.unlockedZones / progress.totalZones) * 100)
      : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: "rgba(40,30,10,0.40)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full h-full sm:h-auto sm:max-w-md bg-[#fbf6ec] border-0 sm:border border-emerald-300/60 rounded-none sm:rounded-sm shadow-[0_30px_80px_-30px_rgba(25,107,70,0.35)] overflow-hidden flex flex-col sm:max-h-[88vh] font-mono">
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-700 shrink-0" />

        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-4 border-b border-emerald-300/50 shrink-0 bg-[#f4efe6]/60"><span className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />
          <span className="text-emerald-600 font-mono text-xs tracking-widest uppercase">◈ Profil Utilizator</span>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-emerald-700 transition-colors font-mono text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Avatar + Identity */}
        <div className="px-6 py-5 flex items-center gap-5 border-b border-emerald-200/30 shrink-0">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-emerald-100/40 border-2 border-emerald-500/60 flex items-center justify-center">
              <span className="text-2xl font-bold text-emerald-800 font-mono uppercase select-none">
                {user.username.charAt(0)}
              </span>
            </div>
            <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-stone-300" />
          </div>
          <div>
            <h2 className="text-stone-900 font-bold text-xl font-mono tracking-wide">{user.username}</h2>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded border font-mono uppercase tracking-wider ${roleColor}`}>
              {user.role}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-emerald-200/30 shrink-0">
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
                <p className="text-emerald-700 font-mono text-xs uppercase tracking-widest mb-3">Informații Cont</p>
                <div className="space-y-2 font-mono text-sm">
                  <Row label="Utilizator" value={user.username} />
                  <Row label="Rol" value={user.role} />
                  <Row
                    label="Status"
                    value={
                      <span className="flex items-center gap-1.5 text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                        Online
                      </span>
                    }
                  />
                </div>
              </div>

              {/* Fog of War stats */}
              <div>
                <p className="text-emerald-700 font-mono text-xs uppercase tracking-widest mb-3">Progres Fog of War</p>
                {loadingProgress ? (
                  <div className="text-stone-500 font-mono text-xs animate-pulse">Se încarcă statisticile...</div>
                ) : progress ? (
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="text-stone-500">Zone deblocate</span>
                        <span className="text-emerald-800">{progress.unlockedZones} / {progress.totalZones}</span>
                      </div>
                      <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-700 to-emerald-500 rounded-full transition-all duration-700"
                          style={{ width: `${unlockedPercent}%` }}
                        />
                      </div>
                      <div className="text-right text-xs font-mono text-stone-500 mt-0.5">{unlockedPercent}%</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <StatMini label="Scor" value={String(progress.score)} />
                      <StatMini label="Active" value={String(progress.activeRiddles)} />
                      <StatMini label="Blocate" value={String(progress.totalZones - progress.unlockedZones - progress.activeRiddles)} />
                    </div>
                    {progress.lastUnlockedZone && (
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-stone-500">Ultima zonă</span>
                        <span className="text-emerald-800 truncate max-w-[60%] text-right">{progress.lastUnlockedZone}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-stone-500 font-mono text-xs">Nu s-au putut încărca statisticile.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === "favorites" && (
            <div className="px-6 py-4">
              {favorites.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <span className="text-4xl">☆</span>
                  <p className="text-stone-500 font-mono text-sm">Nu ai vacante favorite încă.</p>
                  <p className="text-stone-400 font-mono text-xs">Apasă ★ pe o recomandare din Holiday Planner.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {favorites.map((fav) => (
                    <div
                      key={fav.id}
                      className="rounded-sm border border-emerald-300/60 bg-[#fbf6ec]/80 p-4 space-y-2 hover:border-emerald-500 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-stone-900 font-semibold text-sm font-mono">{fav.title}</p>
                          <p className="text-emerald-700 text-xs font-mono tracking-wider">{fav.destinationCity}, {fav.destinationCountry}</p>
                        </div>
                        <button
                          onClick={() => removeFavorite(fav.id)}
                          title="Elimină din favorite"
                          className="text-amber-700 hover:text-red-700 transition-colors text-lg leading-none shrink-0"
                        >
                          ★
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono text-stone-500">
                        <span>Sezon: <span className="text-stone-700">{fav.bestSeason}</span></span>
                        <span>Buget: <span className="text-stone-700">{fav.estimatedBudget}</span></span>
                        <span>Durata: <span className="text-stone-700">{fav.suggestedDuration}</span></span>
                        <span>Salvat: <span className="text-stone-700">{new Date(fav.savedAt).toLocaleDateString("ro-RO")}</span></span>
                      </div>
                      {fav.highlights.length > 0 && (
                        <p className="text-xs text-stone-500 font-mono leading-relaxed">
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
        <div className="px-6 py-3 bg-stone-50/40 border-t border-emerald-200/30 shrink-0">
          <p className="text-stone-400 font-mono text-xs text-center">GeoAtlas Platform · Sesiune activă</p>
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
          ? "text-emerald-700 border-b-2 border-emerald-600 bg-emerald-100/10"
          : "text-stone-500 border-b-2 border-transparent hover:text-emerald-700"
      }`}
    >
      {label}
    </button>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-stone-500">{label}</span>
      <span className="text-emerald-800">{value}</span>
    </div>
  );
}

function StatMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center bg-stone-50/60 border border-emerald-200/40 rounded-sm py-2 px-1">
      <span className="text-emerald-800 font-bold text-base font-mono">{value}</span>
      <span className="text-stone-500 text-xs uppercase tracking-wider mt-0.5">{label}</span>
    </div>
  );
}
