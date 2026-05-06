import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { turismApi, weatherApi, type TourismEvent, type TourismPlace, type WeatherData } from "~/lib/api";

interface InteractiveMapProps {
  onClose: () => void;
  flyTo?: { lat: number; lon: number; name: string };
}

interface LocationInfo {
  lat: number;
  lng: number;
  locationName: string | null;
  timeStr: string | null;
  dateStr: string | null;
  tzName: string | null;
  loading: boolean;
  weather: WeatherData | null;
  weatherLoading: boolean;
  weatherError: string | null;
  events: TourismEvent[];
  eventsLoading: boolean;
  eventsError: string | null;
  eventsSearchNote: string | null;
  places: TourismPlace[];
  placesLoading: boolean;
  placesError: string | null;
}

function placeSearchMarker(L: any, map: any, target: { lat: number; lon: number; name: string }) {
  const icon = L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;background:#196b46;border:2px solid #86efac;border-radius:50%;box-shadow:0 0 8px #196b46,0 0 18px #196b4666;"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -12],
  });

  const shortName = target.name.split(",").slice(0, 2).join(",").trim();
  return L.marker([target.lat, target.lon], { icon })
    .addTo(map)
    .bindPopup(
      `<div style="background:#fff;color:#1a1a1a;border:1px solid #196b46;border-radius:8px;padding:10px 14px;font-family:monospace;font-size:12px;min-width:180px;">
        <strong style="font-size:13px;color:#196b46;">${shortName}</strong><br/>
        <span style="color:#6b7280;font-size:11px;">
          ${target.lat >= 0 ? target.lat.toFixed(4) + "°N" : Math.abs(target.lat).toFixed(4) + "°S"}
          &nbsp;·&nbsp;
          ${target.lon >= 0 ? target.lon.toFixed(4) + "°E" : Math.abs(target.lon).toFixed(4) + "°W"}
        </span>
      </div>`,
      { className: "geo-popup", maxWidth: 280 }
    )
    .openPopup();
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-stone-200 rounded ${className}`} />;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-stone-100 last:border-0">
      <span className="text-stone-500 text-xs">{label}</span>
      <span className="text-stone-800 text-xs font-mono font-medium">{value}</span>
    </div>
  );
}

function SectionHeader({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-base">{icon}</span>
      <span className="text-stone-500 font-mono text-[10px] uppercase tracking-widest">{label}</span>
    </div>
  );
}

export default function InteractiveMap({ onClose, flyTo }: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const searchMarkerRef = useRef<any>(null);
  const clickMarkerRef = useRef<any>(null);

  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [panelTab, setPanelTab] = useState<"overview" | "events" | "places">("overview");

  const flyToRef = useRef(flyTo);
  flyToRef.current = flyTo;

  const loadLocationInfo = async (lat: number, lng: number) => {
    const getApiErrorMessage = (reason: unknown, fallback: string) => {
      if (reason && typeof reason === "object" && "response" in reason) {
        return (reason as any).response?.data?.error ?? fallback;
      }
      return fallback;
    };

    setPanelTab("overview");
    setLocationInfo({
      lat, lng,
      locationName: null, timeStr: null, dateStr: null, tzName: null,
      loading: true,
      weather: null, weatherLoading: true, weatherError: null,
      events: [], eventsLoading: true, eventsError: null, eventsSearchNote: null,
      places: [], placesLoading: true, placesError: null,
    });

    const [geoResult, timeResult, weatherResult, placesResult] = await Promise.allSettled([
      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat.toFixed(6)}&lon=${lng.toFixed(6)}&format=json&accept-language=ro`,
        { headers: { "Accept-Language": "ro" } }
      ).then((r) => r.json()),
      fetch(
        `https://timeapi.io/api/time/current/coordinate?latitude=${lat.toFixed(6)}&longitude=${lng.toFixed(6)}`
      ).then((r) => r.json()),
      weatherApi.getWeather(lat, lng),
      turismApi.getPlaces(lat, lng, 3000, 6),
    ]);

    let locationName: string | null = null;
    if (geoResult.status === "fulfilled") {
      const addr = geoResult.value?.address ?? {};
      const parts = [
        addr.city || addr.town || addr.village || addr.hamlet || addr.county,
        addr.state || addr.region,
        addr.country,
      ].filter(Boolean);
      locationName = parts.length > 0 ? parts.join(", ") : (geoResult.value?.display_name ?? null);
    }

    const geoAddress = geoResult.status === "fulfilled" ? (geoResult.value?.address ?? {}) : {};
    const cityCandidate: string | null = geoAddress.city || geoAddress.town || geoAddress.village || geoAddress.county || null;

    let timeStr: string | null = null;
    let dateStr: string | null = null;
    let tzName: string | null = null;
    if (timeResult.status === "fulfilled") {
      const td = timeResult.value;
      timeStr = td.time ?? null;
      dateStr = td.dayOfWeek && td.date ? `${td.dayOfWeek}, ${td.date}` : null;
      tzName = td.timeZone ?? null;
    }
    if (!timeStr) {
      const offsetHours = Math.round(lng / 15);
      const now = new Date();
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
      const localTime = new Date(utcMs + offsetHours * 3600000);
      timeStr = localTime.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      dateStr = localTime.toLocaleDateString("ro-RO", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      tzName = `UTC${offsetHours >= 0 ? "+" : ""}${offsetHours}`;
    }

    let weather: WeatherData | null = null;
    let weatherError: string | null = null;
    if (weatherResult.status === "fulfilled") weather = weatherResult.value;
    else weatherError = "Date meteo indisponibile";

    const fetchEventsWithFallback = async () => {
      for (const radius of [30, 100, 250, 500]) {
        try {
          const found = await turismApi.getEvents(lat, lng, radius, 6);
          if (found.length > 0) return { events: found, error: null, note: radius > 30 ? `Raza extinsă: ${radius} km` : null };
        } catch (error) {
          return { events: [], error: getApiErrorMessage(error, "Evenimente indisponibile"), note: null };
        }
      }
      if (cityCandidate) {
        try {
          const cityEvents = await turismApi.getEvents(undefined, undefined, 100, 6, undefined, cityCandidate);
          if (cityEvents.length > 0) return { events: cityEvents, error: null, note: `Rezultate din: ${cityCandidate}` };
        } catch {}
      }
      return { events: [], error: null, note: "Nu s-au găsit evenimente în apropiere." };
    };

    const eventsResult = await fetchEventsWithFallback();

    let places: TourismPlace[] = [];
    let placesError: string | null = null;
    if (placesResult.status === "fulfilled") places = placesResult.value;
    else placesError = getApiErrorMessage(placesResult.reason, "Locuri indisponibile");

    setLocationInfo({
      lat, lng, locationName, timeStr, dateStr, tzName,
      loading: false,
      weather, weatherLoading: false, weatherError,
      events: eventsResult.events, eventsLoading: false, eventsError: eventsResult.error, eventsSearchNote: eventsResult.note,
      places, placesLoading: false, placesError,
    });
  };

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current || mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const initFlyTo = flyToRef.current;
      const map = L.map(mapContainerRef.current!, {
        center: initFlyTo ? [initFlyTo.lat, initFlyTo.lon] : [20, 0],
        zoom: initFlyTo ? 13 : 2,
        minZoom: 2,
        maxZoom: 18,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map);

      const cities: [number, number, string, string][] = [
        [44.4268, 26.1025, "București", "🇷🇴 România"],
        [48.8566, 2.3522, "Paris", "🇫🇷 Franța"],
        [51.5074, -0.1278, "Londra", "🇬🇧 Marea Britanie"],
        [40.7128, -74.006, "New York", "🇺🇸 SUA"],
        [35.6762, 139.6503, "Tokyo", "🇯🇵 Japonia"],
        [-33.8688, 151.2093, "Sydney", "🇦🇺 Australia"],
        [-23.5505, -46.6333, "São Paulo", "🇧🇷 Brazilia"],
        [28.6139, 77.209, "New Delhi", "🇮🇳 India"],
        [55.7558, 37.6173, "Moscova", "🇷🇺 Rusia"],
        [39.9042, 116.4074, "Beijing", "🇨🇳 China"],
        [-34.6037, -58.3816, "Buenos Aires", "🇦🇷 Argentina"],
        [1.3521, 103.8198, "Singapore", "🇸🇬 Singapore"],
        [30.0444, 31.2357, "Cairo", "🇪🇬 Egipt"],
        [-1.2921, 36.8219, "Nairobi", "🇰🇪 Kenya"],
        [19.4326, -99.1332, "Mexico City", "🇲🇽 Mexic"],
      ];

      const cityIcon = L.divIcon({
        className: "",
        html: `<div style="width:8px;height:8px;background:#196b46;border:1.5px solid #4ade80;border-radius:50%;box-shadow:0 0 5px #196b46;"></div>`,
        iconSize: [8, 8],
        iconAnchor: [4, 4],
        popupAnchor: [0, -8],
      });

      cities.forEach(([lat, lng, name, country]) => {
        L.marker([lat, lng], { icon: cityIcon })
          .addTo(map)
          .bindPopup(
            `<div style="background:#fff;color:#111;border:1px solid #196b46;border-radius:8px;padding:8px 12px;font-family:monospace;font-size:12px;min-width:140px;">
              <strong style="color:#196b46;">${name}</strong><br/>
              <span style="color:#6b7280;font-size:11px;">${country}</span>
            </div>`,
            { className: "geo-popup", maxWidth: 220 }
          );
      });

      if (initFlyTo) {
        searchMarkerRef.current = placeSearchMarker(L, map, initFlyTo);
        void loadLocationInfo(initFlyTo.lat, initFlyTo.lon);
      }

      const clickIcon = L.divIcon({
        className: "",
        html: `<div style="width:12px;height:12px;background:#f59e0b;border:2px solid #fcd34d;border-radius:50%;box-shadow:0 0 8px #f59e0b66;"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        if (clickMarkerRef.current) { clickMarkerRef.current.remove(); clickMarkerRef.current = null; }
        clickMarkerRef.current = L.marker([lat, lng], { icon: clickIcon }).addTo(map);
        void loadLocationInfo(lat, lng);
      });

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (!flyTo || !mapInstanceRef.current) return;
    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      if (searchMarkerRef.current) { searchMarkerRef.current.remove(); searchMarkerRef.current = null; }
      map.flyTo([flyTo.lat, flyTo.lon], 13, { duration: 1.5 });
      void loadLocationInfo(flyTo.lat, flyTo.lon);
      setTimeout(() => {
        if (!mapInstanceRef.current) return;
        searchMarkerRef.current = placeSearchMarker(L, map, flyTo);
      }, 1600);
    });
  }, [flyTo]);

  const latLabel = locationInfo
    ? locationInfo.lat >= 0 ? `${locationInfo.lat.toFixed(5)}°N` : `${Math.abs(locationInfo.lat).toFixed(5)}°S`
    : "";
  const lngLabel = locationInfo
    ? locationInfo.lng >= 0 ? `${locationInfo.lng.toFixed(5)}°E` : `${Math.abs(locationInfo.lng).toFixed(5)}°W`
    : "";

  return (
    <>
      <style>{`
        .geo-popup .leaflet-popup-content-wrapper { background:transparent!important;border:none!important;box-shadow:none!important;padding:0!important; }
        .geo-popup .leaflet-popup-content { margin:0!important; }
        .geo-popup .leaflet-popup-tip-container { display:none!important; }
        .leaflet-control-attribution { background:rgba(255,255,255,0.9)!important;color:#6b7280!important;font-size:9px!important; }
        .leaflet-control-attribution a { color:#196b46!important; }
        .leaflet-control-zoom a { background:#fff!important;color:#196b46!important;border-color:#d1d5db!important; }
        .leaflet-control-zoom a:hover { background:#f0fdf4!important;color:#15803d!important; }
        @keyframes slideInRight { from { opacity:0; transform:translateX(16px); } to { opacity:1; transform:translateX(0); } }
        .side-panel { animation: slideInRight 0.2s ease; }
      `}</style>

      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="relative w-full h-full sm:max-w-7xl sm:h-[88vh] bg-stone-100 rounded-none sm:rounded-2xl border-0 sm:border border-stone-200 overflow-hidden shadow-2xl flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-stone-200 bg-white z-10 shrink-0">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <div>
                <h2 className="text-stone-800 font-mono font-bold text-xs tracking-widest uppercase">Hartă Interactivă</h2>
                <p className="text-stone-400 font-mono text-[10px] hidden sm:block">Proiecție Mercator · WGS84 · Leaflet OSM</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4 font-mono text-xs">
              <span className="text-stone-400">Click pe hartă pentru detalii</span>
              <span className="text-emerald-700 border border-emerald-200 rounded px-2 py-1 text-[10px] bg-emerald-50">
                15 orașe marcate
              </span>
            </div>

            <button
              onClick={onClose}
              className="text-stone-400 hover:text-red-500 transition-colors text-lg leading-none font-mono ml-4"
            >
              ✕
            </button>
          </div>

          {/* Map + side panel */}
          <div className="relative flex-1 overflow-hidden flex">

            {/* Map */}
            <div ref={mapContainerRef} className="flex-1 h-full" />

            {/* Side panel */}
            {locationInfo && (
              <div
                key={`${locationInfo.lat}-${locationInfo.lng}`}
                className="side-panel absolute right-0 top-0 h-full w-full sm:w-[360px] bg-white border-l border-stone-200 flex flex-col z-[1000] shadow-xl overflow-hidden"
              >
                {/* Panel header */}
                <div className="px-4 py-4 border-b border-stone-100 shrink-0 bg-stone-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-stone-400 text-base">📍</span>
                        {locationInfo.loading || !locationInfo.locationName ? (
                          <Skeleton className="h-4 w-40" />
                        ) : (
                          <h3 className="text-stone-900 font-mono font-semibold text-sm leading-snug truncate">
                            {locationInfo.locationName}
                          </h3>
                        )}
                      </div>
                      <p className="text-stone-400 font-mono text-[10px] pl-7">
                        {latLabel} &nbsp;·&nbsp; {lngLabel}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setLocationInfo(null);
                        if (clickMarkerRef.current) { clickMarkerRef.current.remove(); clickMarkerRef.current = null; }
                      }}
                      className="text-stone-300 hover:text-red-500 transition-colors text-base font-mono ml-3 shrink-0"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-1 mt-3">
                    {(["overview", "events", "places"] as const).map((tab) => {
                      const labels = {
                        overview: "Detalii",
                        events: `Evenimente${locationInfo.events.length > 0 ? ` (${locationInfo.events.length})` : ""}`,
                        places: `Locuri${locationInfo.places.length > 0 ? ` (${locationInfo.places.length})` : ""}`,
                      };
                      return (
                        <button
                          key={tab}
                          onClick={() => setPanelTab(tab)}
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all ${
                            panelTab === tab
                              ? "bg-emerald-600 text-white"
                              : "text-stone-500 hover:text-stone-700 hover:bg-stone-100"
                          }`}
                        >
                          {labels[tab]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Panel content */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

                  {/* ── OVERVIEW TAB ── */}
                  {panelTab === "overview" && (
                    <>
                      {/* Coordinates */}
                      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                        <SectionHeader icon="📐" label="Coordonate" />
                        <InfoRow label="Latitudine" value={latLabel} />
                        <InfoRow label="Longitudine" value={lngLabel} />
                      </div>

                      {/* Local time */}
                      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                        <SectionHeader icon="🕐" label="Ora locală" />
                        {locationInfo.loading || !locationInfo.timeStr ? (
                          <div className="space-y-2">
                            <Skeleton className="h-8 w-28" />
                            <Skeleton className="h-3 w-44" />
                          </div>
                        ) : (
                          <>
                            <div className="text-stone-900 text-3xl font-mono font-bold tracking-wider">
                              {locationInfo.timeStr}
                            </div>
                            <div className="text-stone-600 text-xs mt-1">{locationInfo.dateStr}</div>
                            <div className="text-stone-400 text-[10px] mt-1 font-mono">{locationInfo.tzName}</div>
                          </>
                        )}
                      </div>

                      {/* Weather */}
                      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                        <SectionHeader icon="🌤" label="Vreme actuală" />
                        {locationInfo.weatherLoading ? (
                          <div className="space-y-2">
                            <Skeleton className="h-10 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        ) : locationInfo.weatherError ? (
                          <p className="text-red-600 text-xs">{locationInfo.weatherError}</p>
                        ) : locationInfo.weather ? (
                          <>
                            <div className="flex items-end gap-2 mb-2">
                              <span className="text-stone-900 text-4xl font-bold font-mono">
                                {Math.round(locationInfo.weather.temperature)}°C
                              </span>
                              <span className="text-stone-500 text-sm pb-1">
                                resimțit {Math.round(locationInfo.weather.feelsLike)}°C
                              </span>
                            </div>
                            <div className="text-emerald-700 text-sm font-semibold mb-1">{locationInfo.weather.conditions}</div>
                            {locationInfo.weather.description && (
                              <div className="text-stone-500 text-[11px] leading-snug mb-3">{locationInfo.weather.description}</div>
                            )}
                            <div className="flex gap-4 text-xs font-mono mb-4 text-stone-600">
                              <span>↑ {Math.round(locationInfo.weather.tempMax)}°C</span>
                              <span>↓ {Math.round(locationInfo.weather.tempMin)}°C</span>
                            </div>
                            <div className="border-t border-stone-100 pt-3 space-y-0">
                              <InfoRow label="Umiditate" value={`${locationInfo.weather.humidity}%`} />
                              <InfoRow label="Vânt" value={`${Math.round(locationInfo.weather.windSpeed)} km/h ${locationInfo.weather.windDirectionLabel}`} />
                              <InfoRow label="Precipitații" value={`${locationInfo.weather.precipProbability}%`} />
                              <InfoRow label="Nori" value={`${locationInfo.weather.cloudCover}%`} />
                              <InfoRow label="Vizibilitate" value={`${locationInfo.weather.visibility} km`} />
                              <InfoRow label="Presiune" value={`${Math.round(locationInfo.weather.pressure)} hPa`} />
                              <InfoRow label="UV Index" value={`${locationInfo.weather.uvIndex}`} />
                              <InfoRow label="Punct de rouă" value={`${Math.round(locationInfo.weather.dewPoint)}°C`} />
                              <InfoRow label="Răsărit" value={locationInfo.weather.sunrise?.slice(0, 5) ?? "—"} />
                              <InfoRow label="Apus" value={locationInfo.weather.sunset?.slice(0, 5) ?? "—"} />
                            </div>
                          </>
                        ) : null}
                      </div>
                    </>
                  )}

                  {/* ── EVENTS TAB ── */}
                  {panelTab === "events" && (
                    <div className="space-y-3">
                      {locationInfo.eventsLoading ? (
                        [1, 2, 3].map((i) => (
                          <div key={i} className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                            <Skeleton className="h-3 w-1/3" />
                          </div>
                        ))
                      ) : locationInfo.eventsError ? (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                          <p className="text-red-600 text-xs">{locationInfo.eventsError}</p>
                        </div>
                      ) : locationInfo.events.length === 0 ? (
                        <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 text-center">
                          <p className="text-stone-400 text-xs font-mono">{locationInfo.eventsSearchNote ?? "Nu s-au găsit evenimente."}</p>
                        </div>
                      ) : (
                        <>
                          {locationInfo.eventsSearchNote && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                              <p className="text-amber-700 text-[10px] font-mono">{locationInfo.eventsSearchNote}</p>
                            </div>
                          )}
                          {locationInfo.events.map((event) => (
                            <div key={event.id} className="bg-stone-50 border border-stone-200 rounded-xl p-4 hover:border-emerald-300 hover:bg-emerald-50/30 transition-colors">
                              <div className="text-stone-900 text-sm font-semibold leading-snug mb-2">{event.name}</div>
                              <div className="space-y-1">
                                {event.city && <div className="text-stone-600 text-[11px] font-mono">{event.city}</div>}
                                {event.venue && <div className="text-stone-500 text-[11px]">{event.venue}</div>}
                                <div className="text-emerald-700 text-[11px] font-mono">
                                  {event.date ?? "Data necunoscută"}
                                  {event.time ? ` · ${event.time.slice(0, 5)}` : ""}
                                </div>
                              </div>
                              {event.url && (
                                <a
                                  href={event.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-block mt-3 text-[10px] font-mono uppercase tracking-wider border border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white px-3 py-1 rounded-lg transition-all"
                                >
                                  Vezi evenimentul →
                                </a>
                              )}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}

                  {/* ── PLACES TAB ── */}
                  {panelTab === "places" && (
                    <div className="space-y-3">
                      {locationInfo.placesLoading ? (
                        [1, 2, 3].map((i) => (
                          <div key={i} className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        ))
                      ) : locationInfo.placesError ? (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                          <p className="text-red-600 text-xs">{locationInfo.placesError}</p>
                        </div>
                      ) : locationInfo.places.length === 0 ? (
                        <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 text-center">
                          <p className="text-stone-400 text-xs font-mono">Nu s-au găsit locuri turistice.</p>
                        </div>
                      ) : (
                        locationInfo.places.map((place) => (
                          <div key={place.id} className="bg-stone-50 border border-stone-200 rounded-xl p-4 hover:border-emerald-300 hover:bg-emerald-50/30 transition-colors">
                            <div className="text-stone-900 text-sm font-semibold leading-snug mb-1">{place.name}</div>
                            {place.address && <div className="text-stone-500 text-[11px] mb-2">{place.address}</div>}
                            {place.rating && (
                              <div className="text-amber-600 text-[11px] font-mono mb-2">
                                ★ {place.rating}
                                {place.userRatingsTotal ? <span className="text-stone-400"> ({place.userRatingsTotal} recenzii)</span> : null}
                              </div>
                            )}
                            {place.types && place.types.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {place.types.slice(0, 3).map((t) => (
                                  <span key={t} className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-200 text-stone-600">
                                    {t.replace(/_/g, " ")}
                                  </span>
                                ))}
                              </div>
                            )}
                            {place.googleMapsUrl && (
                              <a
                                href={place.googleMapsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block text-[10px] font-mono uppercase tracking-wider border border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white px-3 py-1 rounded-lg transition-all"
                              >
                                Google Maps →
                              </a>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 px-5 py-2 border-t border-stone-200 bg-white flex items-center justify-between font-mono text-[10px] text-stone-400">
            <span>© OpenStreetMap contributors · © CARTO</span>
            <span className="hidden sm:inline">ESC sau click în afară pentru a închide</span>
          </div>
        </div>
      </div>
    </>
  );
}
