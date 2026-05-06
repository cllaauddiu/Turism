import { useEffect, useState } from "react";
import { AtlasPanel, Row, useCounter, useTime, GraticuleTick, fmtCoord, pad } from "./atlas";
import type { WeatherData, FogProgress, LeaderboardEntry } from "~/lib/api";

/* ============================================================
   TopStrip — top navbar with sigil, live UTC, user, disconnect
   ============================================================ */
export function TopStrip({
  user, onProfile, onLogout,
}: {
  user: { username: string; role: string };
  onProfile: () => void;
  onLogout: () => void;
}) {
  const t = useTime();
  const utc = `${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}:${pad(t.getUTCSeconds())} UTC`;
  const day = `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;

  return (
    <header className="relative z-30 border-b border-emerald-300/50 bg-[#f4efe6]/85 backdrop-blur-md">
      <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-green-500/60 to-transparent" />
      <div className="px-4 sm:px-6 py-3 grid grid-cols-3 items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-9 h-9 shrink-0">
            <svg viewBox="0 0 40 40" className="absolute inset-0 geo-spin-slow text-emerald-700/70">
              <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="2 3" />
            </svg>
            <svg viewBox="0 0 40 40" className="absolute inset-0 geo-spin-slower text-emerald-700/40">
              <circle cx="20" cy="20" r="13" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 4" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 " />
            </div>
          </div>
          <div className="leading-tight min-w-0 font-mono">
            <div className="text-emerald-800 text-[13px] tracking-[0.3em] font-semibold">GEO·ATLAS</div>
            <div className="text-emerald-600 text-[10px] tracking-[0.4em] uppercase">Cartographic Console v2</div>
          </div>
        </div>

        {/* Center ribbon */}
        <div className="hidden md:flex items-center justify-center gap-6 font-mono">
          <RibbonStat label="POS" value="44°26'N · 26°06'E" />
          <RibbonStat label="UTC" value={utc} />
          <RibbonStat label="JUL" value={day} />
        </div>

        {/* User */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 font-mono">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-emerald-300/60 bg-emerald-100/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600  animate-pulse" />
            <span className="text-[10px] tracking-widest text-emerald-800">LINK·UP</span>
          </div>
          <button onClick={onProfile} className="flex items-center gap-2 group">
            <div className="w-8 h-8 border border-emerald-400/60 bg-emerald-100/40 flex items-center justify-center text-emerald-800 text-xs uppercase">
              {user.username.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-[12px] text-emerald-800 group-hover:text-emerald-900 leading-tight">{user.username}</div>
              <div className="text-[9px] text-emerald-600 tracking-widest uppercase">{user.role}</div>
            </div>
          </button>
          <button
            onClick={onLogout}
            className="text-[10px] tracking-[0.25em] uppercase px-3 py-2 border border-red-400/60 text-red-700 hover:bg-red-100/40 transition"
          >
            Disconnect
          </button>
        </div>
      </div>
    </header>
  );
}
function RibbonStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[9px] tracking-[0.3em] text-emerald-600">{label}</span>
      <span className="text-[12px] text-emerald-800 tabular-nums">{value}</span>
    </div>
  );
}

/* ============================================================
   Mission header — typewriter intro + quick-launch dial
   ============================================================ */
import { useTypewriter } from "./atlas";

export function MissionHeader({
  user, onLaunch,
}: { user: { username: string }; onLaunch: (k: FeatureKey) => void }) {
  const greet = useTypewriter(`> bun venit, ${user.username.toLowerCase()}.`, 18, 200);
  const sub = useTypewriter("> initializare consola atlas... harti incarcate. semnal stabil.", 14, 1200);

  return (
    <section className="relative z-10 px-4 sm:px-6 pt-10 pb-6">
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6 items-end">
        <div className="col-span-12 lg:col-span-8">
          <div className="text-[11px] tracking-[0.4em] text-emerald-600 uppercase mb-3 font-mono">
            Coordonate · 44°26'N · 26°06'E · Sector EU/RO
          </div>
          <h1 className="text-[36px] sm:text-[52px] md:text-[64px] leading-[0.95] tracking-tight font-semibold text-stone-900 font-mono">
            <span className="text-emerald-700">Atlas</span> in timp real.<br />
            Lumea ca terminal.
          </h1>
          <div className="mt-5 max-w-xl text-emerald-800/80 text-sm leading-relaxed font-mono">
            <div>{greet}<span className="geo-caret" /></div>
            <div className="mt-1 text-emerald-700/80">{sub}</div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4">
          <AtlasPanel label="Comanda Rapida" coord="CMD·01" footerLeft="6 vectori" footerRight="enter ↩">
            <ul className="divide-y divide-emerald-300/50 -mx-1">
              {QUICK_LAUNCH.map(([k, t, s]) => (
                <li key={k}>
                  <button onClick={() => onLaunch(k)} className="w-full px-1 py-2 flex items-center gap-3 group font-mono">
                    <span className="text-[10px] text-emerald-600 group-hover:text-emerald-700 tracking-widest w-12 shrink-0 uppercase">{k}</span>
                    <span className="text-emerald-900 text-[13px] flex-1 text-left">{t}</span>
                    <span className="text-[10px] text-emerald-600 group-hover:text-emerald-700 hidden sm:inline">{s}</span>
                    <span className="text-emerald-600 group-hover:text-emerald-800 transition">›</span>
                  </button>
                </li>
              ))}
            </ul>
          </AtlasPanel>
        </div>
      </div>
    </section>
  );
}

export type FeatureKey = "map" | "fog" | "search" | "chat" | "holiday" | "weather" | "profile";
const QUICK_LAUNCH: [FeatureKey, string, string][] = [
  ["map", "Hartă Interactivă", "grid + tiles"],
  ["fog", "Fog of War", "ghicitori globale"],
  ["search", "Caută Locație", "geocoder"],
  ["chat", "AI Assistant", "claude · sonnet"],
  ["holiday", "Planner Vacanță", "wizard 3 pasi"],
  ["weather", "Istoric Vreme", "timescale · 20 orase"],
];

/* ============================================================
   Feature grid — 6 large launch tiles with cartographic paint
   ============================================================ */
const FEATURES: { key: FeatureKey; code: string; title: string; sub: string; lat: number; lon: number; paint: PaintKind }[] = [
  { key: "map", code: "01", title: "Harta Interactiva", sub: "Tiles · Vreme · Locuri", lat: 44.43, lon: 26.10, paint: "radar" },
  { key: "fog", code: "02", title: "Fog of War", sub: "Joc global cu ghicitori", lat: 35.68, lon: 139.69, paint: "fog" },
  { key: "holiday", code: "03", title: "Planner Vacanta", sub: "Asistent AI · 3 pasi", lat: 48.85, lon: 2.35, paint: "compass" },
  { key: "weather", code: "04", title: "Istoric Vreme", sub: "20 orase · 30 zile", lat: 51.50, lon: -0.13, paint: "chart" },
  { key: "chat", code: "05", title: "AI Assistant", sub: "Conversatii Claude", lat: 40.71, lon: -74.00, paint: "chat" },
  { key: "search", code: "06", title: "Cauta Locatie", sub: "Geocoder global", lat: -33.86, lon: 151.20, paint: "target" },
];

type PaintKind = "radar" | "fog" | "compass" | "chart" | "chat" | "target";

function FeaturePaint({ kind }: { kind: PaintKind }) {
  const common = "absolute inset-0 w-full h-full";
  if (kind === "radar") return (
    <svg viewBox="0 0 200 120" className={common}>
      <defs>
        <radialGradient id="rg" cx="50%" cy="60%" r="60%">
          <stop offset="0%" stopColor="rgba(74,222,128,0.4)" />
          <stop offset="100%" stopColor="rgba(74,222,128,0)" />
        </radialGradient>
      </defs>
      {[20, 40, 60, 80].map(r => <circle key={r} cx="100" cy="72" r={r} fill="none" stroke="rgba(74,222,128,0.18)" strokeWidth="0.6" />)}
      <line x1="20" y1="72" x2="180" y2="72" stroke="rgba(74,222,128,0.18)" strokeWidth="0.5" />
      <line x1="100" y1="0" x2="100" y2="120" stroke="rgba(74,222,128,0.18)" strokeWidth="0.5" />
      <g style={{ transformOrigin: "100px 72px", animation: "geo-spin 6s linear infinite" }}>
        <path d="M100 72 L180 72 A80 80 0 0 0 145 8 Z" fill="url(#rg)" />
      </g>
      <circle cx="135" cy="50" r="2" fill="#196b46" />
      <circle cx="60" cy="90" r="1.5" fill="#196b46" opacity="0.7" />
    </svg>
  );
  if (kind === "fog") return (
    <svg viewBox="0 0 200 120" className={common}>
      <g fill="none" stroke="rgba(74,222,128,0.25)" strokeWidth="0.6">
        {Array.from({ length: 8 }).map((_, i) => <circle key={i} cx={20 + i * 22} cy={(i % 2) ? 40 : 80} r="6" />)}
      </g>
      <g>
        {Array.from({ length: 8 }).map((_, i) => <circle key={i} cx={20 + i * 22} cy={(i % 2) ? 40 : 80} r="4" fill={i < 3 ? "#196b46" : "rgba(74,222,128,0.15)"} opacity={i < 3 ? 0.9 : 0.5} />)}
      </g>
    </svg>
  );
  if (kind === "compass") return (
    <svg viewBox="0 0 200 120" className={common}>
      <g transform="translate(100 60)">
        <circle r="40" fill="none" stroke="rgba(74,222,128,0.25)" strokeWidth="0.6" />
        <circle r="30" fill="none" stroke="rgba(74,222,128,0.18)" strokeWidth="0.5" />
        <g style={{ animation: "geo-spin 30s linear infinite" }}>
          <polygon points="0,-40 -4,0 0,-12 4,0" fill="#196b46" />
          <polygon points="0,40 -3,0 0,8 3,0" fill="rgba(74,222,128,0.4)" />
        </g>
      </g>
    </svg>
  );
  if (kind === "chart") return (
    <svg viewBox="0 0 200 120" className={common} preserveAspectRatio="none">
      <g stroke="rgba(74,222,128,0.18)" strokeWidth="0.5">
        {[24, 48, 72, 96].map(y => <line key={y} x1="0" x2="200" y1={y} y2={y} />)}
      </g>
      <polyline fill="none" stroke="#196b46" strokeWidth="1.5" points="0,80 20,72 40,76 60,55 80,60 100,40 120,48 140,30 160,38 180,22 200,28" />
      <polyline fill="none" stroke="rgba(74,222,128,0.4)" strokeWidth="1" points="0,90 20,84 40,88 60,72 80,76 100,58 120,66 140,52 160,58 180,46 200,52" />
    </svg>
  );
  if (kind === "chat") return (
    <svg viewBox="0 0 200 120" className={common}>
      <rect x="10" y="20" width="100" height="22" fill="none" stroke="rgba(74,222,128,0.4)" strokeWidth="0.6" />
      <text x="14" y="34" fill="rgba(74,222,128,0.8)" fontSize="8" fontFamily="monospace">&gt; cum ajung in tokyo?</text>
      <rect x="60" y="60" width="130" height="22" fill="none" stroke="rgba(74,222,128,0.25)" strokeWidth="0.6" />
      <text x="64" y="74" fill="rgba(74,222,128,0.55)" fontSize="8" fontFamily="monospace">&lt; via NRT/HND, 11h45...</text>
      <rect x="10" y="92" width="80" height="18" fill="none" stroke="rgba(74,222,128,0.4)" strokeWidth="0.6" />
    </svg>
  );
  return (
    <svg viewBox="0 0 200 120" className={common}>
      <g stroke="rgba(74,222,128,0.3)" fill="none" strokeWidth="0.6">
        {[10, 22, 34, 46].map(r => <circle key={r} cx="100" cy="60" r={r} />)}
      </g>
      <line x1="100" y1="20" x2="100" y2="100" stroke="rgba(74,222,128,0.3)" strokeWidth="0.5" />
      <line x1="60" y1="60" x2="140" y2="60" stroke="rgba(74,222,128,0.3)" strokeWidth="0.5" />
      <circle cx="100" cy="60" r="2" fill="#196b46" />
      <circle cx="100" cy="60" r="6" fill="none" stroke="#196b46" strokeWidth="1" style={{ transformOrigin: "100px 60px", animation: "geo-ping 2.4s ease-out infinite" }} />
    </svg>
  );
}

export function FeatureGrid({ onLaunch }: { onLaunch: (k: FeatureKey) => void }) {
  return (
    <section className="relative z-10 px-4 sm:px-6 pb-10">
      <div className="max-w-7xl mx-auto">
        <SectionRule label="Vectori Operationali" sub="6 module · click pentru deschidere" />
        <div className="grid grid-cols-12 gap-4">
          {FEATURES.map((f, i) => (
            <button
              key={f.key}
              onClick={() => onLaunch(f.key)}
              style={{ animationDelay: `${i * 60}ms` }}
              className="geo-rise group relative col-span-12 sm:col-span-6 lg:col-span-4 text-left bg-[#f4efe6]/70 border border-emerald-300/50 hover:border-emerald-600/70 transition-colors p-5 overflow-hidden font-mono"
            >
              <GraticuleTick pos="tl" /><GraticuleTick pos="tr" /><GraticuleTick pos="bl" /><GraticuleTick pos="br" />
              <div className="absolute -top-2 left-4 px-1.5 bg-[#f4efe6] text-[10px] tracking-widest text-emerald-700/90">VEC·{f.code}</div>
              <div className="absolute -top-2 right-4 px-1.5 bg-[#f4efe6] text-[10px] tracking-widest text-emerald-600 hidden sm:block">
                {fmtCoord(f.lat, "lat")} · {fmtCoord(f.lon, "lon")}
              </div>
              <div className="relative h-24 mb-4 opacity-90 group-hover:opacity-100">
                <FeaturePaint kind={f.paint} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 60%, #f4efe6)" }} />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-stone-900 text-[18px] font-semibold tracking-tight">{f.title}</div>
                  <div className="text-emerald-700 text-[11px] tracking-widest uppercase mt-0.5">{f.sub}</div>
                </div>
                <div className="text-emerald-700 text-[10px] tracking-widest uppercase border border-emerald-300/70 px-2 py-1 group-hover:bg-emerald-100/40 group-hover:border-emerald-600/50">
                  Open ↩
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

import { SectionRule } from "./atlas";

/* ============================================================
   Big stat ribbon
   ============================================================ */
export function BigStat({ label, value, unit, foot }: { label: string; value: string; unit: string; foot: string }) {
  return (
    <AtlasPanel label={label} coord={foot}>
      <div className="flex items-baseline gap-2">
        <span className="text-emerald-900 text-[34px] leading-none tabular-nums font-mono">{value}</span>
        <span className="text-emerald-600 text-[12px] tracking-widest uppercase font-mono">{unit}</span>
      </div>
      <div className="mt-3 h-px bg-gradient-to-r from-green-500/60 via-green-500/10 to-transparent" />
    </AtlasPanel>
  );
}

/* ============================================================
   Live weather widget — animated dial (real fetch optional)
   ============================================================ */
export function LiveWeatherWidget({ data, age }: { data?: Partial<WeatherData> | null; age?: string }) {
  const tempTarget = data?.temperature ?? 14.6;
  const feels = data?.feelsLike ?? 13.1;
  const wind = data?.windSpeed ?? 12;
  const windDir = data?.windDirectionLabel ?? "NV";
  const hum = data?.humidity ?? 68;
  const uv = data?.uvIndex ?? 3;
  const vis = data?.visibility ?? 14;
  const cond = data?.conditions ?? "Cer partial noros";

  const t = useCounter(tempTarget);

  return (
    <AtlasPanel label="Vreme · Bucuresti" coord="44.43°N 26.10°E" footerLeft="open-meteo · live" footerRight={age ?? "updating..."}>
      <div className="grid grid-cols-2 gap-4 items-center">
        <div className="relative aspect-square">
          <svg viewBox="0 0 100 100" className="absolute inset-0">
            <defs>
              <linearGradient id="weatherDial" x1="0" x2="1">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#196b46" />
              </linearGradient>
            </defs>
            <g stroke="rgba(74,222,128,0.3)" strokeWidth="0.5">
              {Array.from({ length: 36 }).map((_, i) => {
                const a = (i * 10 - 90) * Math.PI / 180;
                const x1 = 50 + Math.cos(a) * 42, y1 = 50 + Math.sin(a) * 42;
                const x2 = 50 + Math.cos(a) * 46, y2 = 50 + Math.sin(a) * 46;
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
              })}
            </g>
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(74,222,128,0.2)" strokeWidth="1" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="url(#weatherDial)" strokeWidth="2"
              strokeDasharray={`${Math.max(0, Math.min(40, t) / 40) * 251.2} 251.2`} strokeLinecap="round"
              transform="rotate(-90 50 50)" />
            <text x="50" y="48" textAnchor="middle" fill="#86efac" fontSize="18" fontFamily="JetBrains Mono, ui-monospace, monospace" fontWeight="600">{t.toFixed(1)}°</text>
            <text x="50" y="62" textAnchor="middle" fill="#15803d" fontSize="6" fontFamily="JetBrains Mono, ui-monospace, monospace" letterSpacing="2">CELSIUS</text>
          </svg>
        </div>
        <div className="space-y-2.5">
          <Row k="Conditii" v={cond} />
          <Row k="Resimtit" v={`${feels.toFixed(1)}°C`} />
          <Row k="Vant" v={`${Math.round(wind)} km/h ${windDir}`} />
          <Row k="Umiditate" v={`${Math.round(hum)}%`} />
          <Row k="Indice UV" v={`${Math.round(uv)} · ${uv < 3 ? "scazut" : uv < 6 ? "moderat" : "ridicat"}`} />
          <Row k="Vizibilitate" v={`${Math.round(vis)} km`} />
        </div>
      </div>
    </AtlasPanel>
  );
}

/* ============================================================
   Fog progress widget
   ============================================================ */
export function FogProgressWidget({
  progress, onLaunch,
}: { progress?: FogProgress | null; onLaunch: (k: FeatureKey) => void }) {
  const total = progress?.totalZones ?? 64;
  const done = progress?.unlockedZones ?? 0;
  const active = progress?.activeRiddles ?? 0;
  const score = progress?.score ?? 0;
  const pct = total > 0 ? (done / total) * 100 : 0;
  const cells = Array.from({ length: Math.max(total, 32) });

  return (
    <AtlasPanel
      label="Fog of War"
      coord="GLOBAL"
      interactive
      onClick={() => onLaunch("fog")}
      footerLeft={`scor ${score.toLocaleString("ro-RO")}`}
      footerRight={`${active} ghicitori active`}
    >
      <div className="grid gap-[3px] mb-4" style={{ gridTemplateColumns: "repeat(16,minmax(0,1fr))" }}>
        {cells.map((_, i) => (
          <div
            key={i}
            className={`aspect-square ${i < done ? "bg-emerald-600/80 " : i < done + active ? "bg-amber-400/60 animate-pulse" : "bg-emerald-200/40"}`}
          />
        ))}
      </div>
      <div className="flex items-end justify-between font-mono">
        <div>
          <div className="text-[11px] text-emerald-700 tracking-widest uppercase">Zone deblocate</div>
          <div className="text-emerald-900 text-2xl tabular-nums">{done}<span className="text-emerald-600 text-base"> / {total}</span></div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-emerald-700 tracking-widest uppercase">Progres</div>
          <div className="text-emerald-900 text-2xl tabular-nums">{pct.toFixed(0)}%</div>
        </div>
      </div>
      <div className="mt-3 h-1 bg-green-900/40 relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-emerald-600  transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </AtlasPanel>
  );
}

/* ============================================================
   Leaderboard mini
   ============================================================ */
export function LeaderboardMiniWidget({
  rows, currentUser,
}: { rows?: LeaderboardEntry[] | null; currentUser?: string }) {
  // Show top 3 + a window around current user
  const list: LeaderboardEntry[] = (rows ?? []);
  let view: LeaderboardEntry[] = list.slice(0, 6);
  const meIdx = list.findIndex(r => r.username === currentUser);
  if (meIdx >= 4) {
    view = [...list.slice(0, 3), ...list.slice(Math.max(3, meIdx - 1), meIdx + 2)];
  }

  return (
    <AtlasPanel label="Leaderboard" coord="LIVE·WS" footerLeft="topic /leaderboard" footerRight={`${list.length} jucatori`}>
      {list.length === 0 ? (
        <div className="text-emerald-600 text-[11px] tracking-widest uppercase font-mono py-6 text-center">
          fara date · astept primul mesaj WS
        </div>
      ) : (
        <ul className="divide-y divide-emerald-300/50 -mx-1 font-mono">
          {view.map(r => {
            const you = r.username === currentUser;
            return (
              <li key={r.rank} className={`px-1 py-1.5 flex items-center gap-3 text-[12px] ${you ? "bg-emerald-100/30" : ""}`}>
                <span className={`w-8 text-right tabular-nums ${r.rank <= 3 ? "text-emerald-800" : "text-emerald-600"}`}>#{r.rank}</span>
                <span className={`flex-1 truncate ${you ? "text-emerald-900 font-semibold" : "text-emerald-800/90"}`}>
                  {r.username}{you && <span className="ml-1 text-[9px] text-emerald-700 tracking-widest">[TU]</span>}
                </span>
                <span className="text-emerald-600 tabular-nums w-12 text-right">{r.unlockedZones}z</span>
                <span className="text-emerald-900 tabular-nums w-16 text-right">{r.score.toLocaleString("ro-RO")}</span>
              </li>
            );
          })}
        </ul>
      )}
    </AtlasPanel>
  );
}

/* ============================================================
   Command feed — simulated session log w/ live ticks
   ============================================================ */
type FeedRow = { t: string; k: "sys" | "net" | "map" | "fog" | "ai" | "hist" | "loc"; text: string };
const FEED_INIT: FeedRow[] = [
  { t: "−02:14", k: "sys", text: "sesiune initiata · jwt validat" },
  { t: "−01:58", k: "net", text: "ws://chatbox/ws · subscribe /topic/notifications" },
  { t: "−01:42", k: "map", text: "tile cdn cartocdn/dark_all · 412 chunks cache hit" },
  { t: "−01:20", k: "fog", text: "zona deblocata · `fjordurile norvegiei`" },
  { t: "−00:54", k: "ai", text: "prompt → claude · 412 tok · 1.4s" },
  { t: "−00:32", k: "hist", text: "timescale query · 7d · 4 orase" },
  { t: "−00:11", k: "loc", text: "coordonate manuale 44.43,26.10 fixate" },
];

export function CommandFeed() {
  const [feed, setFeed] = useState<FeedRow[]>(FEED_INIT);
  useEffect(() => {
    const tick = () => {
      const opts: Omit<FeedRow, "t">[] = [
        { k: "net", text: "ws ping · 28ms" },
        { k: "map", text: "tile prefetch · z=4" },
        { k: "sys", text: "heartbeat ok" },
        { k: "ai", text: "intent classifier · OK" },
        { k: "loc", text: `mouse@map ${(40 + Math.random() * 20).toFixed(2)}°N ${(20 + Math.random() * 15).toFixed(2)}°E` },
      ];
      const pick = opts[Math.floor(Math.random() * opts.length)];
      setFeed(f => [{ t: "now", ...pick }, ...f].slice(0, 9));
    };
    const id = window.setInterval(tick, 3500);
    return () => window.clearInterval(id);
  }, []);

  const tag = (k: FeedRow["k"]) => ({
    sys: "text-emerald-700", net: "text-teal-700", map: "text-emerald-800",
    fog: "text-amber-700", ai: "text-emerald-700", hist: "text-teal-700", loc: "text-emerald-900",
  }[k] ?? "text-emerald-700");

  return (
    <AtlasPanel label="Jurnal Sesiune" coord="STDOUT" footerLeft="9 ultime evenimente" footerRight="auto-stream">
      <ul className="space-y-1.5 font-mono text-[12px] max-h-[260px] overflow-hidden">
        {feed.map((row, i) => (
          <li key={i} className={`flex gap-3 ${i === 0 ? "animate-pulse" : ""}`}>
            <span className="text-stone-400 w-12 shrink-0 tabular-nums">{row.t}</span>
            <span className={`uppercase tracking-widest text-[10px] w-10 shrink-0 ${tag(row.k)}`}>{row.k}</span>
            <span className="text-emerald-800/90 truncate">{row.text}</span>
          </li>
        ))}
      </ul>
    </AtlasPanel>
  );
}

/* ============================================================
   Session panel — user / coordinates / actions
   ============================================================ */
export function SessionPanel({
  user, onChangePwd, onPrefs, onLogout,
}: { user: { username: string; role: string }; onChangePwd?: () => void; onPrefs?: () => void; onLogout: () => void }) {
  return (
    <AtlasPanel label="Sesiune Activa" coord="LOCAL" footerLeft={`token: ●●●●·3f9a`} footerRight="exp 24h">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        <Row k="Utilizator" v={user.username} />
        <Row k="Rol" v={user.role} />
        <Row k="Continent" v="Europa" />
        <Row k="Tara" v="Romania" />
        <Row k="Capitala" v="Bucuresti" />
        <Row k="Fus" v="UTC+2" />
        <Row k="Latitudine" v="44° 26' N" />
        <Row k="Longitudine" v="26° 06' E" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 font-mono">
        <button onClick={onChangePwd} className="text-[10px] tracking-[0.25em] uppercase border border-emerald-300/70 text-emerald-800 hover:bg-emerald-100/40 px-2 py-2">Parola</button>
        <button onClick={onPrefs} className="text-[10px] tracking-[0.25em] uppercase border border-emerald-300/70 text-emerald-800 hover:bg-emerald-100/40 px-2 py-2">Preferinte</button>
        <button onClick={onLogout} className="text-[10px] tracking-[0.25em] uppercase border border-red-400/60 text-red-700 hover:bg-red-100/40 px-2 py-2">Disconnect</button>
      </div>
    </AtlasPanel>
  );
}

/* ============================================================
   Mouse-tracking coordinate readout (bottom-right)
   ============================================================ */
export function CoordReadout() {
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 });
  useEffect(() => {
    const onMove = (e: MouseEvent) => setPos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  const lat = (90 - pos.y * 180);
  const lon = (-180 + pos.x * 360);
  return (
    <div className="hidden lg:flex fixed bottom-4 right-4 z-30 items-center gap-3 px-4 py-2 bg-[#f4efe6]/90 border border-emerald-300/70 backdrop-blur-md font-mono">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600  animate-pulse" />
      <span className="text-[10px] text-emerald-600 tracking-widest uppercase">Cursor</span>
      <span className="text-[11px] text-emerald-900 tabular-nums">{fmtCoord(lat, "lat")} · {fmtCoord(lon, "lon")}</span>
    </div>
  );
}

/* ============================================================
   CRT intensity tweak — bottom-left
   ============================================================ */
export function CrtTweak({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="fixed bottom-4 left-4 z-30 flex items-center gap-3 px-3 py-2 bg-[#f4efe6]/90 border border-emerald-300/70 backdrop-blur-md font-mono">
      <span className="text-[10px] text-emerald-600 tracking-widest uppercase">CRT</span>
      <input
        type="range" min={0} max={1} step={0.05}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="accent-green-400 w-28"
      />
      <span className="text-[10px] text-emerald-800 tabular-nums w-10 text-right">{(value * 100).toFixed(0)}%</span>
    </div>
  );
}
