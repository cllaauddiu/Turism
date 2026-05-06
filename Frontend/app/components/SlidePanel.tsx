import { useEffect, type ReactNode } from "react";

/**
 * Slide-over panel anchored to the right edge.
 * Replaces centered modal pattern across the app.
 *
 * Animation: 360ms ease-out slide + backdrop fade.
 * Keyboard: ESC closes. Click backdrop closes.
 */
interface SlidePanelProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  code?: string;       // e.g. "VEC·01"
  coord?: string;      // e.g. "44°26'N · 26°06'E"
  width?: "sm" | "md" | "lg" | "xl" | "full";
  children: ReactNode;
  /** When true, renders no padding (full-bleed: maps, charts) */
  bleed?: boolean;
}

const WIDTH_CLS: Record<NonNullable<SlidePanelProps["width"]>, string> = {
  sm: "w-full sm:w-[420px]",
  md: "w-full sm:w-[520px] md:w-[640px]",
  lg: "w-full sm:w-[520px] md:w-[640px] lg:w-[820px]",
  xl: "w-full sm:w-[640px] md:w-[820px] lg:w-[1040px]",
  full: "w-full sm:w-[92vw]",
};

export default function SlidePanel({
  open, onClose, title, code, coord, width = "lg", children, bleed = false,
}: SlidePanelProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.classList.add("modal-open");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("modal-open");
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        onClick={onClose}
        className="absolute inset-0 backdrop-blur-[2px] geo-fade-in"
        style={{ background: "rgba(40,30,10,0.45)" }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`absolute right-0 top-0 bottom-0 ${WIDTH_CLS[width]} bg-[#fbf6ec] border-l border-emerald-300/60 geo-slide-in flex flex-col shadow-[-30px_0_80px_-30px_rgba(25,107,70,0.25)]`}
      >
        <span className="absolute -left-px top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-emerald-500/60 to-transparent" />
        <header className="px-6 py-4 border-b border-emerald-300/50 flex items-center gap-4 shrink-0 bg-[#fbf6ec]/85 backdrop-blur-sm">
          {code && <div className="text-[10px] tracking-[0.3em] text-emerald-700 uppercase font-mono font-semibold">{code}</div>}
          <div className="flex-1 min-w-0">
            {title && <div className="text-stone-900 text-base truncate font-mono font-semibold">{title}</div>}
            {coord && <div className="text-[10px] text-emerald-700/70 tracking-widest font-mono">{coord}</div>}
          </div>
          <button
            onClick={onClose}
            className="text-[10px] tracking-[0.3em] uppercase px-3 py-2 border border-emerald-300/60 text-emerald-700 hover:bg-emerald-100/40 hover:border-emerald-500 transition font-mono"
          >
            Inchide ✕
          </button>
        </header>
        <div className={`flex-1 overflow-auto ${bleed ? "" : ""}`}>{children}</div>
      </div>
    </div>
  );
}
