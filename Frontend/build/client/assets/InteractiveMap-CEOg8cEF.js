const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/leaflet-src-Cf2iC1qK.js","assets/chunk-EPOLDU6W-DFnzBwSv.js"])))=>i.map(i=>d[i]);
import{_ as d}from"./dashboard-Dq6f1I6t.js";import{a as c,p as r}from"./chunk-EPOLDU6W-DFnzBwSv.js";import"./useAuth-DA8bHQmP.js";import"./api-DWtuOZsL.js";function m(i,a,t){const n=i.divIcon({className:"",html:`<div style="
      width:14px;height:14px;
      background:#4ade80;
      border:2px solid #86efac;
      border-radius:50%;
      box-shadow:0 0 8px #4ade80, 0 0 18px #4ade8066;
    "></div>`,iconSize:[14,14],iconAnchor:[7,7],popupAnchor:[0,-12]}),s=t.name.split(",").slice(0,2).join(",").trim();return i.marker([t.lat,t.lon],{icon:n}).addTo(a).bindPopup(`<div style="
        background:#111827;
        color:#4ade80;
        border:1px solid #166534;
        border-radius:8px;
        padding:10px 14px;
        font-family:monospace;
        font-size:12px;
        min-width:180px;
      ">
        <strong style="font-size:14px;color:#86efac;">${s}</strong><br/>
        <span style="color:#6b7280;font-size:11px;">
          ${t.lat>=0?t.lat.toFixed(4)+"°N":Math.abs(t.lat).toFixed(4)+"°S"}
          &nbsp;&middot;&nbsp;
          ${t.lon>=0?t.lon.toFixed(4)+"°E":Math.abs(t.lon).toFixed(4)+"°W"}
        </span>
      </div>`,{className:"geo-popup",maxWidth:280}).openPopup()}function w({onClose:i,flyTo:a}){const t=c.useRef(null),n=c.useRef(null),s=c.useRef(null),l=c.useRef(a);return l.current=a,c.useEffect(()=>{if(!(typeof window>"u")&&t.current&&!n.current)return d(()=>import("./leaflet-src-Cf2iC1qK.js").then(e=>e.l),__vite__mapDeps([0,1])).then(e=>{delete e.Icon.Default.prototype._getIconUrl,e.Icon.Default.mergeOptions({iconRetinaUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",iconUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",shadowUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"});const o=l.current,p=e.map(t.current,{center:o?[o.lat,o.lon]:[20,0],zoom:o?13:2,minZoom:2,maxZoom:18,zoomControl:!0,attributionControl:!0});e.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/">CARTO</a>',subdomains:"abcd",maxZoom:20}).addTo(p);const u=[[44.4268,26.1025,"București","🇷🇴 România · 44°25'N 26°06'E"],[48.8566,2.3522,"Paris","🇫🇷 Franța · 48°51'N 02°21'E"],[51.5074,-.1278,"Londra","🇬🇧 Marea Britanie · 51°30'N 00°07'W"],[40.7128,-74.006,"New York","🇺🇸 SUA · 40°42'N 74°00'W"],[35.6762,139.6503,"Tokyo","🇯🇵 Japonia · 35°41'N 139°41'E"],[-33.8688,151.2093,"Sydney","🇦🇺 Australia · 33°51'S 151°12'E"],[-23.5505,-46.6333,"São Paulo","🇧🇷 Brazilia · 23°32'S 46°38'W"],[28.6139,77.209,"New Delhi","🇮🇳 India · 28°36'N 77°12'E"],[55.7558,37.6173,"Moscova","🇷🇺 Rusia · 55°45'N 37°37'E"],[39.9042,116.4074,"Beijing","🇨🇳 China · 39°54'N 116°24'E"],[-34.6037,-58.3816,"Buenos Aires","🇦🇷 Argentina · 34°36'S 58°22'W"],[1.3521,103.8198,"Singapore","🇸🇬 Singapore · 01°21'N 103°49'E"],[30.0444,31.2357,"Cairo","🇪🇬 Egipt · 30°02'N 31°14'E"],[-1.2921,36.8219,"Nairobi","🇰🇪 Kenya · 01°17'S 36°49'E"],[19.4326,-99.1332,"Mexico City","🇲🇽 Mexic · 19°25'N 99°07'W"]],x=e.divIcon({className:"",html:`<div style="
          width:10px;height:10px;
          background:#4ade80;
          border:2px solid #22c55e;
          border-radius:50%;
          box-shadow:0 0 6px #4ade80, 0 0 12px #4ade8066;
        "></div>`,iconSize:[10,10],iconAnchor:[5,5],popupAnchor:[0,-10]});u.forEach(([f,h,b,g])=>{e.marker([f,h],{icon:x}).addTo(p).bindPopup(`<div style="
              background:#111827;
              color:#4ade80;
              border:1px solid #166534;
              border-radius:8px;
              padding:10px 14px;
              font-family:monospace;
              font-size:12px;
              min-width:180px;
            ">
              <strong style="font-size:14px;color:#86efac;">${b}</strong><br/>
              <span style="color:#6b7280;font-size:11px;">${g}</span>
            </div>`,{className:"geo-popup",maxWidth:250})}),o&&(s.current=m(e,p,o)),n.current=p}),()=>{n.current&&(n.current.remove(),n.current=null)}},[]),c.useEffect(()=>{const e=o=>{o.key==="Escape"&&i()};return window.addEventListener("keydown",e),()=>window.removeEventListener("keydown",e)},[i]),c.useEffect(()=>{!a||!n.current||d(()=>import("./leaflet-src-Cf2iC1qK.js").then(e=>e.l),__vite__mapDeps([0,1])).then(e=>{const o=n.current;s.current&&(s.current.remove(),s.current=null),o.flyTo([a.lat,a.lon],13,{duration:1.5}),setTimeout(()=>{n.current&&(s.current=m(e,o,a))},1600)})},[a]),r.jsxs(r.Fragment,{children:[r.jsx("style",{children:`
        .geo-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .geo-popup .leaflet-popup-content {
          margin: 0 !important;
        }
        .geo-popup .leaflet-popup-tip-container {
          display: none !important;
        }
        .leaflet-control-attribution {
          background: rgba(3,7,18,0.8) !important;
          color: #374151 !important;
          font-size: 9px !important;
        }
        .leaflet-control-attribution a {
          color: #4b5563 !important;
        }
        .leaflet-control-zoom a {
          background: #111827 !important;
          color: #4ade80 !important;
          border-color: #166534 !important;
        }
        .leaflet-control-zoom a:hover {
          background: #1f2937 !important;
          color: #86efac !important;
        }
      `}),r.jsx("div",{className:"fixed inset-0 z-50 flex items-center justify-center p-4",style:{background:"rgba(0,0,0,0.85)"},onClick:e=>{e.target===e.currentTarget&&i()},children:r.jsxs("div",{className:"relative w-full max-w-6xl h-[85vh] bg-gray-950 rounded-2xl border border-green-900/50 overflow-hidden shadow-2xl shadow-green-950/50 flex flex-col",children:[r.jsxs("div",{className:"flex items-center justify-between px-5 py-3 border-b border-green-900/40 bg-gray-950/90 backdrop-blur z-10 shrink-0",children:[r.jsxs("div",{className:"flex items-center gap-3",children:[r.jsx("span",{className:"text-green-400 text-lg",children:"🗺️"}),r.jsxs("div",{children:[r.jsx("h2",{className:"text-green-300 font-mono font-bold text-sm tracking-widest uppercase",children:"Hartă Interactivă"}),r.jsx("p",{className:"text-green-800 font-mono text-xs",children:"Proiecție Mercator · WGS84 · Leaflet OSM"})]})]}),r.jsxs("div",{className:"hidden md:flex items-center gap-6 font-mono text-xs",children:[r.jsx("span",{className:"text-green-700",children:"Click pe marcatori pentru detalii"}),r.jsx("span",{className:"text-green-600 border border-green-900/50 rounded px-2 py-1",children:"🌍 15 orașe marcate"})]}),r.jsx("button",{onClick:i,className:"text-gray-500 hover:text-red-400 transition-colors text-xl leading-none font-mono ml-4",title:"Închide (Esc)",children:"✕"})]}),r.jsx("div",{ref:t,className:"flex-1 w-full"}),r.jsxs("div",{className:"shrink-0 px-5 py-2 border-t border-green-900/30 bg-gray-950/80 flex items-center justify-between font-mono text-xs text-green-900",children:[r.jsx("span",{children:"© OpenStreetMap contributors · © CARTO"}),r.jsx("span",{children:"Apasă ESC sau click în afara hărții pentru a închide"})]})]})})]})}export{w as default};
