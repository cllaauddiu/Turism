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

// ── Helper – creates the search result marker ─────────────────────────────
function placeSearchMarker(L: any, map: any, target: { lat: number; lon: number; name: string }) {
  const icon = L.divIcon({
    className: "",
    html: `<div style="
      width:14px;height:14px;
      background:#196b46;
      border:2px solid #86efac;
      border-radius:50%;
      box-shadow:0 0 8px #196b46, 0 0 18px #196b4666;
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -12],
  });

  const shortName = target.name.split(",").slice(0, 2).join(",").trim();

  return L.marker([target.lat, target.lon], { icon })
    .addTo(map)
    .bindPopup(
      `<div style="
        background:#fbf6ec;
        color:#196b46;
        border:1px solid #196b46;
        border-radius:8px;
        padding:10px 14px;
        font-family:monospace;
        font-size:12px;
        min-width:180px;
      ">
        <strong style="font-size:14px;color:#86efac;">${shortName}</strong><br/>
        <span style="color:#6b7280;font-size:11px;">
          ${target.lat >= 0 ? target.lat.toFixed(4) + "°N" : Math.abs(target.lat).toFixed(4) + "°S"}
          &nbsp;&middot;&nbsp;
          ${target.lon >= 0 ? target.lon.toFixed(4) + "°E" : Math.abs(target.lon).toFixed(4) + "°W"}
        </span>
      </div>`,
      { className: "geo-popup", maxWidth: 280 }
    )
    .openPopup();
}

export default function InteractiveMap({ onClose, flyTo }: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const searchMarkerRef = useRef<any>(null);
  const clickMarkerRef = useRef<any>(null);

  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);

  const flyToRef = useRef(flyTo);
  flyToRef.current = flyTo;

  const loadLocationInfo = async (lat: number, lng: number) => {
    const getApiErrorMessage = (reason: unknown, fallback: string) => {
      if (
        reason &&
        typeof reason === "object" &&
        "response" in reason &&
        (reason as { response?: { data?: { error?: string } } }).response?.data?.error
      ) {
        return (reason as { response?: { data?: { error?: string } } }).response?.data?.error ?? fallback;
      }
      return fallback;
    };

    setLocationInfo({
      lat,
      lng,
      locationName: null,
      timeStr: null,
      dateStr: null,
      tzName: null,
      loading: true,
      weather: null,
      weatherLoading: true,
      weatherError: null,
      events: [],
      eventsLoading: true,
      eventsError: null,
      eventsSearchNote: null,
      places: [],
      placesLoading: true,
      placesError: null,
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
      const geo = geoResult.value;
      const addr = geo.address ?? {};
      const parts = [
        addr.city || addr.town || addr.village || addr.hamlet || addr.county,
        addr.state || addr.region,
        addr.country,
      ].filter(Boolean);
      locationName = parts.length > 0 ? parts.join(", ") : (geo.display_name ?? null);
    }

    const geoAddress = geoResult.status === "fulfilled" ? (geoResult.value?.address ?? {}) : {};
    const cityCandidate: string | null = geoAddress.city
      || geoAddress.town
      || geoAddress.village
      || geoAddress.county
      || null;

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
      tzName = `UTC${offsetHours >= 0 ? "+" : ""}${offsetHours} (aproximativ)`;
    }

    let weather: WeatherData | null = null;
    let weatherError: string | null = null;
    if (weatherResult.status === "fulfilled") {
      weather = weatherResult.value;
    } else {
      weatherError = "Date meteo indisponibile";
    }

    const fetchEventsWithFallback = async () => {
      const radiusSteps = [30, 100, 250, 500];
      let lastError: string | null = null;

      for (const radius of radiusSteps) {
        try {
          const found = await turismApi.getEvents(lat, lng, radius, 6);
          if (found.length > 0) {
            return {
              events: found,
              error: null,
              note: radius > 30 ? `Raza extinsa: ${radius} km` : null,
            };
          }
        } catch (error) {
          lastError = getApiErrorMessage(error, "Evenimente turistice indisponibile");
          break;
        }
      }

      if (cityCandidate) {
        try {
          const cityEvents = await turismApi.getEvents(undefined, undefined, 100, 6, undefined, cityCandidate);
          if (cityEvents.length > 0) {
            return {
              events: cityEvents,
              error: null,
              note: `Rezultate din oras: ${cityCandidate}`,
            };
          }
          return {
            events: [],
            error: lastError,
            note: `Nu sunt evenimente in apropiere. Incearca un oras mare.`,
          };
        } catch (error) {
          return {
            events: [],
            error: getApiErrorMessage(error, "Evenimente turistice indisponibile"),
            note: null,
          };
        }
      }

      return {
        events: [],
        error: lastError,
        note: "Nu sunt evenimente in apropiere. Incearca un oras mare.",
      };
    };

    const eventsResult = await fetchEventsWithFallback();
    const events = eventsResult.events;
    const eventsError = eventsResult.error;
    const eventsSearchNote = eventsResult.note;

    let places: TourismPlace[] = [];
    let placesError: string | null = null;
    if (placesResult.status === "fulfilled") {
      places = placesResult.value;
    } else {
      placesError = getApiErrorMessage(placesResult.reason, "Locuri turistice indisponibile");
    }

    setLocationInfo({
      lat,
      lng,
      locationName,
      timeStr,
      dateStr,
      tzName,
      loading: false,
      weather,
      weatherLoading: false,
      weatherError,
      events,
      eventsLoading: false,
      eventsError,
      eventsSearchNote,
      places,
      placesLoading: false,
      placesError,
    });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

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

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20,
        }
      ).addTo(map);

      // ── Notable cities markers ──────────────────────────────────────
      const cities: [number, number, string, string][] = [
        [44.4268, 26.1025, "București", "🇷🇴 România · 44°25'N 26°06'E"],
        [48.8566, 2.3522, "Paris", "🇫🇷 Franța · 48°51'N 02°21'E"],
        [51.5074, -0.1278, "Londra", "🇬🇧 Marea Britanie · 51°30'N 00°07'W"],
        [40.7128, -74.006, "New York", "🇺🇸 SUA · 40°42'N 74°00'W"],
        [35.6762, 139.6503, "Tokyo", "🇯🇵 Japonia · 35°41'N 139°41'E"],
        [-33.8688, 151.2093, "Sydney", "🇦🇺 Australia · 33°51'S 151°12'E"],
        [-23.5505, -46.6333, "São Paulo", "🇧🇷 Brazilia · 23°32'S 46°38'W"],
        [28.6139, 77.209, "New Delhi", "🇮🇳 India · 28°36'N 77°12'E"],
        [55.7558, 37.6173, "Moscova", "🇷🇺 Rusia · 55°45'N 37°37'E"],
        [39.9042, 116.4074, "Beijing", "🇨🇳 China · 39°54'N 116°24'E"],
        [-34.6037, -58.3816, "Buenos Aires", "🇦🇷 Argentina · 34°36'S 58°22'W"],
        [1.3521, 103.8198, "Singapore", "🇸🇬 Singapore · 01°21'N 103°49'E"],
        [30.0444, 31.2357, "Cairo", "🇪🇬 Egipt · 30°02'N 31°14'E"],
        [-1.2921, 36.8219, "Nairobi", "🇰🇪 Kenya · 01°17'S 36°49'E"],
        [19.4326, -99.1332, "Mexico City", "🇲🇽 Mexic · 19°25'N 99°07'W"],
      ];

      const customIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:10px;height:10px;
          background:#196b46;
          border:2px solid #196b46;
          border-radius:50%;
          box-shadow:0 0 6px #196b46, 0 0 12px #196b4666;
        "></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
        popupAnchor: [0, -10],
      });

      cities.forEach(([lat, lng, name, desc]) => {
        L.marker([lat, lng], { icon: customIcon })
          .addTo(map)
          .bindPopup(
            `<div style="
              background:#fbf6ec;
              color:#196b46;
              border:1px solid #196b46;
              border-radius:8px;
              padding:10px 14px;
              font-family:monospace;
              font-size:12px;
              min-width:180px;
            ">
              <strong style="font-size:14px;color:#86efac;">${name}</strong><br/>
              <span style="color:#6b7280;font-size:11px;">${desc}</span>
            </div>`,
            { className: "geo-popup", maxWidth: 250 }
          );
      });

      if (initFlyTo) {
        searchMarkerRef.current = placeSearchMarker(L, map, initFlyTo);
        void loadLocationInfo(initFlyTo.lat, initFlyTo.lon);
      }

      // ── Click on map → side panel ───────────────────────────────────
      const clickIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:12px;height:12px;
          background:#facc15;
          border:2px solid #fde68a;
          border-radius:50%;
          box-shadow:0 0 8px #facc15, 0 0 18px #facc1566;
        "></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;

        // Remove previous click marker
        if (clickMarkerRef.current) {
          clickMarkerRef.current.remove();
          clickMarkerRef.current = null;
        }

        // Place marker
        clickMarkerRef.current = L.marker([lat, lng], { icon: clickIcon }).addTo(map);

        void loadLocationInfo(lat, lng);
      });

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Fly to search result when flyTo prop changes after mount
  useEffect(() => {
    if (!flyTo || !mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;

      if (searchMarkerRef.current) {
        searchMarkerRef.current.remove();
        searchMarkerRef.current = null;
      }

      map.flyTo([flyTo.lat, flyTo.lon], 13, { duration: 1.5 });
      void loadLocationInfo(flyTo.lat, flyTo.lon);
      setTimeout(() => {
        if (!mapInstanceRef.current) return;
        searchMarkerRef.current = placeSearchMarker(L, map, flyTo);
      }, 1600);
    });
  }, [flyTo]);

  const latLabel = locationInfo
    ? locationInfo.lat >= 0
      ? locationInfo.lat.toFixed(6) + "°N"
      : Math.abs(locationInfo.lat).toFixed(6) + "°S"
    : "";
  const lngLabel = locationInfo
    ? locationInfo.lng >= 0
      ? locationInfo.lng.toFixed(6) + "°E"
      : Math.abs(locationInfo.lng).toFixed(6) + "°W"
    : "";

  return (
    <>
      <style>{`
        .geo-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .geo-popup .leaflet-popup-content { margin: 0 !important; }
        .geo-popup .leaflet-popup-tip-container { display: none !important; }
        .leaflet-control-attribution {
          background: rgba(251,246,236,0.85) !important;
          color: #244438 !important;
          font-size: 9px !important;
        }
        .leaflet-control-attribution a { color: #3d6655 !important; }
        .leaflet-control-zoom a {
          background: #fbf6ec !important;
          color: #196b46 !important;
          border-color: #196b46 !important;
        }
        .leaflet-control-zoom a:hover {
          background: #ece5d6 !important;
          color: #86efac !important;
        }
        @keyframes slideInPanel {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .location-panel { animation: slideInPanel 0.25s ease; }
      `}</style>

      {/* Modal backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
        style={{ background: "rgba(40,30,10,0.45)" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* Modal container */}
        <div className="relative w-full h-full sm:max-w-6xl sm:h-[85vh] bg-stone-100 rounded-none sm:rounded-2xl border-0 sm:border border-emerald-200/50 overflow-hidden shadow-2xl shadow-emerald-100/50 flex flex-col">

          {/* Modal header */}
          <div className="flex items-center justify-between px-3 sm:px-5 py-2 sm:py-3 border-b border-emerald-200/40 bg-stone-100/90 backdrop-blur z-10 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
              <div className="min-w-0">
                <h2 className="text-emerald-800 font-mono font-bold text-xs sm:text-sm tracking-widest uppercase truncate">
                  Hartă Interactivă
                </h2>
                <p className="text-stone-400 font-mono text-xs hidden sm:block">
                  Proiecție Mercator · WGS84 · Leaflet OSM
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6 font-mono text-xs">
              <span className="text-stone-500">Click pe hartă pentru detalii locație</span>
              <span className="text-emerald-700 border border-emerald-200/50 rounded px-2 py-1">
                🌍 15 orașe marcate
              </span>
            </div>

            <button
              onClick={onClose}
              className="text-stone-500 hover:text-red-700 transition-colors text-xl leading-none font-mono ml-4"
              title="Închide (Esc)"
            >
              ✕
            </button>
          </div>

          {/* Map area + overlay wrapper */}
          <div className="relative flex-1 overflow-hidden">

            {/* Map area */}
            <div ref={mapContainerRef} className="absolute inset-0" />

            {/* Full-map info overlay */}
            {locationInfo && (
              <div
                key={`${locationInfo.lat}-${locationInfo.lng}`}
                className="location-panel absolute inset-0 z-1000 overflow-y-auto"
                style={{ background: "rgba(251,246,236,0.95)" }}
              >
                {/* Overlay header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-amber-300/40 sticky top-0 z-10"
                  style={{ background: "rgba(251,246,236,0.97)" }}>
                  <div className="flex items-center gap-3">
                    <span className="text-amber-700 text-lg">📍</span>
                    <div>
                      {locationInfo.loading || !locationInfo.locationName ? (
                        <div className="text-amber-700 font-mono text-sm animate-pulse">Se identifică locația...</div>
                      ) : (
                        <div className="text-yellow-200 font-mono font-bold text-base leading-snug">
                          {locationInfo.locationName}
                        </div>
                      )}
                      <div className="text-stone-500 font-mono text-[11px] mt-0.5">
                        {latLabel} &nbsp;·&nbsp; {lngLabel}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setLocationInfo(null);
                      if (clickMarkerRef.current) {
                        clickMarkerRef.current.remove();
                        clickMarkerRef.current = null;
                      }
                    }}
                    className="text-stone-500 hover:text-red-700 transition-colors text-xl font-mono ml-6"
                    title="Înapoi la hartă"
                  >
                    ✕
                  </button>
                </div>

                {/* Overlay content */}
                <div className="px-6 py-6 font-mono grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                  {/* Coordinates card */}
                  <div className="bg-stone-50/80 border border-amber-300/30 rounded-xl p-4 flex flex-col gap-2">
                    <div className="text-stone-500 text-[10px] uppercase tracking-widest mb-1">Coordonate</div>
                    <div className="flex flex-col gap-1 text-sm">
                      <div><span className="text-amber-700">Lat: </span><span className="text-yellow-100">{latLabel}</span></div>
                      <div><span className="text-amber-700">Lon: </span><span className="text-yellow-100">{lngLabel}</span></div>
                    </div>
                  </div>

                  {/* Local time card */}
                  <div className="bg-stone-50/80 border border-amber-300/30 rounded-xl p-4 flex flex-col gap-2">
                    <div className="text-stone-500 text-[10px] uppercase tracking-widest mb-1">Ora locală</div>
                    {locationInfo.loading || !locationInfo.timeStr ? (
                      <div className="text-stone-500 animate-pulse text-sm">⏳ Se încarcă...</div>
                    ) : (
                      <>
                        <div className="text-yellow-200 text-3xl font-bold tracking-wider">{locationInfo.timeStr}</div>
                        <div className="text-stone-600 text-xs">{locationInfo.dateStr}</div>
                        <div className="text-stone-500 text-[10px] mt-1">🌐 {locationInfo.tzName}</div>
                      </>
                    )}
                  </div>

                  {/* Weather card – temperature + conditions */}
                  <div className="bg-stone-50/80 border border-blue-300/30 rounded-xl p-4 flex flex-col gap-2">
                    <div className="text-stone-500 text-[10px] uppercase tracking-widest mb-1">🌤 Vreme actuală</div>
                    {locationInfo.weatherLoading ? (
                      <div className="text-stone-500 animate-pulse text-sm">⏳ Se încarcă...</div>
                    ) : locationInfo.weatherError ? (
                      <div className="text-red-700 text-xs">{locationInfo.weatherError}</div>
                    ) : locationInfo.weather ? (
                      <>
                        <div className="flex items-end gap-2">
                          <span className="text-blue-200 text-4xl font-bold">{Math.round(locationInfo.weather.temperature)}°C</span>
                          <span className="text-stone-600 text-sm pb-1">resimțit {Math.round(locationInfo.weather.feelsLike)}°C</span>
                        </div>
                        <div className="text-blue-800 text-sm font-semibold">{locationInfo.weather.conditions}</div>
                        {locationInfo.weather.description && (
                          <div className="text-stone-500 text-[11px] leading-snug">{locationInfo.weather.description}</div>
                        )}
                        <div className="flex gap-3 text-xs text-stone-600 mt-1">
                          <span>↑ {Math.round(locationInfo.weather.tempMax)}°</span>
                          <span>↓ {Math.round(locationInfo.weather.tempMin)}°</span>
                        </div>
                      </>
                    ) : null}
                  </div>

                  {/* Turism card – top events */}
                  <div className="bg-stone-50/80 border border-fuchsia-900/30 rounded-xl p-4 flex flex-col gap-2">
                    <div className="text-stone-500 text-[10px] uppercase tracking-widest mb-1">🎟 Evenimente Turism</div>
                    {locationInfo.eventsLoading ? (
                      <div className="text-stone-500 animate-pulse text-sm">⏳ Se încarcă...</div>
                    ) : locationInfo.eventsError ? (
                      <div className="text-red-700 text-xs">{locationInfo.eventsError}</div>
                    ) : locationInfo.events.length > 0 ? (
                      <>
                        <div className="text-fuchsia-200 text-sm font-semibold">{locationInfo.events.length} evenimente găsite</div>
                        {locationInfo.eventsSearchNote && (
                          <div className="text-fuchsia-400 text-[11px]">{locationInfo.eventsSearchNote}</div>
                        )}
                        <div className="space-y-2">
                          {locationInfo.events.slice(0, 3).map((event) => (
                            <div key={event.id} className="rounded-lg border border-fuchsia-900/40 bg-stone-100/70 p-2">
                              <div className="text-fuchsia-100 text-xs font-semibold leading-snug">{event.name}</div>
                              <div className="text-stone-600 text-[11px] mt-1">
                                {event.date ?? "Data necunoscută"}
                                {event.time ? ` · ${event.time.slice(0, 5)}` : ""}
                              </div>
                              <div className="text-stone-500 text-[11px] mt-0.5">{event.venue ?? "Locație indisponibilă"}</div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-stone-500 text-xs">{locationInfo.eventsSearchNote ?? "Nu s-au găsit evenimente pentru această zonă."}</div>
                    )}
                  </div>

                  {/* Weather details card */}
                  {locationInfo.weather && !locationInfo.weatherLoading && (
                    <div className="bg-stone-50/80 border border-blue-300/30 rounded-xl p-4 flex flex-col gap-2">
                      <div className="text-stone-500 text-[10px] uppercase tracking-widest mb-1">📊 Detalii meteo</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div><span className="text-stone-500">💧 Umiditate: </span><span className="text-blue-200">{locationInfo.weather.humidity}%</span></div>
                        <div><span className="text-stone-500">🌬 Vânt: </span><span className="text-blue-200">{Math.round(locationInfo.weather.windSpeed)} km/h {locationInfo.weather.windDirectionLabel}</span></div>
                        <div><span className="text-stone-500">🌧 Precipitații: </span><span className="text-blue-200">{locationInfo.weather.precipProbability}%</span></div>
                        <div><span className="text-stone-500">☁️ Nori: </span><span className="text-blue-200">{locationInfo.weather.cloudCover}%</span></div>
                        <div><span className="text-stone-500">👁 Vizibilitate: </span><span className="text-blue-200">{locationInfo.weather.visibility} km</span></div>
                        <div><span className="text-stone-500">🌡 Presiune: </span><span className="text-blue-200">{Math.round(locationInfo.weather.pressure)} hPa</span></div>
                        <div><span className="text-stone-500">☀️ UV: </span><span className="text-blue-200">{locationInfo.weather.uvIndex}</span></div>
                        <div><span className="text-stone-500">💦 Punct de rouă: </span><span className="text-blue-200">{Math.round(locationInfo.weather.dewPoint)}°C</span></div>
                        <div><span className="text-stone-500">🌅 Răsărit: </span><span className="text-blue-200">{locationInfo.weather.sunrise?.slice(0, 5)}</span></div>
                        <div><span className="text-stone-500">🌇 Apus: </span><span className="text-blue-200">{locationInfo.weather.sunset?.slice(0, 5)}</span></div>
                      </div>
                    </div>
                  )}

                  {/* Turism details card */}
                  {locationInfo.events.length > 0 && !locationInfo.eventsLoading && (
                    <div className="bg-stone-50/80 border border-fuchsia-900/30 rounded-xl p-4 flex flex-col gap-2 sm:col-span-2 lg:col-span-3">
                      <div className="text-stone-500 text-[10px] uppercase tracking-widest mb-1">📍 Recomandări Ticketmaster</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 text-xs">
                        {locationInfo.events.slice(0, 6).map((event) => (
                          <div key={`details-${event.id}`} className="rounded-lg border border-fuchsia-900/40 bg-stone-100/60 p-3">
                            <div className="text-fuchsia-100 font-semibold text-sm leading-snug">{event.name}</div>
                            <div className="text-stone-600 mt-1">{event.city ?? "Oraș necunoscut"}</div>
                            <div className="text-stone-500">{event.venue ?? "Locație indisponibilă"}</div>
                            <div className="text-stone-500 mt-1">
                              {event.date ?? "Data necunoscută"}
                              {event.time ? ` · ${event.time.slice(0, 5)}` : ""}
                            </div>
                            {event.url && (
                              <a
                                href={event.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block mt-2 text-fuchsia-300 hover:text-fuchsia-200 underline"
                              >
                                Vezi evenimentul
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Google Places card */}
                  <div className="bg-stone-50/80 border border-emerald-200/30 rounded-xl p-4 flex flex-col gap-2">
                    <div className="text-stone-500 text-[10px] uppercase tracking-widest mb-1">🧭 Google Places</div>
                    {locationInfo.placesLoading ? (
                      <div className="text-stone-500 animate-pulse text-sm">⏳ Se încarcă...</div>
                    ) : locationInfo.placesError ? (
                      <div className="text-red-700 text-xs">{locationInfo.placesError}</div>
                    ) : locationInfo.places.length > 0 ? (
                      <>
                        <div className="text-emerald-800 text-sm font-semibold">{locationInfo.places.length} locuri găsite</div>
                        <div className="space-y-2">
                          {locationInfo.places.slice(0, 3).map((place) => (
                            <div key={place.id} className="rounded-lg border border-emerald-200/40 bg-stone-100/70 p-2">
                              <div className="text-emerald-100 text-xs font-semibold leading-snug">{place.name}</div>
                              <div className="text-stone-500 text-[11px] mt-0.5">{place.address ?? "Adresă indisponibilă"}</div>
                              <div className="text-stone-600 text-[11px] mt-1">
                                ⭐ {place.rating ?? "-"}
                                {place.userRatingsTotal ? ` (${place.userRatingsTotal})` : ""}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-stone-500 text-xs">Nu s-au găsit locuri turistice pentru această zonă.</div>
                    )}
                  </div>

                  {/* Google Places details card */}
                  {locationInfo.places.length > 0 && !locationInfo.placesLoading && (
                    <div className="bg-stone-50/80 border border-emerald-200/30 rounded-xl p-4 flex flex-col gap-2 sm:col-span-2 lg:col-span-3">
                      <div className="text-stone-500 text-[10px] uppercase tracking-widest mb-1">🗺 Recomandări Google Places</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 text-xs">
                        {locationInfo.places.slice(0, 6).map((place) => (
                          <div key={`place-${place.id}`} className="rounded-lg border border-emerald-200/40 bg-stone-100/60 p-3">
                            <div className="text-emerald-100 font-semibold text-sm leading-snug">{place.name}</div>
                            <div className="text-stone-500 mt-1">{place.address ?? "Adresă indisponibilă"}</div>
                            <div className="text-stone-600 mt-1">⭐ {place.rating ?? "-"}</div>
                            {place.googleMapsUrl && (
                              <a
                                href={place.googleMapsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block mt-2 text-emerald-800 hover:text-emerald-800 underline"
                              >
                                Vezi pe Google Maps
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>

          {/* Footer bar */}
          <div className="shrink-0 px-5 py-2 border-t border-emerald-200/30 bg-stone-100/80 flex items-center justify-between font-mono text-xs text-stone-400">
            <span>© OpenStreetMap contributors · © CARTO</span>
            <span>Apasă ESC sau click în afara hărții pentru a închide</span>
          </div>
        </div>
      </div>
    </>
  );
}



