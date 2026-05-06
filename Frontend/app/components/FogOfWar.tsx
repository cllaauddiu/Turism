import { useEffect, useRef, useState, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { fogApi, type FogZone, type FogRiddle, type FogProgress, type FogUnlockResult, type LeaderboardEntry } from "~/lib/api";
import { useAuth } from "~/hooks/useAuth";

// ── Confetti canvas ───────────────────────────────────────────────────────────
function ConfettiCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!active || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const colors = ["#196b46", "#86efac", "#196b46", "#fbbf24", "#60a5fa", "#f472b6", "#34d399"];
    const particles = Array.from({ length: 100 }, () => ({
      x: canvas.width / 2, y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.5) * 16,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 7 + 3,
      alpha: 1,
    }));
    let frame: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.35; p.alpha -= 0.016;
        if (p.alpha > 0) {
          alive = true;
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      if (alive) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [active]);
  if (!active) return null;
  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[9999] w-full h-full" />;
}

// ── Difficulty badge ──────────────────────────────────────────────────────────
function DiffBadge({ difficulty }: { difficulty: number }) {
  const cfg = difficulty === 1
    ? { label: "Ușor", cls: "text-emerald-700 border-emerald-400/60 bg-emerald-100/20" }
    : difficulty === 2
    ? { label: "Mediu", cls: "text-amber-700 border-amber-500/60 bg-amber-100/20" }
    : { label: "Dificil", cls: "text-red-700 border-red-500/60 bg-red-100/20" };
  return (
    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${cfg.cls} uppercase tracking-widest`}>
      {cfg.label}
    </span>
  );
}

// ── Side panel ────────────────────────────────────────────────────────────────
interface SidePanelProps {
  zone: FogZone | null;
  riddle: FogRiddle | null;
  riddleLoading: boolean;
  selectedOption: number | null;
  setSelectedOption: (v: number) => void;
  onGetRiddle: () => void;
  onSubmit: () => void;
  submitLoading: boolean;
  unlockResult: FogUnlockResult | null;
  showHint: boolean;
  setShowHint: (v: boolean) => void;
  onClose: () => void;
}

function SidePanel({
  zone, riddle, riddleLoading, selectedOption, setSelectedOption,
  onGetRiddle, onSubmit, submitLoading, unlockResult,
  showHint, setShowHint, onClose,
}: SidePanelProps) {
  if (!zone) return null;
  const isUnlocked = zone.status === "UNLOCKED";
  const hasActiveRiddle = zone.status === "RIDDLE_ACTIVE" || riddle !== null;
  const pts = zone.difficulty === 1 ? 10 : zone.difficulty === 2 ? 20 : 30;

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin">
      {/* Zone header */}
      <div className="relative mb-5">
        <button
          onClick={onClose}
          className="absolute top-0 right-0 w-7 h-7 flex items-center justify-center rounded-full bg-stone-200/80 text-stone-500 hover:text-red-700 hover:bg-red-100/30 transition-all text-sm"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 pr-9">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0 border-2 ${
            isUnlocked
              ? "border-emerald-700/60 bg-emerald-100/20 shadow-lg shadow-emerald-200/40"
              : zone.status === "RIDDLE_ACTIVE"
              ? "border-teal-400/60 bg-teal-900/20 shadow-lg shadow-teal-900/40"
              : "border-stone-400/60 bg-stone-200/40"
          }`}>
            {isUnlocked ? zone.emoji : zone.status === "RIDDLE_ACTIVE" ? "🔭" : "🌫️"}
          </div>
          <div>
            <h2 className="text-stone-900 font-bold text-base leading-tight">{zone.name}</h2>
            <p className="text-stone-500 text-xs font-mono mt-0.5">{zone.continent}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <DiffBadge difficulty={zone.difficulty} />
              <span className="text-amber-700 text-xs font-mono">+{pts} pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-green-900/40 to-transparent mb-4" />

      {/* UNLOCKED */}
      {isUnlocked && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 bg-emerald-100/20 border border-emerald-400/40 rounded-xl px-3 py-2">
            <span className="text-emerald-700 text-lg">✅</span>
            <div>
              <p className="text-emerald-700 font-mono text-xs font-bold uppercase tracking-wider">Zonă deblocată</p>
              <p className="text-emerald-700 text-xs">+{pts} puncte câștigate</p>
            </div>
          </div>
          <div className="bg-stone-200/60 border border-stone-400/50 rounded-xl p-4">
            <p className="text-teal-500 font-mono text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1">
              <span>📖</span> Despre acest loc
            </p>
            <p className="text-stone-700 text-sm leading-relaxed">{zone.landmarkDescription}</p>
          </div>
        </div>
      )}

      {/* LOCKED – no riddle yet */}
      {!isUnlocked && !hasActiveRiddle && !riddleLoading && (
        <div className="flex flex-col items-center gap-5 py-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-stone-200/80 border border-stone-400/50 flex items-center justify-center text-4xl">
              🌫️
            </div>
            <div className="absolute inset-0 rounded-full animate-ping bg-stone-300/20" />
          </div>
          <div className="text-center">
            <p className="text-stone-700 text-sm font-mono font-semibold mb-1">Zonă ascunsă în ceață</p>
            <p className="text-stone-500 text-xs leading-relaxed">
              Rezolvă o ghicitoare generată de AI pentru a o debloca
            </p>
          </div>
          <button
            onClick={onGetRiddle}
            className="w-full relative group overflow-hidden bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/40 hover:border-teal-400 text-teal-300 px-4 py-3 rounded-xl font-mono text-sm transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-teal-900/40"
          >
            <span className="text-base">🔭</span>
            Generează ghicitoare AI
          </button>
        </div>
      )}

      {/* Loading riddle */}
      {riddleLoading && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-teal-500/40 border-t-teal-400 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">🤖</div>
          </div>
          <div className="text-center">
            <p className="text-teal-400 font-mono text-sm">AI creează ghicitoarea...</p>
            <p className="text-stone-500 text-xs mt-1">Poate dura câteva secunde</p>
          </div>
        </div>
      )}

      {/* Active riddle */}
      {!isUnlocked && hasActiveRiddle && riddle && !riddleLoading && (
        <div className="flex flex-col gap-4">
          {/* Question */}
          <div className="bg-stone-200/60 border border-teal-800/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-teal-500/20 border border-teal-500/50 flex items-center justify-center text-[10px] text-teal-400">🤖</span>
              <p className="text-teal-400 font-mono text-[10px] uppercase tracking-widest">Ghicitoare AI</p>
            </div>
            <p className="text-stone-800 text-sm leading-relaxed">{riddle.question}</p>
          </div>

          {/* Hint */}
          <button
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-1.5 text-amber-700 hover:text-amber-700 text-xs font-mono transition-colors w-fit"
          >
            <span className="text-[10px]">{showHint ? "▼" : "▶"}</span>
            {showHint ? "Ascunde indiciu" : "Arată indiciu"}
          </button>
          {showHint && (
            <div className="bg-amber-100/15 border border-amber-400/30 rounded-xl px-4 py-3">
              <p className="text-amber-800/80 text-xs font-mono leading-relaxed">💡 {riddle.hint}</p>
            </div>
          )}

          {/* Options */}
          <div className="flex flex-col gap-2">
            <p className="text-stone-500 font-mono text-[10px] uppercase tracking-widest">Alege răspunsul</p>
            {riddle.options.map((option, idx) => {
              const letters = ["A", "B", "C", "D"];
              const isSelected = selectedOption === idx;
              const isWrong = unlockResult && !unlockResult.success && isSelected;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedOption(idx)}
                  disabled={submitLoading}
                  className={`w-full text-left px-4 py-3 rounded-xl border font-mono text-sm transition-all duration-200 flex items-center gap-3 ${
                    isWrong
                      ? "bg-red-100/25 border-red-500/70 text-red-700"
                      : isSelected
                      ? "bg-emerald-100/25 border-emerald-700/70 text-emerald-800 shadow-md shadow-emerald-200/20"
                      : "bg-stone-200/50 border-stone-400/50 text-stone-700 hover:bg-stone-300/50 hover:border-teal-700/60 hover:text-teal-200"
                  }`}
                >
                  <span className={`shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold transition-all ${
                    isWrong
                      ? "border-red-400 text-red-700 bg-red-100/30"
                      : isSelected
                      ? "border-emerald-700 text-emerald-700 bg-emerald-100/40"
                      : "border-stone-400 text-stone-500"
                  }`}>
                    {letters[idx]}
                  </span>
                  <span className="text-xs leading-relaxed">{option.replace(/^[A-D]:\s*/, "")}</span>
                </button>
              );
            })}
          </div>

          {/* Submit */}
          <button
            onClick={onSubmit}
            disabled={selectedOption === null || submitLoading}
            className="w-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-600/50 hover:border-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed text-emerald-800 px-4 py-3 rounded-xl font-mono text-sm transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-emerald-200/30"
          >
            {submitLoading
              ? <><div className="w-4 h-4 rounded-full border-2 border-emerald-700/40 border-t-green-400 animate-spin" /> Se verifică...</>
              : <><span>🔓</span> Confirmă răspunsul</>
            }
          </button>

          {/* Wrong answer feedback */}
          {unlockResult && !unlockResult.success && (
            <div className="bg-red-100/20 border border-red-400/40 rounded-xl p-3 text-center">
              <p className="text-red-700 font-mono text-sm">❌ {unlockResult.message}</p>
              {unlockResult.hint && (
                <p className="text-amber-700/80 text-xs font-mono mt-1.5">💡 {unlockResult.hint}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ progress }: { progress: FogProgress | null }) {
  if (!progress) return null;
  const pct = progress.totalZones > 0
    ? Math.round((progress.unlockedZones / progress.totalZones) * 100)
    : 0;
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-stone-50/90 border-b border-emerald-200/30">
      <span className="text-stone-500 font-mono text-xs shrink-0">
        {progress.unlockedZones}/{progress.totalZones}
      </span>
      <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-600 via-emerald-500 to-teal-400 rounded-full transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-emerald-600 font-mono text-xs font-bold shrink-0">{pct}%</span>
      <div className="h-3 w-px bg-stone-300 hidden sm:block" />
      <span className="text-amber-700 font-mono text-xs shrink-0 hidden sm:block">⭐ {progress.score} pts</span>
      {progress.lastUnlockedZone && (
        <span className="text-stone-500 font-mono text-xs hidden lg:block shrink-0 truncate max-w-32">
          ↑ {progress.lastUnlockedZone}
        </span>
      )}
    </div>
  );
}

// ── Leaderboard panel ─────────────────────────────────────────────────────────
function LeaderboardPanel({
  entries,
  currentUser,
  live,
}: {
  entries: LeaderboardEntry[];
  currentUser: string;
  live: boolean;
}) {
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <p className="text-emerald-600 font-mono text-[10px] uppercase tracking-widest">
          Clasament global
        </p>
        <span className={`flex items-center gap-1 text-[10px] font-mono ${live ? "text-emerald-700" : "text-stone-500"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${live ? "bg-emerald-500 animate-pulse" : "bg-gray-600"}`} />
          {live ? "LIVE" : "offline"}
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-stone-500 font-mono text-xs text-center">
            Nimeni nu a deblocat<br />o zonă încă.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 overflow-y-auto flex-1">
          {entries.map((entry) => {
            const isMe = entry.username === currentUser;
            return (
              <div
                key={entry.username}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                  isMe
                    ? "bg-emerald-100/20 border-emerald-400/50 shadow-md shadow-emerald-200/20"
                    : "bg-stone-50/50 border-stone-300/60"
                }`}
              >
                {/* Rank */}
                <div className="w-7 text-center shrink-0">
                  {entry.rank <= 3 ? (
                    <span className="text-base">{medals[entry.rank - 1]}</span>
                  ) : (
                    <span className="text-stone-500 font-mono text-xs font-bold">#{entry.rank}</span>
                  )}
                </div>

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <p className={`font-mono text-xs font-semibold truncate ${isMe ? "text-emerald-800" : "text-stone-700"}`}>
                    {entry.username}
                    {isMe && <span className="text-emerald-700 ml-1 text-[10px]">· tu</span>}
                  </p>
                  {entry.lastUnlockedZone && (
                    <p className="text-stone-500 text-[10px] font-mono truncate">↑ {entry.lastUnlockedZone}</p>
                  )}
                </div>

                {/* Score */}
                <div className="text-right shrink-0">
                  <p className={`font-mono text-sm font-bold ${isMe ? "text-emerald-700" : "text-amber-700"}`}>
                    {entry.score}
                  </p>
                  <p className="text-stone-500 text-[10px] font-mono">{entry.unlockedZones} zone</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div className="absolute bottom-6 left-4 z-[1000] bg-stone-100/90 backdrop-blur border border-emerald-200/30 rounded-xl px-3 py-3 font-mono text-xs space-y-2 pointer-events-none shadow-xl">
      <p className="text-stone-500 text-[10px] uppercase tracking-widest mb-1">Legendă</p>
      {[
        { color: "bg-stone-300/80 border-gray-500/60", label: "Blocat", ring: "" },
        { color: "bg-teal-600/60 border-teal-400/80", label: "Ghicitoare activă", ring: "shadow-teal-500/50" },
        { color: "bg-emerald-500/60 border-green-300/80", label: "Deblocat", ring: "shadow-green-500/50" },
      ].map(({ color, label, ring }) => (
        <div key={label} className="flex items-center gap-2.5">
          <span className={`inline-block w-3 h-3 rounded-full border ${color} shadow-md ${ring}`} />
          <span className="text-stone-600">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ── CSS pentru markerii de pe hartă ──────────────────────────────────────────
const MAP_STYLES = `
  .fog-marker-locked {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: rgba(17,24,39,0.85);
    border: 1.5px solid rgba(75,85,99,0.5);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 12px rgba(40,30,10,0.35);
    font-size: 15px;
    color: rgba(60,45,15,0.6);
  }
  .fog-marker-locked:hover {
    border-color: rgba(107,114,128,0.8);
    background: rgba(244,239,230,0.92);
    transform: scale(1.15);
    box-shadow: 0 4px 20px rgba(40,30,10,0.40);
  }
  .fog-marker-active {
    width: 44px; height: 44px;
    border-radius: 50%;
    background: rgba(13,148,136,0.25);
    border: 2px solid rgba(45,212,191,0.8);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    font-size: 20px;
    box-shadow: 0 0 18px rgba(45,212,191,0.5), 0 0 6px rgba(45,212,191,0.3);
    animation: fogActivePulse 2s ease-in-out infinite;
  }
  .fog-marker-active:hover { transform: scale(1.15); }
  .fog-marker-unlocked {
    width: 48px; height: 48px;
    border-radius: 50%;
    background: rgba(34,197,94,0.2);
    border: 2px solid rgba(74,222,128,0.8);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    font-size: 22px;
    box-shadow: 0 0 22px rgba(74,222,128,0.45), 0 0 8px rgba(74,222,128,0.25);
    animation: fogUnlockedGlow 3s ease-in-out infinite;
  }
  .fog-marker-unlocked:hover { transform: scale(1.12); }
  @keyframes fogActivePulse {
    0%, 100% { box-shadow: 0 0 18px rgba(45,212,191,0.5), 0 0 6px rgba(45,212,191,0.3); }
    50% { box-shadow: 0 0 30px rgba(45,212,191,0.7), 0 0 12px rgba(45,212,191,0.5); }
  }
  @keyframes fogUnlockedGlow {
    0%, 100% { box-shadow: 0 0 22px rgba(74,222,128,0.4), 0 0 8px rgba(74,222,128,0.2); }
    50% { box-shadow: 0 0 35px rgba(74,222,128,0.6), 0 0 15px rgba(74,222,128,0.4); }
  }
  @keyframes panelSlideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  .leaflet-tooltip.fog-tooltip {
    background: rgba(251,246,236,0.95);
    border: 1px solid rgba(25,107,70,0.30);
    border-radius: 8px;
    color: #86efac;
    font-family: monospace;
    font-size: 11px;
    padding: 4px 10px;
    box-shadow: 0 4px 16px rgba(40,30,10,0.25);
    white-space: nowrap;
  }
  .leaflet-tooltip.fog-tooltip::before { border-top-color: rgba(25,107,70,0.30); }
`;

// ── Main component ────────────────────────────────────────────────────────────
export default function FogOfWar({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<number, any>>(new Map());

  const [zones, setZones] = useState<FogZone[]>([]);
  const [progress, setProgress] = useState<FogProgress | null>(null);
  const [selectedZone, setSelectedZone] = useState<FogZone | null>(null);
  const [riddle, setRiddle] = useState<FogRiddle | null>(null);
  const [riddleLoading, setRiddleLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [unlockResult, setUnlockResult] = useState<FogUnlockResult | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLive, setLeaderboardLive] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const stompRef = useRef<Client | null>(null);

  // WebSocket leaderboard
  useEffect(() => {
    fogApi.getLeaderboard().then(setLeaderboard).catch(() => {});

    const wsUrl = typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.host}/games/ws-leaderboard`
      : "http://games-service:8084/games/ws-leaderboard";

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      onConnect: () => {
        setLeaderboardLive(true);
        client.subscribe("/topic/leaderboard", (msg) => {
          try {
            setLeaderboard(JSON.parse(msg.body));
          } catch {}
        });
      },
      onDisconnect: () => setLeaderboardLive(false),
      onStompError: () => setLeaderboardLive(false),
    });

    client.activate();
    stompRef.current = client;

    return () => {
      client.deactivate();
      stompRef.current = null;
    };
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const [z, p] = await Promise.all([fogApi.getZones(), fogApi.getProgress()]);
      setZones(z);
      setProgress(p);
      return z;
    } catch {
      setError("Nu s-a putut conecta la serverul de joc. Încearcă din nou.");
      return null;
    }
  }, []);

  // Render markers pe hartă
  const renderMarkers = useCallback((L: any, map: any, zonesData: FogZone[]) => {
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current.clear();

    for (const zone of zonesData) {
      const centerLat = (zone.bboxSouth + zone.bboxNorth) / 2;
      const centerLng = (zone.bboxWest + zone.bboxEast) / 2;

      let markerClass: string;
      let innerHtml: string;
      let size: number;

      if (zone.status === "UNLOCKED") {
        markerClass = "fog-marker-unlocked";
        innerHtml = zone.emoji;
        size = 48;
      } else if (zone.status === "RIDDLE_ACTIVE") {
        markerClass = "fog-marker-active";
        innerHtml = "🔭";
        size = 44;
      } else {
        markerClass = "fog-marker-locked";
        innerHtml = "?";
        size = 36;
      }

      const icon = L.divIcon({
        className: "",
        html: `<div class="${markerClass}">${innerHtml}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        tooltipAnchor: [0, -size / 2 - 4],
      });

      const marker = L.marker([centerLat, centerLng], { icon }).addTo(map);

      // Tooltip cu numele zonei
      marker.bindTooltip(
        `<span>${zone.status === "LOCKED" ? "❓ " : ""}${zone.name}</span>`,
        { direction: "top", className: "fog-tooltip", offset: [0, -4] }
      );

      marker.on("click", () => {
        setSelectedZone(zone);
        setRiddle(null);
        setSelectedOption(null);
        setUnlockResult(null);
        setShowHint(false);
        if (zone.status === "RIDDLE_ACTIVE") {
          loadRiddleForZone(zone.id);
        }
      });

      markersRef.current.set(zone.id, marker);
    }
  }, []);

  // Init hartă
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current || mapRef.current) return;
    (async () => {
      setLoading(true);
      const L = (await import("leaflet")).default;
      const map = L.map(mapContainerRef.current!, {
        center: [20, 10],
        zoom: 2,
        minZoom: 1,
        maxZoom: 7,
        zoomControl: false,
      });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap © CARTO",
        maxZoom: 19,
      }).addTo(map);
      L.control.zoom({ position: "topright" }).addTo(map);
      mapRef.current = map;
      const zonesData = await refreshData();
      setLoading(false);
      if (zonesData) renderMarkers(L, map, zonesData);
    })();
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  // Re-render la schimbarea zonelor
  useEffect(() => {
    if (!mapRef.current || zones.length === 0) return;
    import("leaflet").then(({ default: L }) => renderMarkers(L, mapRef.current, zones));
  }, [zones, renderMarkers]);

  const loadRiddleForZone = async (zoneId: number) => {
    setRiddleLoading(true);
    try {
      const r = await fogApi.getRiddle(zoneId);
      setRiddle(r);
    } catch {
      setError("Nu s-a putut genera ghicitoarea.");
    } finally {
      setRiddleLoading(false);
    }
  };

  const handleGetRiddle = async () => {
    if (!selectedZone) return;
    await loadRiddleForZone(selectedZone.id);
    setZones((prev) => prev.map((z) => z.id === selectedZone.id ? { ...z, status: "RIDDLE_ACTIVE" } : z));
    setSelectedZone((prev) => prev ? { ...prev, status: "RIDDLE_ACTIVE" } : prev);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedZone || selectedOption === null) return;
    setSubmitLoading(true);
    setUnlockResult(null);
    try {
      const result = await fogApi.submitAnswer(selectedZone.id, String(selectedOption));
      setUnlockResult(result);
      if (result.success) {
        setConfetti(true);
        setTimeout(() => setConfetti(false), 3000);
        const updated = await refreshData();
        if (updated) {
          const updatedZone = updated.find((z) => z.id === selectedZone.id);
          if (updatedZone) setSelectedZone(updatedZone);
        }
        setSelectedOption(null);
        setRiddle(null);
      }
    } catch {
      setUnlockResult({ success: false, message: "Eroare de rețea. Încearcă din nou." });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Guest screen
  if (user?.role === "GUEST") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-200/85">
        <div className="relative w-full max-w-md bg-stone-100 rounded-2xl border border-emerald-200/40 shadow-2xl shadow-emerald-200/20 flex flex-col items-center p-8 text-center gap-4">
          <button onClick={onClose} className="absolute top-4 right-4 text-stone-500 hover:text-red-700 transition-colors font-mono">✕</button>
          <div className="w-16 h-16 rounded-full bg-stone-50 border border-stone-400 flex items-center justify-center text-3xl">🔒</div>
          <h3 className="text-emerald-800 font-mono text-lg font-bold">Acces Restricționat</h3>
          <p className="text-stone-600 font-mono text-sm">
            Fog of War este disponibil doar membrilor înregistrați. Creează-ți un cont pentru a explora harta!
          </p>
          <a href="/auth" className="mt-2 px-6 py-2 border border-emerald-600/60 text-emerald-800 rounded-lg font-mono text-sm uppercase tracking-wider hover:bg-emerald-100/20 transition-colors">
            Creează cont
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-stone-100 flex flex-col font-mono">
      <style>{MAP_STYLES}</style>
      <ConfettiCanvas active={confetti} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-stone-100/95 border-b border-emerald-200/30 z-10 backdrop-blur">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
            <span className="relative w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          </div>
          <div>
            <h1 className="text-emerald-700 font-bold tracking-widest text-sm uppercase">Fog of War</h1>
            <p className="text-stone-500 text-[10px] hidden sm:block">Deblochează zonele rezolvând ghicitori generate de AI</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {progress && (
            <div className="hidden sm:flex items-center gap-2 text-xs bg-stone-50/60 border border-stone-300 rounded-lg px-3 py-1.5">
              <span className="text-amber-700 font-bold">{progress.score}</span>
              <span className="text-stone-500">pts</span>
              <span className="w-px h-3 bg-stone-300 mx-0.5" />
              <span className="text-emerald-600">{progress.unlockedZones}</span>
              <span className="text-stone-500">zone</span>
            </div>
          )}
          <button
            onClick={() => setShowLeaderboard((v) => !v)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all uppercase tracking-wider flex items-center gap-1.5 ${
              showLeaderboard
                ? "bg-amber-100/20 border-amber-600/60 text-amber-800"
                : "border-amber-300/50 text-amber-700 hover:bg-amber-100/20 hover:border-amber-600/60 hover:text-amber-800"
            }`}
          >
            <span>🏆</span>
            <span className="hidden sm:inline">Clasament</span>
            {leaderboardLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
          </button>
          <button
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded-lg border border-red-300/50 text-red-700 hover:bg-red-100/20 hover:border-red-600/60 transition-all uppercase tracking-wider"
          >
            ✕ Închide
          </button>
        </div>
      </div>

      {/* Progress */}
      <ProgressBar progress={progress} />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Map */}
        <div ref={mapContainerRef} className="flex-1 h-full relative" />

        {/* Legend */}
        {!loading && <Legend />}

        {/* Loading */}
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-stone-100/95">
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-emerald-600/20 border-t-green-400 animate-spin" />
                <div className="absolute inset-2 rounded-full border border-teal-500/20 border-b-teal-400 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
                <div className="absolute inset-0 flex items-center justify-center text-2xl">🌍</div>
              </div>
              <p className="text-emerald-700 font-mono text-sm animate-pulse">Se încarcă harta...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-red-100/80 backdrop-blur border border-red-600/60 rounded-xl px-4 py-2 text-red-700 text-xs font-mono flex items-center gap-2 shadow-xl">
            ⚠️ {error}
            <button onClick={() => setError(null)} className="text-red-700 hover:text-stone-900 ml-1 transition-colors">✕</button>
          </div>
        )}

        {/* Hint when nothing selected */}
        {!selectedZone && !loading && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <div className="bg-stone-50/80 backdrop-blur border border-emerald-200/30 rounded-xl px-5 py-2.5 text-stone-500 text-xs font-mono animate-pulse shadow-lg">
              Apasă pe orice marker de pe hartă pentru a explora
            </div>
          </div>
        )}

        {/* Leaderboard panel */}
        {showLeaderboard && !selectedZone && (
          <div
            className="absolute inset-0 sm:static sm:inset-auto w-full sm:w-72 h-full border-0 sm:border-l border-amber-300/30 bg-stone-100/98 backdrop-blur-sm p-5 overflow-y-auto z-30 shadow-2xl shadow-black/50"
            style={{ animation: "panelSlideIn 0.25s ease-out" }}
          >
            <LeaderboardPanel
              entries={leaderboard}
              currentUser={user?.username ?? ""}
              live={leaderboardLive}
            />
          </div>
        )}

        {/* Zone side panel */}
        {selectedZone && (
          <div
            className="absolute inset-0 sm:static sm:inset-auto w-full sm:w-80 lg:w-96 h-full border-0 sm:border-l border-emerald-200/30 bg-stone-100/98 backdrop-blur-sm p-5 overflow-y-auto z-30 shadow-2xl shadow-black/50"
            style={{ animation: "panelSlideIn 0.25s ease-out" }}
          >
            <SidePanel
              zone={selectedZone}
              riddle={riddle}
              riddleLoading={riddleLoading}
              selectedOption={selectedOption}
              setSelectedOption={setSelectedOption}
              onGetRiddle={handleGetRiddle}
              onSubmit={handleSubmitAnswer}
              submitLoading={submitLoading}
              unlockResult={unlockResult}
              showHint={showHint}
              setShowHint={setShowHint}
              onClose={() => {
                setSelectedZone(null);
                setRiddle(null);
                setSelectedOption(null);
                setUnlockResult(null);
                setShowHint(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
