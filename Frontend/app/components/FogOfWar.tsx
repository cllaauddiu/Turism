import { useEffect, useRef, useState, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import { fogApi, type FogZone, type FogRiddle, type FogProgress, type FogUnlockResult } from "~/lib/api";

// ── Difficulty badge ──────────────────────────────────────────────────────────
function DiffBadge({ difficulty }: { difficulty: number }) {
  const label = difficulty === 1 ? "Easy" : difficulty === 2 ? "Medium" : "Hard";
  const color =
    difficulty === 1
      ? "text-green-400 border-green-700 bg-green-900/30"
      : difficulty === 2
      ? "text-yellow-400 border-yellow-700 bg-yellow-900/30"
      : "text-red-400 border-red-700 bg-red-900/30";
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${color} uppercase tracking-wider`}>
      {label}
    </span>
  );
}

// ── Stars for difficulty ──────────────────────────────────────────────────────
function Stars({ n }: { n: number }) {
  return (
    <span className="text-yellow-400 text-xs">
      {"★".repeat(n)}{"☆".repeat(3 - n)}
    </span>
  );
}

// ── Particle burst (canvas-based confetti) ────────────────────────────────────
function ConfettiCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!active || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const particles: { x: number; y: number; vx: number; vy: number; color: string; size: number; alpha: number }[] = [];
    const colors = ["#4ade80", "#86efac", "#22c55e", "#fbbf24", "#60a5fa", "#f472b6"];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.5) * 14,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 3,
        alpha: 1,
      });
    }
    let frame: number;
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3;
        p.alpha -= 0.018;
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
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[9999] w-full h-full"
    />
  );
}

// ── Side Panel ────────────────────────────────────────────────────────────────
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

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Zone header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-3xl">{zone.emoji}</span>
            <div>
              <h2 className="text-green-300 font-bold text-lg font-mono leading-tight">{zone.name}</h2>
              <p className="text-green-700 text-xs font-mono">{zone.continent}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <DiffBadge difficulty={zone.difficulty} />
            <Stars n={zone.difficulty} />
          </div>
        </div>
        <button onClick={onClose} className="text-gray-600 hover:text-red-400 transition-colors text-xl font-mono ml-2">✕</button>
      </div>

      {/* UNLOCKED state */}
      {isUnlocked && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-green-400 text-xl">✅</span>
            <span className="text-green-400 font-mono text-sm font-bold">Zone Unlocked!</span>
          </div>
          <div className="bg-gray-800/80 border border-green-800/50 rounded-lg p-4">
            <p className="text-green-500 font-mono text-xs uppercase tracking-wider mb-2">📖 About this place</p>
            <p className="text-gray-300 text-sm leading-relaxed">{zone.landmarkDescription}</p>
          </div>
          <div className="mt-4 text-center">
            <span className="text-green-600 font-mono text-xs">
              {zone.difficulty === 1 ? "+10" : zone.difficulty === 2 ? "+20" : "+30"} points earned
            </span>
          </div>
        </div>
      )}

      {/* LOCKED state – show get riddle button */}
      {!isUnlocked && !hasActiveRiddle && !riddleLoading && (
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="text-center">
            <p className="text-gray-400 text-sm font-mono mb-1">This zone is hidden in the fog.</p>
            <p className="text-gray-500 text-xs">Solve a riddle from the AI to reveal it!</p>
          </div>
          <div className="text-5xl animate-pulse">🌫️</div>
          <button
            onClick={onGetRiddle}
            className="w-full bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/50 hover:border-teal-400 text-teal-300 px-4 py-3 rounded-lg font-mono text-sm transition-all flex items-center justify-center gap-2"
          >
            <span>🔭</span> Generate AI Riddle
          </button>
        </div>
      )}

      {/* Loading riddle */}
      {riddleLoading && (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="text-3xl animate-spin">🤖</div>
          <p className="text-green-400 font-mono text-sm animate-pulse">AI is crafting your riddle...</p>
        </div>
      )}

      {/* Active riddle */}
      {!isUnlocked && hasActiveRiddle && riddle && !riddleLoading && (
        <div className="flex flex-col gap-4">
          <div className="bg-gray-800/80 border border-teal-800/50 rounded-lg p-4">
            <p className="text-teal-500 font-mono text-xs uppercase tracking-wider mb-2">🤖 AI Riddle</p>
            <p className="text-gray-200 text-sm leading-relaxed">{riddle.question}</p>
          </div>

          {/* Hint toggle */}
          <div>
            <button
              onClick={() => setShowHint(!showHint)}
              className="text-yellow-600 hover:text-yellow-400 text-xs font-mono underline transition-colors"
            >
              {showHint ? "▼ Hide hint" : "▶ Show hint"}
            </button>
            {showHint && (
              <div className="mt-2 bg-yellow-900/20 border border-yellow-800/40 rounded p-3">
                <p className="text-yellow-300 text-xs font-mono">💡 {riddle.hint}</p>
              </div>
            )}
          </div>

          {/* Opțiuni grilă */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-500 font-mono text-xs uppercase tracking-wider mb-1 block">
              Alege răspunsul corect
            </label>
            {riddle.options.map((option, idx) => {
              const letters = ["A", "B", "C", "D"];
              const isSelected = selectedOption === idx;
              const isWrong = unlockResult && !unlockResult.success && isSelected;
              return (
                <button
                  key={idx}
                  onClick={() => { setSelectedOption(idx); }}
                  disabled={submitLoading}
                  className={`w-full text-left px-4 py-3 rounded-lg border font-mono text-sm transition-all duration-200 flex items-center gap-3
                    ${isWrong
                      ? "bg-red-900/30 border-red-500 text-red-300"
                      : isSelected
                      ? "bg-green-500/20 border-green-400 text-green-200 shadow-lg shadow-green-900/30"
                      : "bg-gray-800/60 border-gray-700 text-gray-300 hover:bg-gray-700/60 hover:border-green-700 hover:text-green-300"
                    }`}
                >
                  <span className={`shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold
                    ${isWrong ? "border-red-400 text-red-400" : isSelected ? "border-green-400 text-green-400 bg-green-900/40" : "border-gray-600 text-gray-500"}`}>
                    {letters[idx]}
                  </span>
                  <span>{option.replace(/^[A-D]:\s*/, "")}</span>
                </button>
              );
            })}
          </div>

          {/* Submit button */}
          <button
            onClick={onSubmit}
            disabled={selectedOption === null || submitLoading}
            className="w-full bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 hover:border-green-400 disabled:opacity-40 disabled:cursor-not-allowed text-green-300 px-4 py-2.5 rounded-lg font-mono text-sm transition-all flex items-center justify-center gap-2"
          >
            {submitLoading ? (
              <><span className="animate-spin inline-block">⚙️</span> Se verifică...</>
            ) : (
              <><span>🔓</span> Confirmă răspunsul</>
            )}
          </button>

          {/* Result feedback */}
          {unlockResult && !unlockResult.success && (
            <div className="bg-red-900/20 border border-red-800/40 rounded-lg p-3 text-center">
              <p className="text-red-400 font-mono text-sm">❌ {unlockResult.message}</p>
              {unlockResult.hint && (
                <p className="text-yellow-500 text-xs font-mono mt-1">💡 {unlockResult.hint}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ progress }: { progress: FogProgress | null }) {
  if (!progress) return null;
  const pct = progress.totalZones > 0 ? Math.round((progress.unlockedZones / progress.totalZones) * 100) : 0;
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-900/80 border-b border-green-900/40">
      <span className="text-green-500 font-mono text-xs shrink-0">
        🗺️ {progress.unlockedZones}/{progress.totalZones} zones
      </span>
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-600 to-emerald-400 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-green-400 font-mono text-xs font-bold shrink-0">{pct}%</span>
      <span className="text-yellow-400 font-mono text-xs shrink-0">⭐ {progress.score} pts</span>
      {progress.lastUnlockedZone && (
        <span className="text-gray-500 font-mono text-xs hidden lg:block shrink-0">
          Last: {progress.lastUnlockedZone}
        </span>
      )}
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div className="absolute bottom-4 left-4 z-[1000] bg-gray-900/90 border border-green-900/40 rounded-lg px-3 py-2 font-mono text-xs space-y-1.5 pointer-events-none">
      <div className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded bg-gray-800 border border-gray-600 opacity-80" />
        <span className="text-gray-400">Locked (fog)</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded bg-teal-600/80 border border-teal-400" />
        <span className="text-teal-300">Riddle active</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded bg-green-500/80 border border-green-300" />
        <span className="text-green-300">Unlocked</span>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface FogOfWarProps {
  onClose: () => void;
}

export default function FogOfWar({ onClose }: FogOfWarProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const rectanglesRef = useRef<Map<number, any>>(new Map());
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

  // Load zones + progress
  const refreshData = useCallback(async () => {
    try {
      const [z, p] = await Promise.all([fogApi.getZones(), fogApi.getProgress()]);
      setZones(z);
      setProgress(p);
      return z;
    } catch (e: any) {
      setError("Failed to load game data. Is the Games service running?");
      return null;
    }
  }, []);

  // Initialize Leaflet map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current || mapRef.current) return;

    (async () => {
      setLoading(true);
      const L = (await import("leaflet")).default;

      const map = L.map(mapContainerRef.current!, {
        center: [20, 0],
        zoom: 2,
        minZoom: 1,
        maxZoom: 8,
        zoomControl: false,
      });

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap © CARTO", maxZoom: 19 }
      ).addTo(map);

      L.control.zoom({ position: "topright" }).addTo(map);
      mapRef.current = map;

      const zonesData = await refreshData();
      setLoading(false);

      if (zonesData) {
        renderZones(L, map, zonesData);
      }
    })();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Render/update zone rectangles
  const renderZones = useCallback((L: any, map: any, zonesData: FogZone[]) => {
    // Clear existing layers
    rectanglesRef.current.forEach((rect) => map.removeLayer(rect));
    markersRef.current.forEach((m) => map.removeLayer(m));
    rectanglesRef.current.clear();
    markersRef.current.clear();

    for (const zone of zonesData) {
      const bounds: [[number, number], [number, number]] = [
        [zone.bboxSouth, zone.bboxWest],
        [zone.bboxNorth, zone.bboxEast],
      ];

      let fillColor: string;
      let fillOpacity: number;
      let strokeColor: string;
      let strokeOpacity: number;

      if (zone.status === "UNLOCKED") {
        fillColor = "#22c55e";
        fillOpacity = 0.18;
        strokeColor = "#4ade80";
        strokeOpacity = 0.9;
      } else if (zone.status === "RIDDLE_ACTIVE") {
        fillColor = "#0d9488";
        fillOpacity = 0.35;
        strokeColor = "#2dd4bf";
        strokeOpacity = 0.9;
      } else {
        fillColor = "#111827";
        fillOpacity = 0.72;
        strokeColor = "#374151";
        strokeOpacity = 0.5;
      }

      const rect = L.rectangle(bounds, {
        fillColor,
        fillOpacity,
        color: strokeColor,
        opacity: strokeOpacity,
        weight: zone.status === "LOCKED" ? 1 : 2,
        className: zone.status === "UNLOCKED" ? "fog-zone-unlocked" : "",
      }).addTo(map);

      rect.on("click", () => {
        setSelectedZone(zone);
        setRiddle(null);
        setSelectedOption(null);
        setUnlockResult(null);
        setShowHint(false);
        // If riddle was already active, auto-load it
        if (zone.status === "RIDDLE_ACTIVE") {
          loadRiddleForZone(zone.id);
        }
      });

      rect.on("mouseover", () => {
        if (zone.status !== "UNLOCKED") {
          rect.setStyle({ fillOpacity: zone.status === "LOCKED" ? 0.55 : 0.45, weight: 2 });
        }
      });
      rect.on("mouseout", () => {
        rect.setStyle({ fillOpacity, weight: zone.status === "LOCKED" ? 1 : 2 });
      });

      rectanglesRef.current.set(zone.id, rect);

      // Add emoji marker for visible zones
      if (zone.status !== "LOCKED" || true) {
        const centerLat = (zone.bboxSouth + zone.bboxNorth) / 2;
        const centerLng = (zone.bboxWest + zone.bboxEast) / 2;

        const icon = L.divIcon({
          className: "",
          html: `<div style="
            font-size:${zone.status === "LOCKED" ? "12px" : "18px"};
            opacity:${zone.status === "LOCKED" ? "0.3" : "1"};
            filter:${zone.status === "LOCKED" ? "grayscale(1)" : "none"};
            pointer-events:none;
            text-align:center;
            line-height:1;
          ">${zone.emoji}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([centerLat, centerLng], { icon, interactive: false }).addTo(map);
        markersRef.current.set(zone.id, marker);
      }
    }
  }, []);

  // Re-render map when zones change
  useEffect(() => {
    if (!mapRef.current || zones.length === 0) return;
    import("leaflet").then(({ default: L }) => {
      renderZones(L, mapRef.current, zones);
    });
  }, [zones]);

  const loadRiddleForZone = async (zoneId: number) => {
    setRiddleLoading(true);
    try {
      const r = await fogApi.getRiddle(zoneId);
      setRiddle(r);
    } catch {
      setError("Failed to generate riddle.");
    } finally {
      setRiddleLoading(false);
    }
  };

  const handleGetRiddle = async () => {
    if (!selectedZone) return;
    await loadRiddleForZone(selectedZone.id);
    // Update zone status locally
    setZones((prev) =>
      prev.map((z) => z.id === selectedZone.id ? { ...z, status: "RIDDLE_ACTIVE" } : z)
    );
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
        // Refresh data
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

  const handlePanelClose = () => {
    setSelectedZone(null);
    setRiddle(null);
    setSelectedOption(null);
    setUnlockResult(null);
    setShowHint(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col font-mono">
      <ConfettiCanvas active={confetti} />

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-950 border-b border-green-900/40 z-10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌫️</span>
          <div>
            <h1 className="text-green-400 font-bold tracking-widest text-sm uppercase">
              Fog of War — World Explorer
            </h1>
            <p className="text-green-800 text-xs">Click a zone to reveal its secrets via AI riddles</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {progress && (
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-yellow-400">⭐ {progress.score} pts</span>
              <span className="text-green-600">|</span>
              <span className="text-green-500">{progress.unlockedZones} unlocked</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded border border-red-900/60 text-red-400 hover:bg-red-900/30 hover:border-red-600 transition-all uppercase tracking-wider"
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <ProgressBar progress={progress} />

      {/* ── Body: map + side panel ── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Map */}
        <div ref={mapContainerRef} className="flex-1 h-full relative" />

        {/* Legend */}
        {!loading && <Legend />}

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-950/90">
            <div className="flex flex-col items-center gap-3">
              <div className="text-4xl animate-pulse">🌍</div>
              <p className="text-green-400 font-mono text-sm animate-pulse">Loading world map...</p>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-red-900/80 border border-red-600 rounded-lg px-4 py-2 text-red-300 text-xs font-mono flex items-center gap-2">
            ⚠️ {error}
            <button onClick={() => setError(null)} className="text-red-400 hover:text-white ml-2">✕</button>
          </div>
        )}

        {/* Hint overlay when nothing selected */}
        {!selectedZone && !loading && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <div className="bg-gray-900/70 border border-green-900/30 rounded-lg px-4 py-2 text-green-700 text-xs font-mono animate-pulse">
              👆 Click any zone on the map to begin exploring
            </div>
          </div>
        )}

        {/* Side panel */}
        {selectedZone && (
          <div
            className="w-80 h-full border-l border-green-900/40 bg-gray-900/95 backdrop-blur p-4 overflow-y-auto"
            style={{ animation: "slideIn 0.25s ease-out" }}
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
              onClose={handlePanelClose}
            />
          </div>
        )}
      </div>

      {/* slide-in animation */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .fog-zone-unlocked {
          animation: glowPulse 2s ease-in-out infinite;
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

