import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi } from "~/lib/api";
import { useAuth } from "~/hooks/useAuth";

const loginSchema = z.object({
  username: z.string().min(3, "Minim 3 caractere"),
  password: z.string().min(6, "Minim 6 caractere"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Minim 3 caractere"),
  password: z.string().min(6, "Minim 6 caractere"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Parolele nu coincid",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

// ── Decorative SVG world map (background) ─────────────────────────────────
function WorldMapBg() {
  return (
    <svg viewBox="0 0 1000 500" className="w-full h-full opacity-15" fill="none" xmlns="http://www.w3.org/2000/svg">
      {[50,100,150,200,250,300,350,400,450].map((y) => (
        <line key={`h${y}`} x1="0" y1={y} x2="1000" y2={y} stroke="#4ade80" strokeWidth="0.4" />
      ))}
      {[100,200,300,400,500,600,700,800,900].map((x) => (
        <line key={`v${x}`} x1={x} y1="0" x2={x} y2="500" stroke="#4ade80" strokeWidth="0.4" />
      ))}
      <path d="M 120 60 L 160 55 L 220 70 L 240 100 L 260 130 L 250 160 L 230 200 L 210 230 L 180 260 L 160 250 L 140 220 L 120 180 L 100 150 L 90 120 L 100 90 Z" fill="#4ade80" stroke="#22c55e" strokeWidth="1"/>
      <path d="M 230 30 L 270 25 L 290 40 L 280 65 L 250 70 L 230 55 Z" fill="#4ade80" stroke="#22c55e" strokeWidth="1"/>
      <path d="M 200 270 L 230 260 L 250 280 L 260 310 L 255 350 L 240 390 L 220 420 L 200 410 L 185 380 L 180 340 L 185 300 Z" fill="#4ade80" stroke="#22c55e" strokeWidth="1"/>
      <path d="M 460 60 L 500 55 L 530 65 L 540 85 L 520 100 L 500 110 L 480 105 L 460 90 Z" fill="#4ade80" stroke="#22c55e" strokeWidth="1"/>
      <path d="M 470 120 L 530 115 L 560 130 L 565 160 L 560 200 L 545 240 L 520 280 L 500 300 L 480 295 L 460 270 L 450 230 L 448 190 L 450 150 Z" fill="#4ade80" stroke="#22c55e" strokeWidth="1"/>
      <path d="M 550 50 L 640 45 L 720 55 L 780 70 L 820 90 L 830 120 L 810 150 L 780 160 L 740 165 L 700 170 L 660 165 L 620 160 L 580 145 L 555 125 L 545 100 L 548 75 Z" fill="#4ade80" stroke="#22c55e" strokeWidth="1"/>
      <path d="M 640 170 L 670 165 L 685 190 L 680 220 L 660 240 L 640 235 L 625 210 L 628 185 Z" fill="#4ade80" stroke="#22c55e" strokeWidth="1"/>
      <path d="M 760 310 L 830 300 L 880 315 L 900 345 L 890 375 L 860 395 L 820 400 L 780 385 L 755 355 L 750 325 Z" fill="#4ade80" stroke="#22c55e" strokeWidth="1"/>
      {/* Compass */}
      <g transform="translate(950, 60)">
        <circle cx="0" cy="0" r="25" stroke="#4ade80" strokeWidth="1" fill="none" opacity="0.5"/>
        <line x1="0" y1="-22" x2="0" y2="-8" stroke="#4ade80" strokeWidth="1.5"/>
        <line x1="0" y1="8" x2="0" y2="22" stroke="#4ade80" strokeWidth="1" opacity="0.5"/>
        <line x1="-22" y1="0" x2="-8" y2="0" stroke="#4ade80" strokeWidth="1" opacity="0.5"/>
        <line x1="8" y1="0" x2="22" y2="0" stroke="#4ade80" strokeWidth="1" opacity="0.5"/>
        <polygon points="0,-22 -4,-8 0,-12 4,-8" fill="#4ade80"/>
        <text x="0" y="-27" textAnchor="middle" fill="#4ade80" fontSize="7" fontFamily="serif">N</text>
      </g>
    </svg>
  );
}

// ── Floating coordinate label ──────────────────────────────────────────────
function CoordLabel({ top, left, text }: { top: string; left: string; text: string }) {
  return (
    <div className="absolute text-green-400/30 font-mono text-xs pointer-events-none select-none" style={{ top, left }}>
      {text}
    </div>
  );
}

// ── Main Auth Page ─────────────────────────────────────────────────────────
export default function AuthPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const p = setInterval(() => setPulse((v) => !v), 2000);
    return () => clearInterval(p);
  }, []);

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const handleLogin = async (data: LoginForm) => {
    setServerError("");
    setLoading(true);
    try {
      const response = await authApi.login(data);
      login(response);
      navigate("/dashboard");
    } catch (e: any) {
      setServerError(e?.response?.data?.message ?? "Credențiale incorecte.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    setServerError("");
    setLoading(true);
    try {
      const response = await authApi.register({ username: data.username, password: data.password });
      login(response);
      navigate("/dashboard");
    } catch (e: any) {
      setServerError(e?.response?.data?.message ?? "Înregistrare eșuată. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-gray-900/80 border border-green-900/50 rounded-lg px-4 py-2.5 text-green-100 placeholder-green-900 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition";
  const labelClass = "block text-xs font-mono font-medium text-green-600 uppercase tracking-widest mb-1.5";

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 overflow-hidden relative">

      {/* ── Background layers ── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0a2510_0%,#030712_70%)]" />
      <div className="absolute inset-0 pointer-events-none">
        <WorldMapBg />
      </div>
      {/* Scan lines */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,255,100,0.012)_2px,rgba(0,255,100,0.012)_4px)] pointer-events-none" />

      {/* Floating coordinates */}
      <CoordLabel top="8%"  left="5%"  text="51°30'N 00°07'W" />
      <CoordLabel top="12%" left="72%" text="35°41'N 139°41'E" />
      <CoordLabel top="78%" left="8%"  text="23°32'S 46°38'W" />
      <CoordLabel top="82%" left="68%" text="33°51'S 151°12'E" />
      <CoordLabel top="45%" left="2%"  text="48°51'N 02°21'E" />
      <CoordLabel top="20%" left="88%" text="55°45'N 37°37'E" />
      <CoordLabel top="65%" left="50%" text="01°21'N 103°49'E" />

      {/* ── Card ── */}
      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className={`w-9 h-9 rounded-full border-2 ${pulse ? "border-green-400" : "border-green-700"} transition-colors duration-1000 flex items-center justify-center`}>
              <div className={`w-2.5 h-2.5 rounded-full ${pulse ? "bg-green-400" : "bg-green-700"} transition-colors duration-1000`} />
            </div>
            <h1 className="text-green-400 font-bold tracking-[0.25em] text-xl uppercase font-mono">
              GeoAtlas
            </h1>
          </div>
          <p className="text-green-500 font-mono text-xs tracking-[0.3em] uppercase">
            ◈ Atlas Geografic Digital ◈
          </p>
        </div>

        {/* Form card */}
        <div className="bg-gray-950/80 backdrop-blur-md rounded-2xl border border-green-900/50 overflow-hidden shadow-2xl shadow-green-950/40">

          {/* Tabs */}
          <div className="flex border-b border-green-900/40">
            <button
              onClick={() => { setTab("login"); setServerError(""); }}
              className={`flex-1 py-3.5 text-xs font-mono font-semibold uppercase tracking-widest transition-all duration-300 ${
                tab === "login"
                  ? "bg-green-500/10 text-green-400 border-b-2 border-green-500"
                  : "text-green-800 hover:text-green-600 hover:bg-green-950/40"
              }`}
            >
              ⬡ Conectare
            </button>
            <button
              onClick={() => { setTab("register"); setServerError(""); }}
              className={`flex-1 py-3.5 text-xs font-mono font-semibold uppercase tracking-widest transition-all duration-300 ${
                tab === "register"
                  ? "bg-green-500/10 text-green-400 border-b-2 border-green-500"
                  : "text-green-800 hover:text-green-600 hover:bg-green-950/40"
              }`}
            >
              ⬡ Creare Cont
            </button>
          </div>

          <div className="p-7">
            {/* Server error */}
            {serverError && (
              <div className="mb-5 p-3 bg-red-950/60 border border-red-800/60 rounded-lg text-red-400 text-xs font-mono">
                ⚠ {serverError}
              </div>
            )}

            {/* ── LOGIN ── */}
            {tab === "login" && (
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
                <div>
                  <label className={labelClass}>Nume utilizator</label>
                  <input {...loginForm.register("username")} placeholder="username" className={inputClass} />
                  {loginForm.formState.errors.username && (
                    <p className="mt-1.5 text-xs text-red-400 font-mono">↳ {loginForm.formState.errors.username.message}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Parolă</label>
                  <input {...loginForm.register("password")} type="password" placeholder="••••••••" className={inputClass} />
                  {loginForm.formState.errors.password && (
                    <p className="mt-1.5 text-xs text-red-400 font-mono">↳ {loginForm.formState.errors.password.message}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-500/10 hover:bg-green-500/20 border border-green-500/40 hover:border-green-400 disabled:opacity-50 text-green-300 font-mono font-semibold text-sm py-2.5 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-green-900/30 uppercase tracking-widest"
                >
                  {loading ? "◌ Se conectează..." : "→ Conectare"}
                </button>
                <p className="text-center text-xs text-green-900 font-mono">
                  Nu ai cont?{" "}
                  <button type="button" onClick={() => setTab("register")} className="text-green-600 hover:text-green-400 transition-colors underline underline-offset-2">
                    Creează unul
                  </button>
                </p>
              </form>
            )}

            {/* ── REGISTER ── */}
            {tab === "register" && (
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <div>
                  <label className={labelClass}>Nume utilizator</label>
                  <input {...registerForm.register("username")} placeholder="username" className={inputClass} />
                  {registerForm.formState.errors.username && (
                    <p className="mt-1.5 text-xs text-red-400 font-mono">↳ {registerForm.formState.errors.username.message}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Parolă</label>
                  <input {...registerForm.register("password")} type="password" placeholder="••••••••" className={inputClass} />
                  {registerForm.formState.errors.password && (
                    <p className="mt-1.5 text-xs text-red-400 font-mono">↳ {registerForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Confirmare parolă</label>
                  <input {...registerForm.register("confirmPassword")} type="password" placeholder="••••••••" className={inputClass} />
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="mt-1.5 text-xs text-red-400 font-mono">↳ {registerForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-500/10 hover:bg-green-500/20 border border-green-500/40 hover:border-green-400 disabled:opacity-50 text-green-300 font-mono font-semibold text-sm py-2.5 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-green-900/30 uppercase tracking-widest mt-1"
                >
                  {loading ? "◌ Se creează contul..." : "→ Creare Cont"}
                </button>
                <p className="text-center text-xs text-green-900 font-mono">
                  Ai deja cont?{" "}
                  <button type="button" onClick={() => setTab("login")} className="text-green-600 hover:text-green-400 transition-colors underline underline-offset-2">
                    Conectează-te
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Bottom label */}
        <p className="text-center text-green-900 font-mono text-xs mt-5 tracking-wider">
          Proiecție: Mercator · Datum: WGS84 · v1.0
        </p>
      </div>
    </div>
  );
}
