import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/hooks/useAuth";

const InteractiveMap = lazy(() => import("~/components/InteractiveMap"));
const GeoSearch = lazy(() => import("~/components/GeoSearch"));
const FogOfWar = lazy(() => import("~/components/FogOfWar"));
const ChatBox = lazy(() => import("~/components/ChatBox"));
const HolidayPlanner = lazy(() => import("~/components/HolidayPlanner"));
const UserProfile = lazy(() => import("~/components/UserProfile"));
const WeatherHistory = lazy(() => import("~/components/WeatherHistory"));

// ── SVG World Map (simplified continents as decorative paths) ──────────────
function WorldMapSVG() {
  return (
    <svg
      viewBox="0 0 1000 500"
      className="w-full h-full opacity-20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Grid lines – parallels */}
      {[50, 100, 150, 200, 250, 300, 350, 400, 450].map((y) => (
        <line key={`h${y}`} x1="0" y1={y} x2="1000" y2={y} stroke="#4ade80" strokeWidth="0.4" />
      ))}
      {/* Grid lines – meridians */}
      {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((x) => (
        <line key={`v${x}`} x1={x} y1="0" x2={x} y2="500" stroke="#4ade80" strokeWidth="0.4" />
      ))}

      {/* North America */}
      <path
        d="M 120 60 L 160 55 L 220 70 L 240 100 L 260 130 L 250 160 L 230 200 L 210 230 L 180 260 L 160 250 L 140 220 L 120 180 L 100 150 L 90 120 L 100 90 Z"
        fill="#4ade80"
        stroke="#22c55e"
        strokeWidth="1"
      />
      {/* Greenland */}
      <path
        d="M 230 30 L 270 25 L 290 40 L 280 65 L 250 70 L 230 55 Z"
        fill="#4ade80"
        stroke="#22c55e"
        strokeWidth="1"
      />
      {/* South America */}
      <path
        d="M 200 270 L 230 260 L 250 280 L 260 310 L 255 350 L 240 390 L 220 420 L 200 410 L 185 380 L 180 340 L 185 300 Z"
        fill="#4ade80"
        stroke="#22c55e"
        strokeWidth="1"
      />
      {/* Europe */}
      <path
        d="M 460 60 L 500 55 L 530 65 L 540 85 L 520 100 L 500 110 L 480 105 L 460 90 Z"
        fill="#4ade80"
        stroke="#22c55e"
        strokeWidth="1"
      />
      {/* Africa */}
      <path
        d="M 470 120 L 530 115 L 560 130 L 565 160 L 560 200 L 545 240 L 520 280 L 500 300 L 480 295 L 460 270 L 450 230 L 448 190 L 450 150 Z"
        fill="#4ade80"
        stroke="#22c55e"
        strokeWidth="1"
      />
      {/* Asia */}
      <path
        d="M 550 50 L 640 45 L 720 55 L 780 70 L 820 90 L 830 120 L 810 150 L 780 160 L 740 165 L 700 170 L 660 165 L 620 160 L 580 145 L 555 125 L 545 100 L 548 75 Z"
        fill="#4ade80"
        stroke="#22c55e"
        strokeWidth="1"
      />
      {/* India */}
      <path
        d="M 640 170 L 670 165 L 685 190 L 680 220 L 660 240 L 640 235 L 625 210 L 628 185 Z"
        fill="#4ade80"
        stroke="#22c55e"
        strokeWidth="1"
      />
      {/* Southeast Asia */}
      <path
        d="M 740 160 L 800 155 L 830 170 L 825 195 L 800 205 L 770 200 L 745 185 Z"
        fill="#4ade80"
        stroke="#22c55e"
        strokeWidth="1"
      />
      {/* Australia */}
      <path
        d="M 760 310 L 830 300 L 880 315 L 900 345 L 890 375 L 860 395 L 820 400 L 780 385 L 755 355 L 750 325 Z"
        fill="#4ade80"
        stroke="#22c55e"
        strokeWidth="1"
      />
      {/* Antarctica */}
      <path
        d="M 150 470 L 400 460 L 650 462 L 850 468 L 900 480 L 850 490 L 600 492 L 350 490 L 100 485 Z"
        fill="#4ade80"
        stroke="#22c55e"
        strokeWidth="1"
        opacity="0.5"
      />

      {/* Compass rose */}
      <g transform="translate(920, 80)">
        <circle cx="0" cy="0" r="30" stroke="#4ade80" strokeWidth="1" fill="none" opacity="0.6" />
        <circle cx="0" cy="0" r="20" stroke="#4ade80" strokeWidth="0.5" fill="none" opacity="0.4" />
        <line x1="0" y1="-28" x2="0" y2="-8" stroke="#4ade80" strokeWidth="1.5" />
        <line x1="0" y1="8" x2="0" y2="28" stroke="#4ade80" strokeWidth="1" opacity="0.6" />
        <line x1="-28" y1="0" x2="-8" y2="0" stroke="#4ade80" strokeWidth="1" opacity="0.6" />
        <line x1="8" y1="0" x2="28" y2="0" stroke="#4ade80" strokeWidth="1" opacity="0.6" />
        <polygon points="0,-28 -5,-10 0,-15 5,-10" fill="#4ade80" />
        <text x="0" y="-32" textAnchor="middle" fill="#4ade80" fontSize="8" fontFamily="serif">N</text>
        <text x="0" y="42" textAnchor="middle" fill="#4ade80" fontSize="6" fontFamily="serif" opacity="0.6">S</text>
        <text x="-38" y="3" textAnchor="middle" fill="#4ade80" fontSize="6" fontFamily="serif" opacity="0.6">W</text>
        <text x="38" y="3" textAnchor="middle" fill="#4ade80" fontSize="6" fontFamily="serif" opacity="0.6">E</text>
      </g>

      {/* Scale bar */}
      <g transform="translate(50, 470)">
        <line x1="0" y1="0" x2="100" y2="0" stroke="#4ade80" strokeWidth="1.5" opacity="0.6" />
        <line x1="0" y1="-4" x2="0" y2="4" stroke="#4ade80" strokeWidth="1.5" opacity="0.6" />
        <line x1="100" y1="-4" x2="100" y2="4" stroke="#4ade80" strokeWidth="1.5" opacity="0.6" />
        <text x="50" y="-8" textAnchor="middle" fill="#4ade80" fontSize="7" fontFamily="serif" opacity="0.6">5000 km</text>
      </g>
    </svg>
  );
}

// ── Animated floating coordinate label ────────────────────────────────────
function CoordLabel({ top, left, text }: { top: string; left: string; text: string }) {
  return (
    <div
      className="absolute text-green-400/40 font-mono text-xs pointer-events-none select-none"
      style={{ top, left }}
    >
      {text}
    </div>
  );
}

// ── Region card ────────────────────────────────────────────────────────────
interface RegionCardProps {
  icon: string;
  name: string;
  region: string;
  color: string;
  delay: string;
}

function RegionCard({ icon, name, region, color, delay }: RegionCardProps) {
  return (
    <div
      className="group relative bg-gray-900/80 backdrop-blur border border-green-900/40 rounded-xl p-5 hover:border-green-500/60 transition-all duration-500 hover:shadow-lg hover:shadow-green-900/30 cursor-pointer overflow-hidden"
      style={{ animationDelay: delay }}
    >
      <div className={`absolute inset-0 bg-linear-to-br ${color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="relative z-10">
        <div className="text-xs font-mono font-bold text-green-600 mb-3 tracking-widest">{icon}</div>
        <h3 className="text-white font-semibold text-sm">{name}</h3>
        <p className="text-green-400/70 text-xs mt-1 font-mono">{region}</p>
      </div>
    </div>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────
function StatPill({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="flex flex-col items-center bg-gray-900/60 border border-green-900/40 rounded-lg px-4 py-3">
      <span className="text-green-400 font-bold text-xl">{value}</span>
      <span className="text-gray-500 text-xs uppercase tracking-wider mt-0.5">{label}</span>
      <span className="text-green-600 text-xs font-mono">{unit}</span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function ClientDashboard() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [pulse, setPulse] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showFog, setShowFog] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showHolidayPlanner, setShowHolidayPlanner] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showWeatherHistory, setShowWeatherHistory] = useState(false);
  const [mapFlyTo, setMapFlyTo] = useState<{ lat: number; lon: number; name: string } | null>(null);
  const [chatInitialTab, setChatInitialTab] = useState<"ai" | "admin">("ai");

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/auth");
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    // Listen for open-chat-client events triggered by clicking the notification
    const handleOpenChatClient = () => {
      setChatInitialTab("admin");
      setShowChat(true);
    };
    window.addEventListener("open-chat-client", handleOpenChatClient);
    return () => window.removeEventListener("open-chat-client", handleOpenChatClient);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const p = setInterval(() => setPulse((v) => !v), 2000);
    return () => clearInterval(p);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  if (!user) return null;

  const utcTime = time.toUTCString().split(" ")[4];
  const coords = "44°N 26°E";

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* ── Background map layer ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0a2510_0%,#030712_70%)]" />
        <div className="absolute inset-0">
          <WorldMapSVG />
        </div>
        {/* Scan line effect */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,255,100,0.015)_2px,rgba(0,255,100,0.015)_4px)]" />
      </div>

      {/* ── Floating coordinate labels (hidden on mobile) ── */}
      <div className="hidden sm:block">
        <CoordLabel top="8%" left="12%" text="45°32'N  12°18'E" />
        <CoordLabel top="15%" left="70%" text="51°30'N  00°07'W" />
        <CoordLabel top="35%" left="5%" text="40°41'N  74°00'W" />
        <CoordLabel top="55%" left="80%" text="35°41'N  139°41'E" />
        <CoordLabel top="70%" left="25%" text="23°32'S  46°38'W" />
        <CoordLabel top="20%" left="48%" text="48°51'N  02°21'E" />
        <CoordLabel top="80%" left="60%" text="33°51'S  151°12'E" />
      </div>

      {/* ── Navbar ── */}
      <nav className="relative z-20 border-b border-green-900/40 bg-gray-950/80 backdrop-blur-md px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-8 h-8 rounded-full border-2 ${pulse ? "border-green-400" : "border-green-600"} transition-colors duration-1000 flex items-center justify-center`}>
              <div className={`w-2 h-2 rounded-full ${pulse ? "bg-green-400" : "bg-green-600"} transition-colors duration-1000`} />
            </div>
          </div>
          <div>
            <h1 className="text-green-400 font-bold tracking-widest text-sm uppercase font-mono">
              GeoAtlas
            </h1>
            <p className="text-green-700 text-xs font-mono tracking-wider">Navigator v1.0</p>
          </div>
        </div>

        {/* Center – coordinates + time */}
        <div className="hidden md:flex flex-col items-center">
          <span className="text-green-400/80 font-mono text-xs tracking-widest">{coords}</span>
          <span className="text-green-600 font-mono text-xs">{utcTime} UTC</span>
        </div>

        {/* User info + logout */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile: avatar button only */}
          <button
            onClick={() => setShowProfile(true)}
            className="sm:hidden w-9 h-9 rounded-full bg-green-900/40 border-2 border-green-600/60 flex items-center justify-center active:scale-95 transition-transform"
          >
            <span className="text-sm font-bold text-green-300 font-mono uppercase">
              {user.username.charAt(0)}
            </span>
          </button>
          {/* Desktop: full username */}
          <button
            onClick={() => setShowProfile(true)}
            className="text-right hidden sm:block group cursor-pointer"
          >
            <p className="text-sm font-semibold text-green-300 font-mono group-hover:text-green-400 transition-colors underline-offset-2 group-hover:underline">
              {user.username}
            </p>
            <p className="text-xs text-green-700 font-mono">ver profil</p>
          </button>
          <span className="hidden sm:inline-block text-xs px-2 py-1 rounded border border-green-800 text-green-500 font-mono uppercase tracking-wider">
            {user.role}
          </span>
          <button
            onClick={handleLogout}
            className="text-xs px-2 sm:px-3 py-1.5 rounded border border-red-900/60 text-red-400 hover:bg-red-900/30 hover:border-red-600 transition-all font-mono uppercase tracking-wider"
          >
            Disconnect
          </button>
        </div>
      </nav>

      {/* ── Hero section ── */}
      <section className="relative z-10 pt-8 sm:pt-16 pb-6 sm:pb-10 px-4 sm:px-6 text-center">
        {/* Decorative ring */}
        <div className="absolute left-1/2 top-8 -translate-x-1/2 w-96 h-96 rounded-full border border-green-900/20 pointer-events-none" />
        <div className="absolute left-1/2 top-8 -translate-x-1/2 w-64 h-64 rounded-full border border-green-900/30 pointer-events-none" />

        <div className="relative">
          <p className="text-green-500 font-mono text-xs tracking-[0.3em] uppercase mb-4">
            ◈ Atlas Geografic Digital ◈
          </p>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold leading-tight mb-4">
            <span className="text-transparent bg-clip-text bg-linear-to-r from-green-400 via-emerald-300 to-teal-400">
              Explorează
            </span>
            <br />
            <span className="text-white">Lumea</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto font-light">
            Bun venit,{" "}
            <span className="text-green-400 font-semibold">{user.username}</span>
            . Atlasul tău geografic personal te așteaptă.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 justify-center mt-6 sm:mt-8 px-2 sm:px-0">
            <button onClick={() => setShowMap(true)} className="flex items-center gap-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/40 hover:border-green-400 text-green-300 px-6 py-2.5 rounded-lg font-mono text-sm transition-all duration-300 hover:shadow-lg hover:shadow-green-900/40">
              Hartă Interactivă
            </button>
            <button onClick={() => setShowFog(true)} className="flex items-center gap-2 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/40 hover:border-teal-400 text-teal-300 px-6 py-2.5 rounded-lg font-mono text-sm transition-all duration-300 hover:shadow-lg hover:shadow-teal-900/40">
              Fog of War
            </button>
            <button onClick={() => setShowSearch(true)} className="flex items-center gap-2 bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700 hover:border-green-600/60 text-gray-300 hover:text-green-300 px-6 py-2.5 rounded-lg font-mono text-sm transition-all duration-300 hover:shadow-lg hover:shadow-green-900/30">
              Caută Locație
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto">
            <button
              onClick={() => {
                setChatInitialTab("ai");
                setShowChat(true);
              }}
              className="w-full flex items-center justify-center gap-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 hover:border-cyan-400 text-cyan-200 px-6 py-3 rounded-lg font-mono text-sm transition-all duration-300 hover:shadow-lg hover:shadow-cyan-900/40"
            >
              AI Assistant
            </button>

            <button
              onClick={() => setShowHolidayPlanner(true)}
              className="w-full flex items-center justify-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/40 hover:border-indigo-400 text-indigo-200 px-6 py-3 rounded-lg font-mono text-sm transition-all duration-300 hover:shadow-lg hover:shadow-indigo-900/40"
            >
              Planner Vacanță
            </button>
          </div>

          <div className="mt-3 max-w-3xl mx-auto">
            <button
              onClick={() => setShowWeatherHistory(true)}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 hover:border-emerald-400 text-emerald-200 px-6 py-3 rounded-lg font-mono text-sm transition-all duration-300 hover:shadow-lg hover:shadow-emerald-900/40"
            >
              Istoric Vreme · Comparator 20 Orașe
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="relative z-10 px-4 sm:px-6 pb-6 sm:pb-10">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          <StatPill label="Țări" value="195" unit="state suverane" />
          <StatPill label="Suprafață" value="510M" unit="km² total" />
          <StatPill label="Continente" value="7" unit="mase de uscat" />
          <StatPill label="Oceane" value="5" unit="bazine oceanice" />
        </div>
      </section>

      {/* ── Region cards ── */}
      <section className="relative z-10 px-4 sm:px-6 pb-8 sm:pb-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-green-900/40" />
            <p className="text-green-600 font-mono text-xs tracking-widest uppercase">
              Regiuni Geografice
            </p>
            <div className="h-px flex-1 bg-green-900/40" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <RegionCard icon="EU" name="Europa" region="35-71°N · 25°W-45°E" color="from-blue-900/20 to-indigo-900/20" delay="0ms" />
            <RegionCard icon="AF" name="Africa" region="37°N-35°S · 17°W-51°E" color="from-yellow-900/20 to-orange-900/20" delay="50ms" />
            <RegionCard icon="AS" name="Asia" region="10-77°N · 26-180°E" color="from-red-900/20 to-rose-900/20" delay="100ms" />
            <RegionCard icon="NA" name="America de N." region="7-84°N · 55-168°W" color="from-green-900/20 to-teal-900/20" delay="150ms" />
            <RegionCard icon="SA" name="America de S." region="12°N-56°S · 35-81°W" color="from-emerald-900/20 to-green-900/20" delay="200ms" />
            <RegionCard icon="OC" name="Oceania" region="10-47°S · 113-180°E" color="from-cyan-900/20 to-sky-900/20" delay="250ms" />
            <RegionCard icon="AN" name="Antarctica" region="66-90°S · 180°W-180°E" color="from-slate-900/20 to-gray-900/20" delay="300ms" />
            <RegionCard icon="PC" name="Oceanul Pacific" region="65°N-60°S" color="from-blue-900/20 to-cyan-900/20" delay="350ms" />
          </div>
        </div>
      </section>

      {/* ── Info panels ── */}
      <section className="relative z-10 px-4 sm:px-6 pb-10 sm:pb-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Panel 1 – Locație */}
          <div className="bg-gray-900/70 backdrop-blur border border-green-900/40 rounded-xl p-6 hover:border-green-700/60 transition-all">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block shrink-0" />
              <h3 className="text-green-400 font-mono text-xs uppercase tracking-widest">Locație Curentă</h3>
            </div>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Latitudine</span>
                <span className="text-green-300">44° 26' N</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Longitudine</span>
                <span className="text-green-300">26° 06' E</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Altitudine</span>
                <span className="text-green-300">85 m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fus orar</span>
                <span className="text-green-300">UTC+2</span>
              </div>
            </div>
          </div>

          {/* Panel 2 – Condiții */}
          <div className="bg-gray-900/70 backdrop-blur border border-green-900/40 rounded-xl p-6 hover:border-green-700/60 transition-all">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block shrink-0" />
              <h3 className="text-green-400 font-mono text-xs uppercase tracking-widest">Date Geografice</h3>
            </div>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Continent</span>
                <span className="text-green-300">Europa</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Țară</span>
                <span className="text-green-300">România</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Regiune</span>
                <span className="text-green-300">Muntenia</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Capitală</span>
                <span className="text-green-300">București</span>
              </div>
            </div>
          </div>

          {/* Panel 3 – Sesiune */}
          <div className="bg-gray-900/70 backdrop-blur border border-green-900/40 rounded-xl p-6 hover:border-green-700/60 transition-all">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block shrink-0" />
              <h3 className="text-green-400 font-mono text-xs uppercase tracking-widest">Sesiune Activă</h3>
            </div>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Utilizator</span>
                <span className="text-green-300">{user.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Rol</span>
                <span className="text-green-300">{user.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className="text-green-400 flex items-center gap-1">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${pulse ? "bg-green-400" : "bg-green-600"} transition-colors duration-1000`} />
                  Online
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Oră UTC</span>
                <span className="text-green-300">{utcTime}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-green-900/30 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-2">
        <p className="text-green-900 font-mono text-xs">
          © 2026 GeoAtlas Platform · All coordinates WGS84
        </p>
        <p className="text-green-900 font-mono text-xs">
          Proiecție: Mercator · Datum: WGS84 · Scară: 1:50 000 000
        </p>
      </footer>

      {/* ── Interactive Map Modal ── */}
      {showMap && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="text-green-400 font-mono text-sm animate-pulse">Se încarcă harta...</div>
          </div>
        }>
          <InteractiveMap
            onClose={() => { setShowMap(false); setMapFlyTo(null); }}
            flyTo={mapFlyTo ?? undefined}
          />
        </Suspense>
      )}

      {/* ── GeoSearch Modal ── */}
      {showSearch && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="text-green-400 font-mono text-sm animate-pulse">Se încarcă...</div>
          </div>
        }>
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

      {/* ── ChatBox Modal ── */}
      {showChat && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="text-cyan-300 font-mono text-sm animate-pulse">Se incarca ChatBox...</div>
          </div>
        }>
          <ChatBox onClose={() => setShowChat(false)} initialTab={chatInitialTab} />
        </Suspense>
      )}

      {/* ── Holiday Planner Modal ── */}
      {showHolidayPlanner && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="text-indigo-300 font-mono text-sm animate-pulse">Se incarca planner-ul...</div>
          </div>
        }>
          <HolidayPlanner onClose={() => setShowHolidayPlanner(false)} />
        </Suspense>
      )}

      {/* ── User Profile Modal ── */}
      {showProfile && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="text-green-400 font-mono text-sm animate-pulse">Se încarcă profilul...</div>
          </div>
        }>
          <UserProfile onClose={() => setShowProfile(false)} />
        </Suspense>
      )}

      {/* ── Weather History Modal ── */}
      {showWeatherHistory && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="text-emerald-300 font-mono text-sm animate-pulse">Se incarca istoricul...</div>
          </div>
        }>
          <WeatherHistory onClose={() => setShowWeatherHistory(false)} />
        </Suspense>
      )}

      {/* ── Fog of War Modal ── */}
      {showFog && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="flex flex-col items-center gap-3">
              <div className="text-4xl animate-pulse">🌍</div>
              <div className="text-green-400 font-mono text-sm animate-pulse">Se încarcă jocul...</div>
            </div>
          </div>
        }>
          <FogOfWar onClose={() => setShowFog(false)} />
        </Suspense>
      )}
    </div>
  );
}





