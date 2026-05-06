import { useEffect, useRef, useState, type ReactNode } from "react";

/* ============================================================
   Shared cartographic primitives.
   ============================================================ */

export function pad(n: number, len = 2) { return String(n).padStart(len, "0"); }

export function fmtCoord(v: number, axis: "lat" | "lon") {
  const dir = axis === "lat" ? (v >= 0 ? "N" : "S") : (v >= 0 ? "E" : "W");
  const a = Math.abs(v);
  const deg = Math.floor(a);
  const min = Math.floor((a - deg) * 60);
  const sec = Math.floor(((a - deg) * 60 - min) * 60);
  return `${pad(deg, 2)}°${pad(min, 2)}'${pad(sec, 2)}"${dir}`;
}

export function useTime() {
  const [t, setT] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

export function useTypewriter(text: string, speed = 22, startDelay = 0) {
  const [out, setOut] = useState("");
  useEffect(() => {
    let i = 0; let id: number | undefined;
    setOut("");
    const to = window.setTimeout(() => {
      id = window.setInterval(() => {
        i++; setOut(text.slice(0, i));
        if (i >= text.length) window.clearInterval(id);
      }, speed);
    }, startDelay);
    return () => { window.clearTimeout(to); if (id) window.clearInterval(id); };
  }, [text, speed, startDelay]);
  return out;
}

export function useCounter(target: number, duration = 1400) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

/* ── Graticule corner ticks (atlas frame) ─────────────────────────────── */
export function GraticuleTick({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const map = {
    tl: "top-0 left-0 border-t border-l",
    tr: "top-0 right-0 border-t border-r",
    bl: "bottom-0 left-0 border-b border-l",
    br: "bottom-0 right-0 border-b border-r",
  } as const;
  return <span className={`absolute ${map[pos]} w-3 h-3 border-emerald-600/70`} />;
}

/* ── AtlasPanel: card with graticule corners + label/coord chips ──────── */
interface AtlasPanelProps {
  children: ReactNode;
  label?: string;
  coord?: string;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
  footerLeft?: ReactNode;
  footerRight?: ReactNode;
}

export function AtlasPanel({
  children, label, coord, className = "", interactive = false, onClick, footerLeft, footerRight,
}: AtlasPanelProps) {
  const Component: any = interactive ? "button" : "div";
  return (
    <Component
      onClick={onClick}
      className={`relative bg-[#f4efe6]/70 backdrop-blur-sm border border-emerald-300/50 rounded-sm p-5 text-left w-full ${interactive ? "hover:border-green-500/60 cursor-pointer transition-colors duration-300" : ""} ${className}`}
      style={{ boxShadow: "inset 0 0 0 1px rgba(25,107,70,0.06)" }}
    >
      <GraticuleTick pos="tl" /><GraticuleTick pos="tr" /><GraticuleTick pos="bl" /><GraticuleTick pos="br" />
      {label && (
        <div className="absolute -top-2 left-4 px-1.5 bg-[#f4efe6] text-[10px] font-mono tracking-[0.25em] uppercase text-emerald-700/90">
          {label}
        </div>
      )}
      {coord && (
        <div className="absolute -top-2 right-4 px-1.5 bg-[#f4efe6] text-[10px] font-mono tracking-widest text-emerald-600">
          {coord}
        </div>
      )}
      {children}
      {(footerLeft || footerRight) && (
        <div className="mt-4 pt-3 border-t border-emerald-300/30 flex items-center justify-between text-[10px] font-mono text-emerald-600 uppercase tracking-widest">
          <span>{footerLeft}</span><span>{footerRight}</span>
        </div>
      )}
    </Component>
  );
}

/* ── SectionRule: section divider with label + sub ────────────────────── */
export function SectionRule({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="flex items-center gap-4 mb-5">
      <div className="text-[10px] tracking-[0.4em] text-emerald-700/90 uppercase font-mono">{label}</div>
      {sub && <div className="text-[10px] tracking-[0.3em] text-stone-400 uppercase font-mono">{sub}</div>}
      <div className="flex-1 h-px bg-gradient-to-r from-green-900/60 via-green-900/20 to-transparent" />
    </div>
  );
}

/* ── Key/Value row ───────────────────────────────────────────────────── */
export function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex justify-between gap-3 border-b border-emerald-300/20 pb-1">
      <span className="text-emerald-700/90 tracking-wider uppercase text-[10px] font-mono">{k}</span>
      <span className="text-emerald-900 text-[12px] font-mono">{v}</span>
    </div>
  );
}

/* ── Background graticule + drifting particles + sweeping scan ────────── */
export function CartoBackground() {
  const dotsRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = dotsRef.current; if (!el) return;
    el.innerHTML = "";
    const N = 36;
    for (let i = 0; i < N; i++) {
      const d = document.createElement("div");
      d.className = "geo-dot";
      d.style.top = (Math.random() * 100) + "%";
      d.style.left = (Math.random() * 100) + "%";
      const dur = 40 + Math.random() * 60;
      d.style.animation = `geo-drift ${dur}s linear infinite`;
      d.style.animationDelay = `-${Math.random() * dur}s`;
      d.style.opacity = (0.15 + Math.random() * 0.4).toFixed(2);
      el.appendChild(d);
    }
  }, []);
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% 35%, rgba(25,107,70,0.10) 0%, rgba(244,239,230,0.92) 60%, #f4efe6 100%)" }}
      />
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
        <defs>
          <pattern id="geo-grat" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M80 0 L0 0 0 80" fill="none" stroke="rgba(74,222,128,0.07)" strokeWidth="0.5" />
          </pattern>
          <pattern id="geo-grat2" width="320" height="320" patternUnits="userSpaceOnUse">
            <path d="M320 0 L0 0 0 320" fill="none" stroke="rgba(74,222,128,0.13)" strokeWidth="0.6" />
          </pattern>
          <radialGradient id="geo-globe-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(74,222,128,0.18)" />
            <stop offset="60%" stopColor="rgba(25,107,70,0.06)" />
            <stop offset="100%" stopColor="rgba(74,222,128,0)" />
          </radialGradient>
        </defs>
        <rect width="1600" height="900" fill="url(#geo-grat)" />
        <rect width="1600" height="900" fill="url(#geo-grat2)" />
        <g stroke="rgba(74,222,128,0.10)" fill="none" strokeWidth="0.8">
          {[0.15, 0.3, 0.45, 0.55, 0.7, 0.85].map((p, i) => {
            const cx = 1600 * p;
            return <ellipse key={i} cx={cx} cy={450} rx={Math.abs(800 * (p - 0.5)) * 1.4 + 60} ry={380} />;
          })}
        </g>
        <g stroke="rgba(74,222,128,0.10)" fill="none" strokeWidth="0.8">
          {[0.2, 0.35, 0.5, 0.65, 0.8].map((p, i) => (
            <line key={i} x1={0} y1={900 * p} x2={1600} y2={900 * p} />
          ))}
        </g>
        <g stroke="rgba(74,222,128,0.08)" fill="none" strokeWidth="0.6">
          <path d="M -50 600 Q 300 540, 600 580 T 1200 540 T 1700 600" />
          <path d="M -50 660 Q 350 600, 700 640 T 1300 600 T 1700 660" />
          <path d="M -50 720 Q 400 660, 800 700 T 1400 660 T 1700 720" />
        </g>
        <circle cx={800} cy={450} r={520} fill="url(#geo-globe-glow)" />
      </svg>
      <div ref={dotsRef} className="absolute inset-0" />
      <div
        className="absolute inset-x-0 h-[180px] geo-scan"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(74,222,128,0.05), transparent)" }}
      />
    </div>
  );
}
