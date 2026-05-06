import { useEffect, useState, lazy, Suspense, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/hooks/useAuth";
import {
  weatherApi,
  fogApi,
  type WeatherData,
  type FogProgress,
  type LeaderboardEntry,
} from "~/lib/api";
import { CartoBackground, SectionRule } from "~/components/dashboard/atlas";
import {
  TopStrip,
  MissionHeader,
  FeatureGrid,
  BigStat,
  LiveWeatherWidget,
  FogProgressWidget,
  LeaderboardMiniWidget,
  CommandFeed,
  SessionPanel,
  CoordReadout,
  type FeatureKey,
} from "~/components/dashboard/widgets";

const InteractiveMap   = lazy(() => import("~/components/InteractiveMap"));
const GeoSearch        = lazy(() => import("~/components/GeoSearch"));
const FogOfWar         = lazy(() => import("~/components/FogOfWar"));
const ChatBox          = lazy(() => import("~/components/ChatBox"));
const HolidayPlanner   = lazy(() => import("~/components/HolidayPlanner"));
const UserProfile      = lazy(() => import("~/components/UserProfile"));
const WeatherHistory   = lazy(() => import("~/components/WeatherHistory"));

export default function ClientDashboard() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  const [showMap, setShowMap] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showFog, setShowFog] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showHolidayPlanner, setShowHolidayPlanner] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showWeatherHistory, setShowWeatherHistory] = useState(false);
  const [mapFlyTo, setMapFlyTo] = useState<{ lat: number; lon: number; name: string } | null>(null);
  const [chatInitialTab, setChatInitialTab] = useState<"ai" | "admin">("ai");

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherAge, setWeatherAge] = useState<string>("loading...");
  const [fogProgress, setFogProgress] = useState<FogProgress | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);

  // ── Auth guard ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/auth");
  }, [loading, isAuthenticated, navigate]);

  // ── External "open chat" trigger (notification click) ────────────────
  useEffect(() => {
    const open = () => { setChatInitialTab("admin"); setShowChat(true); };
    window.addEventListener("open-chat-client", open);
    return () => window.removeEventListener("open-chat-client", open);
  }, []);

  // ── Live data: București weather ─────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    const fetchWeather = async () => {
      try {
        const w = await weatherApi.getWeather(44.4268, 26.1025);
        if (!mounted) return;
        setWeather(w);
        setWeatherAge(new Date().toLocaleTimeString("ro-RO"));
      } catch {
        if (mounted) setWeatherAge("offline");
      }
    };
    fetchWeather();
    const id = setInterval(fetchWeather, 5 * 60_000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  // ── Fog progress + leaderboard (REST poll, simple) ───────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    let mounted = true;
    const load = async () => {
      try {
        const [p, lb] = await Promise.all([
          fogApi.getProgress().catch(() => null),
          fogApi.getLeaderboard().catch(() => null),
        ]);
        if (!mounted) return;
        if (p) setFogProgress(p);
        if (lb) setLeaderboard(lb);
      } catch { /* swallow */ }
    };
    load();
    const id = setInterval(load, 30_000);
    return () => { mounted = false; clearInterval(id); };
  }, [isAuthenticated]);

  // ── Feature dispatcher ────────────────────────────────────────────────
  const handleLaunch = useCallback((k: FeatureKey) => {
    switch (k) {
      case "map":     setShowMap(true); break;
      case "fog":     setShowFog(true); break;
      case "search":  setShowSearch(true); break;
      case "chat":    setChatInitialTab("ai"); setShowChat(true); break;
      case "holiday": setShowHolidayPlanner(true); break;
      case "weather": setShowWeatherHistory(true); break;
      case "profile": setShowProfile(true); break;
    }
  }, []);

  const handleLogout = () => { logout(); navigate("/auth"); };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f4efe6] text-stone-900 relative overflow-x-hidden">
      <CartoBackground />

      <TopStrip
        user={user}
        onProfile={() => setShowProfile(true)}
        onLogout={handleLogout}
      />

      <MissionHeader user={user} onLaunch={handleLaunch} />

      {/* ── Big atlas stats ribbon ── */}
      <section className="relative z-10 px-4 sm:px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <SectionRule label="Indicatori Globali" sub="state · suprafata · oceane" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <BigStat label="Tari"        value="195" unit="state suverane"  foot="ONU·2026" />
            <BigStat label="Suprafata"   value="510" unit="milioane km²"    foot="GIS" />
            <BigStat label="Continente"  value="7"   unit="mase de uscat"   foot="GEO" />
            <BigStat label="Oceane"      value="5"   unit="bazine oceanice" foot="HYDRO" />
          </div>
        </div>
      </section>

      <FeatureGrid onLaunch={handleLaunch} />

      {/* ── Live console row: weather + fog + leaderboard ── */}
      <section className="relative z-10 px-4 sm:px-6 pb-10">
        <div className="max-w-7xl mx-auto">
          <SectionRule label="Telemetrie Live" sub="weather · fog · ranking" />
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-5">
              <LiveWeatherWidget data={weather} age={weatherAge} />
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-4">
              <FogProgressWidget progress={fogProgress} onLaunch={handleLaunch} />
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <LeaderboardMiniWidget rows={leaderboard} currentUser={user.username} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Session + command feed ── */}
      <section className="relative z-10 px-4 sm:px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          <SectionRule label="Sesiune + Jurnal" sub="local · stdout" />
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-5">
              <SessionPanel
                user={user}
                onChangePwd={() => setShowProfile(true)}
                onPrefs={() => setShowProfile(true)}
                onLogout={handleLogout}
              />
            </div>
            <div className="col-span-12 lg:col-span-7">
              <CommandFeed />
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-emerald-300/40 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-2 font-mono">
        <p className="text-stone-500 text-xs">
          © 2026 GeoAtlas · WGS84 · Mercator 1:50 000 000
        </p>
        <p className="text-stone-500 text-xs tracking-widest uppercase">
          v1.0 · sector EU/RO
        </p>
      </footer>

      <CoordReadout />

      {/* ── Modals (lazy) ── */}
      {showMap && (
        <Suspense fallback={<LoadingShell label="Se incarca harta..." />}>
          <InteractiveMap
            onClose={() => { setShowMap(false); setMapFlyTo(null); }}
            flyTo={mapFlyTo ?? undefined}
          />
        </Suspense>
      )}
      {showSearch && (
        <Suspense fallback={<LoadingShell label="Se incarca..." />}>
          <GeoSearch
            onClose={() => setShowSearch(false)}
            onViewOnMap={(lat, lon, name) => {
              setMapFlyTo({ lat, lon, name });
              setShowSearch(false);
              setShowMap(true);
            }}
          />
        </Suspense>
      )}
      {showChat && (
        <Suspense fallback={<LoadingShell label="Se incarca chat..." />}>
          <ChatBox onClose={() => setShowChat(false)} initialTab={chatInitialTab} />
        </Suspense>
      )}
      {showHolidayPlanner && (
        <Suspense fallback={<LoadingShell label="Se incarca planner-ul..." />}>
          <HolidayPlanner onClose={() => setShowHolidayPlanner(false)} />
        </Suspense>
      )}
      {showProfile && (
        <Suspense fallback={<LoadingShell label="Se incarca profilul..." />}>
          <UserProfile onClose={() => setShowProfile(false)} />
        </Suspense>
      )}
      {showWeatherHistory && (
        <Suspense fallback={<LoadingShell label="Se incarca istoricul..." />}>
          <WeatherHistory onClose={() => setShowWeatherHistory(false)} />
        </Suspense>
      )}
      {showFog && (
        <Suspense fallback={<LoadingShell label="Se incarca jocul..." />}>
          <FogOfWar onClose={() => setShowFog(false)} />
        </Suspense>
      )}
    </div>
  );
}

function LoadingShell({ label }: { label: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-200/80 backdrop-blur-sm">
      <div className="text-emerald-700 font-mono text-sm animate-pulse">{label}</div>
    </div>
  );
}
