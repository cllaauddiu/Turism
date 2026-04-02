import { useEffect, useRef, useState, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
type SearchMode = "name" | "coords" | "image";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  address?: {
    country?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    county?: string;
  };
}

interface GeoResult {
  name: string;
  lat: number;
  lon: number;
  type: string;
  country?: string;
  region?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatCoord(val: number, posLabel: string, negLabel: string) {
  const abs = Math.abs(val);
  const deg = Math.floor(abs);
  const minFull = (abs - deg) * 60;
  const min = Math.floor(minFull);
  const sec = ((minFull - min) * 60).toFixed(1);
  return `${deg}°${min}'${sec}" ${val >= 0 ? posLabel : negLabel}`;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ModeTab({
  mode,
  active,
  onClick,
  icon,
  label,
}: {
  mode: SearchMode;
  active: SearchMode;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-mono text-xs uppercase tracking-widest transition-all duration-300 border ${
        active === mode
          ? "bg-green-500/15 border-green-500/50 text-green-300"
          : "border-green-900/30 text-green-800 hover:text-green-600 hover:border-green-800/60 hover:bg-green-950/30"
      }`}
    >
      <span className="text-base">{icon}</span>
      {label}
    </button>
  );
}

function ResultCard({ result, onView }: { result: GeoResult; onView: (r: GeoResult) => void }) {
  return (
    <div
      className="group flex items-start justify-between gap-4 p-4 rounded-xl border border-green-900/30 bg-gray-900/60 hover:border-green-600/50 hover:bg-gray-900/80 transition-all cursor-pointer"
      onClick={() => onView(result)}
    >
      <div className="flex-1 min-w-0">
        <p className="text-green-200 text-sm font-semibold truncate">{result.name}</p>
        <div className="flex flex-wrap gap-3 mt-1.5">
          <span className="text-green-700 font-mono text-xs">
            {formatCoord(result.lat, "N", "S")}
          </span>
          <span className="text-green-700 font-mono text-xs">
            {formatCoord(result.lon, "E", "W")}
          </span>
        </div>
        {result.country && (
          <p className="text-green-800 text-xs mt-1 font-mono">{result.region ? `${result.region}, ` : ""}{result.country}</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className="text-xs px-2 py-0.5 rounded border border-green-900/40 text-green-700 font-mono capitalize">
          {result.type}
        </span>
        <span className="text-green-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity font-mono">
          Ver pe hartă →
        </span>
      </div>
    </div>
  );
}

// ── Main GeoSearch component ───────────────────────────────────────────────
interface GeoSearchProps {
  onClose: () => void;
  onViewOnMap?: (lat: number, lon: number, name: string) => void;
}

export default function GeoSearch({ onClose, onViewOnMap }: GeoSearchProps) {
  const [mode, setMode] = useState<SearchMode>("name");

  // Name search
  const [nameQuery, setNameQuery] = useState("");
  const [nameResults, setNameResults] = useState<GeoResult[]>([]);
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Coords search
  const [coordLat, setCoordLat] = useState("");
  const [coordLon, setCoordLon] = useState("");
  const [coordResult, setCoordResult] = useState<GeoResult | null>(null);
  const [coordLoading, setCoordLoading] = useState(false);
  const [coordError, setCoordError] = useState("");

  // Image search
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageResult, setImageResult] = useState<GeoResult | null>(null);
  const [imageError, setImageError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // ── MODE: NAME ─────────────────────────────────────────────────────────
  const searchByName = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) { setNameResults([]); return; }
    setNameLoading(true);
    setNameError("");
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1`;
      const res = await fetch(url, { headers: { "Accept-Language": "ro,en" } });
      const data: NominatimResult[] = await res.json();
      setNameResults(
        data.map((d) => ({
          name: d.display_name.split(",").slice(0, 2).join(",").trim(),
          lat: parseFloat(d.lat),
          lon: parseFloat(d.lon),
          type: d.type,
          country: d.address?.country,
          region: d.address?.state ?? d.address?.county,
        }))
      );
      if (data.length === 0) setNameError("Nicio locație găsită. Încearcă un alt termen.");
    } catch {
      setNameError("Eroare la căutare. Verifică conexiunea la internet.");
    } finally {
      setNameLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!nameQuery.trim()) { setNameResults([]); setNameError(""); return; }
    debounceRef.current = setTimeout(() => searchByName(nameQuery), 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [nameQuery, searchByName]);

  // ── MODE: COORDS ───────────────────────────────────────────────────────
  const searchByCoords = async () => {
    const lat = parseFloat(coordLat);
    const lon = parseFloat(coordLon);
    if (isNaN(lat) || isNaN(lon)) { setCoordError("Introdu coordonate valide (ex: 44.4268, 26.1025)."); return; }
    if (lat < -90 || lat > 90) { setCoordError("Latitudinea trebuie să fie între -90 și 90."); return; }
    if (lon < -180 || lon > 180) { setCoordError("Longitudinea trebuie să fie între -180 și 180."); return; }
    setCoordLoading(true);
    setCoordError("");
    setCoordResult(null);
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
      const res = await fetch(url, { headers: { "Accept-Language": "ro,en" } });
      const data = await res.json();
      if (data.error) { setCoordError("Coordonate invalide sau nicio locație găsită."); return; }
      setCoordResult({
        name: data.display_name.split(",").slice(0, 3).join(",").trim(),
        lat,
        lon,
        type: data.type ?? "location",
        country: data.address?.country,
        region: data.address?.state ?? data.address?.county ?? data.address?.city,
      });
    } catch {
      setCoordError("Eroare la geocodare inversă. Verifică conexiunea.");
    } finally {
      setCoordLoading(false);
    }
  };

  // ── MODE: IMAGE ────────────────────────────────────────────────────────
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) { setImageError("Fișierul trebuie să fie o imagine (JPG, PNG, WebP)."); return; }
    if (file.size > 10 * 1024 * 1024) { setImageError("Imaginea nu poate depăși 10 MB."); return; }
    setImageFile(file);
    setImageResult(null);
    setImageError("");
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  };

  const analyzeImage = async () => {
    if (!imageFile) return;
    setImageLoading(true);
    setImageError("");
    setImageResult(null);

    // Read EXIF GPS data from image
    try {
      const buffer = await imageFile.arrayBuffer();
      const view = new DataView(buffer);

      let noExif = false;

      // Check for JPEG SOI marker
      if (view.getUint16(0) !== 0xFFD8) {
        noExif = true;
      }

      if (!noExif) {
      let foundGPS = false;
      let offset = 2;

      while (offset < view.byteLength - 4) {
        const marker = view.getUint16(offset);
        const segLen = view.getUint16(offset + 2);

        if (marker === 0xFFE1) {
          // APP1 – EXIF
          const exifHeader = String.fromCharCode(
            view.getUint8(offset + 4), view.getUint8(offset + 5),
            view.getUint8(offset + 6), view.getUint8(offset + 7)
          );
          if (exifHeader === "Exif") {
            const tiffOffset = offset + 10;
            const byteOrder = view.getUint16(tiffOffset);
            const littleEndian = byteOrder === 0x4949;

            const ifdOffset = tiffOffset + view.getUint32(tiffOffset + 4, littleEndian);
            const numEntries = view.getUint16(ifdOffset, littleEndian);

            let gpsIfdOffset = -1;
            for (let i = 0; i < numEntries; i++) {
              const entryOffset = ifdOffset + 2 + i * 12;
              const tag = view.getUint16(entryOffset, littleEndian);
              if (tag === 0x8825) { // GPS IFD pointer
                gpsIfdOffset = tiffOffset + view.getUint32(entryOffset + 8, littleEndian);
                break;
              }
            }

            if (gpsIfdOffset > -1) {
              const gpsEntries = view.getUint16(gpsIfdOffset, littleEndian);
              let latDMS: number[] | null = null, lonDMS: number[] | null = null;
              let latRef = "N", lonRef = "E";

              for (let i = 0; i < gpsEntries; i++) {
                const e = gpsIfdOffset + 2 + i * 12;
                const tag = view.getUint16(e, littleEndian);
                const valOffset = tiffOffset + view.getUint32(e + 8, littleEndian);

                if (tag === 0x0001) latRef = String.fromCharCode(view.getUint8(e + 8));
                if (tag === 0x0003) lonRef = String.fromCharCode(view.getUint8(e + 8));
                if (tag === 0x0002) {
                  latDMS = [
                    view.getUint32(valOffset, littleEndian) / view.getUint32(valOffset + 4, littleEndian),
                    view.getUint32(valOffset + 8, littleEndian) / view.getUint32(valOffset + 12, littleEndian),
                    view.getUint32(valOffset + 16, littleEndian) / view.getUint32(valOffset + 20, littleEndian),
                  ];
                }
                if (tag === 0x0004) {
                  lonDMS = [
                    view.getUint32(valOffset, littleEndian) / view.getUint32(valOffset + 4, littleEndian),
                    view.getUint32(valOffset + 8, littleEndian) / view.getUint32(valOffset + 12, littleEndian),
                    view.getUint32(valOffset + 16, littleEndian) / view.getUint32(valOffset + 20, littleEndian),
                  ];
                }
              }

              if (latDMS && lonDMS) {
                const lat = (latDMS[0] + latDMS[1] / 60 + latDMS[2] / 3600) * (latRef === "S" ? -1 : 1);
                const lon = (lonDMS[0] + lonDMS[1] / 60 + lonDMS[2] / 3600) * (lonRef === "W" ? -1 : 1);

                // Reverse geocode the EXIF coords
                const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
                const resp = await fetch(url, { headers: { "Accept-Language": "ro,en" } });
                const geo = await resp.json();

                setImageResult({
                  name: geo.display_name?.split(",").slice(0, 3).join(",").trim() ?? `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
                  lat,
                  lon,
                  type: "photo location",
                  country: geo.address?.country,
                  region: geo.address?.state ?? geo.address?.county ?? geo.address?.city,
                });
                foundGPS = true;
              }
            }
          }
        }
        offset += 2 + segLen;
        if (marker === 0xFFDA) break; // SOS – end of metadata
      }

      if (!foundGPS) {
        noExif = true;
      }
      } // end if (!noExif)

      if (noExif) {
        setImageError(
          "Imaginea nu conține date GPS EXIF. Fotografiile făcute cu GPS activ pe telefon conțin de obicei aceste date. Poți activa locația în camera foto și reîncerca."
        );
      }

    } catch {
      setImageError("Eroare la procesarea imaginii. Încearcă alt fișier.");
    } finally {
      setImageLoading(false);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageResult(null);
    setImageError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleView = (r: GeoResult) => {
    onViewOnMap?.(r.lat, r.lon, r.name);
    onClose();
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[90vh] bg-gray-950 border-0 sm:border border-green-900/50 rounded-none sm:rounded-2xl shadow-2xl shadow-green-950/50 flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-green-900/30 bg-gray-950/90">
          <div className="flex items-center gap-3">
            <span className="text-green-400 text-xl">🔎</span>
            <div>
              <h2 className="text-green-300 font-mono font-bold text-sm tracking-widest uppercase">
                GeoSearch
              </h2>
              <p className="text-green-900 font-mono text-xs">Caută orice locație de pe glob</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-red-400 transition-colors text-xl font-mono"
            title="Închide (Esc)"
          >
            ✕
          </button>
        </div>

        {/* ── Mode tabs ── */}
        <div className="shrink-0 flex gap-1 sm:gap-2 px-3 sm:px-6 pt-3 sm:pt-4 pb-2 sm:pb-3 border-b border-green-900/20">
          <ModeTab mode="name"   active={mode} onClick={() => setMode("name")}   icon="🔤" label="Nume" />
          <ModeTab mode="coords" active={mode} onClick={() => setMode("coords")} icon="📡" label="Coordonate GPS" />
          <ModeTab mode="image"  active={mode} onClick={() => setMode("image")}  icon="📷" label="Imagine" />
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-5 space-y-4">

          {/* ══ NAME MODE ══ */}
          {mode === "name" && (
            <div className="space-y-4">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-green-700 text-base pointer-events-none">🔍</span>
                <input
                  autoFocus
                  type="text"
                  value={nameQuery}
                  onChange={(e) => setNameQuery(e.target.value)}
                  placeholder="ex: București, Munții Bucegi, Dunărea..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-900/80 border border-green-900/40 rounded-xl text-green-100 placeholder-green-900/60 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition"
                />
                {nameLoading && (
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-green-600 animate-spin text-sm">⟳</span>
                )}
              </div>

              {nameError && !nameLoading && (
                <p className="text-amber-600 text-xs font-mono px-1">⚠ {nameError}</p>
              )}

              {nameResults.length > 0 && (
                <div className="space-y-2">
                  <p className="text-green-800 font-mono text-xs uppercase tracking-widest px-1">
                    {nameResults.length} rezultate
                  </p>
                  {nameResults.map((r, i) => (
                    <ResultCard key={i} result={r} onView={handleView} />
                  ))}
                </div>
              )}

              {!nameQuery && (
                <div className="text-center py-8">
                  <p className="text-green-900 font-mono text-xs">Introdu un nume de locație pentru a căuta</p>
                  <p className="text-green-900/50 font-mono text-xs mt-1">orașe · munți · râuri · țări · regiuni</p>
                </div>
              )}
            </div>
          )}

          {/* ══ COORDS MODE ══ */}
          {mode === "coords" && (
            <div className="space-y-4">
              <p className="text-green-800 font-mono text-xs">
                Introdu coordonate zecimale (WGS84). Ex: lat <span className="text-green-600">44.4268</span>, lon <span className="text-green-600">26.1025</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-green-800 font-mono uppercase tracking-widest mb-1.5">
                    📐 Latitudine
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    value={coordLat}
                    onChange={(e) => setCoordLat(e.target.value)}
                    placeholder="-90 ... 90"
                    className="w-full px-3 py-2.5 bg-gray-900/80 border border-green-900/40 rounded-xl text-green-100 placeholder-green-900/50 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition"
                    onKeyDown={(e) => { if (e.key === "Enter") searchByCoords(); }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-green-800 font-mono uppercase tracking-widest mb-1.5">
                    📐 Longitudine
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    value={coordLon}
                    onChange={(e) => setCoordLon(e.target.value)}
                    placeholder="-180 ... 180"
                    className="w-full px-3 py-2.5 bg-gray-900/80 border border-green-900/40 rounded-xl text-green-100 placeholder-green-900/50 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition"
                    onKeyDown={(e) => { if (e.key === "Enter") searchByCoords(); }}
                  />
                </div>
              </div>

              {/* Quick presets */}
              <div>
                <p className="text-green-900 font-mono text-xs mb-2">Locații rapide:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: "București", lat: "44.4268", lon: "26.1025" },
                    { name: "Paris", lat: "48.8566", lon: "2.3522" },
                    { name: "Tokyo", lat: "35.6762", lon: "139.6503" },
                    { name: "New York", lat: "40.7128", lon: "-74.0060" },
                  ].map((p) => (
                    <button
                      key={p.name}
                      onClick={() => { setCoordLat(p.lat); setCoordLon(p.lon); setCoordResult(null); setCoordError(""); }}
                      className="text-xs px-2.5 py-1 rounded-lg border border-green-900/30 text-green-800 hover:text-green-500 hover:border-green-700/50 font-mono transition-all"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={searchByCoords}
                disabled={coordLoading || !coordLat || !coordLon}
                className="w-full py-2.5 rounded-xl border border-green-500/40 bg-green-500/10 hover:bg-green-500/20 hover:border-green-400 disabled:opacity-40 text-green-300 font-mono text-sm uppercase tracking-widest transition-all"
              >
                {coordLoading ? "⟳ Se caută..." : "→ Identifică Locația"}
              </button>

              {coordError && (
                <p className="text-red-400 text-xs font-mono">⚠ {coordError}</p>
              )}

              {coordResult && (
                <div className="space-y-2">
                  <p className="text-green-800 font-mono text-xs uppercase tracking-widest">Locație identificată</p>
                  <ResultCard result={coordResult} onView={handleView} />
                </div>
              )}
            </div>
          )}

          {/* ══ IMAGE MODE ══ */}
          {mode === "image" && (
            <div className="space-y-4">
              <div className="bg-gray-900/40 border border-green-900/20 rounded-xl p-3 text-xs font-mono text-green-800 space-y-1">
                <p className="text-green-600 font-semibold">ℹ Cum funcționează:</p>
                <p>Încarcă o fotografie care conține date <span className="text-green-500">GPS EXIF</span> (de obicei fotografii făcute cu telefonul când locația era activată). Aplicația extrage coordonatele și identifică locația pe hartă.</p>
              </div>

              {!imagePreview ? (
                <div
                  ref={dropRef}
                  onDrop={handleFileDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={(e) => { e.preventDefault(); dropRef.current?.classList.add("border-green-500"); }}
                  onDragLeave={() => dropRef.current?.classList.remove("border-green-500")}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 py-12 border-2 border-dashed border-green-900/40 rounded-xl cursor-pointer hover:border-green-700/60 hover:bg-green-950/20 transition-all"
                >
                  <span className="text-4xl">📷</span>
                  <p className="text-green-600 font-mono text-sm">Trage o imagine aici sau apasă pentru a selecta</p>
                  <p className="text-green-900 font-mono text-xs">JPG · PNG · WebP · max 10 MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Image preview */}
                  <div className="relative rounded-xl overflow-hidden border border-green-900/30 bg-gray-900">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full max-h-56 object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-gray-950/80 to-transparent pointer-events-none" />
                    <button
                      onClick={clearImage}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-gray-950/80 border border-gray-700 text-gray-400 hover:text-red-400 hover:border-red-700/60 transition-all flex items-center justify-center text-xs"
                    >
                      ✕
                    </button>
                    <div className="absolute bottom-2 left-3">
                      <p className="text-green-300 font-mono text-xs">{imageFile?.name}</p>
                      <p className="text-green-800 font-mono text-xs">{imageFile ? (imageFile.size / 1024).toFixed(0) + " KB" : ""}</p>
                    </div>
                  </div>

                  <button
                    onClick={analyzeImage}
                    disabled={imageLoading}
                    className="w-full py-2.5 rounded-xl border border-green-500/40 bg-green-500/10 hover:bg-green-500/20 hover:border-green-400 disabled:opacity-40 text-green-300 font-mono text-sm uppercase tracking-widest transition-all"
                  >
                    {imageLoading ? "⟳ Se analizează..." : "→ Extrage Locația din Imagine"}
                  </button>
                </div>
              )}

              {imageError && (
                <div className="p-3 rounded-xl border border-amber-900/40 bg-amber-950/20 text-amber-500 text-xs font-mono">
                  ⚠ {imageError}
                </div>
              )}

              {imageResult && (
                <div className="space-y-2">
                  <p className="text-green-800 font-mono text-xs uppercase tracking-widest">📍 Locație extrasă din EXIF</p>
                  <ResultCard result={imageResult} onView={handleView} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 px-6 py-3 border-t border-green-900/20 flex items-center justify-between">
          <span className="text-green-900 font-mono text-xs">
            {mode === "name" ? "Powered by Nominatim · OpenStreetMap" :
             mode === "coords" ? "Geocodare inversă · WGS84" :
             "EXIF GPS Extractor · Local"}
          </span>
          <span className="text-green-900 font-mono text-xs">ESC pentru a închide</span>
        </div>
      </div>
    </div>
  );
}



