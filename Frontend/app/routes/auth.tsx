import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi } from "~/lib/api";
import { useAuth } from "~/hooks/useAuth";
import { CartoBackground, GraticuleTick, useTime, pad, useTypewriter } from "~/components/dashboard/atlas";

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

/* ═════════════════════════════════════════════════════════════════════════
   AUTH PAGE — Cartographic Boarding Terminal
   ═════════════════════════════════════════════════════════════════════════ */
export default function AuthPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const t = useTime();
  const utc = `${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}:${pad(t.getUTCSeconds())} UTC`;
  const greet = useTypewriter("> initializare consola...   semnal stabil   transmit cripto: AES-256-GCM", 12, 200);

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const handleLogin = async (data: LoginForm) => {
    setServerError(""); setLoading(true);
    try {
      const r = await authApi.login(data); login(r); navigate("/dashboard");
    } catch (e: any) {
      setServerError(e?.response?.data?.message ?? "Credentiale incorecte.");
    } finally { setLoading(false); }
  };

  const handleRegister = async (data: RegisterForm) => {
    setServerError(""); setLoading(true);
    try {
      const r = await authApi.register({ username: data.username, password: data.password });
      login(r); navigate("/dashboard");
    } catch (e: any) {
      setServerError(e?.response?.data?.message ?? "Inregistrare esuata.");
    } finally { setLoading(false); }
  };

  const handleGuest = async () => {
    setServerError(""); setLoading(true);
    try {
      const r = await authApi.loginAsGuest(); login(r); navigate("/dashboard");
    } catch {
      setServerError("Eroare la conectarea ca vizitator.");
    } finally { setLoading(false); }
  };

  const inputCls =
    "w-full bg-[#fbf6ec]/80 border border-emerald-300/60 rounded-sm px-3 py-2.5 text-stone-900 placeholder-stone-400 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 transition";
  const labelCls = "block text-[10px] font-mono font-medium text-emerald-700 uppercase tracking-[0.3em] mb-1.5";

  return (
    <div className="min-h-screen bg-[#f4efe6] text-stone-900 relative overflow-hidden">
      <CartoBackground />

      {/* ── Top status strip ── */}
      <div className="relative z-20 border-b border-emerald-300/50 bg-[#f4efe6]/85 backdrop-blur-md font-mono">
        <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between text-[10px] tracking-[0.3em] uppercase text-emerald-700">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Geo·Atlas · Boarding Terminal</span>
          </div>
          <div className="hidden sm:flex items-center gap-6">
            <span>POS · 44°26'N · 26°06'E</span>
            <span className="text-emerald-800 tabular-nums">{utc}</span>
            <span>SECT EU/RO</span>
          </div>
        </div>
        <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />
      </div>

      {/* ── Main 2-column grid ── */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-16 grid grid-cols-12 gap-6 lg:gap-10 items-start">

        {/* ─── LEFT COLUMN — Brand + console intro ─── */}
        <aside className="col-span-12 lg:col-span-7">
          <div className="font-mono">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative w-12 h-12">
                <svg viewBox="0 0 48 48" className="absolute inset-0 geo-spin-slow text-emerald-700/60">
                  <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="0.7" strokeDasharray="3 4" />
                </svg>
                <svg viewBox="0 0 48 48" className="absolute inset-0 geo-spin-slower text-emerald-700/40">
                  <circle cx="24" cy="24" r="15" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 5" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 shadow-[0_0_10px_rgba(25,107,70,0.5)]" />
                </div>
              </div>
              <div className="leading-tight">
                <div className="text-emerald-700 text-sm tracking-[0.3em] font-semibold">GEO·ATLAS</div>
                <div className="text-emerald-700/70 text-[10px] tracking-[0.4em] uppercase">Cartographic Console v2</div>
              </div>
            </div>

            <div className="text-[10px] tracking-[0.4em] text-emerald-700 uppercase mb-3">
              ◈ acces autorizat · canal sigur ◈
            </div>
            <h1 className="text-[44px] sm:text-[56px] md:text-[72px] leading-[0.95] tracking-tight font-semibold text-stone-900">
              <span className="text-emerald-700">Atlasul</span>
              <br />tau astepta.
            </h1>
            <p className="mt-5 max-w-md text-stone-600 text-sm leading-relaxed">
              Conecteaza-te la consola cartografica · 195 state suverane · 510M km² ·
              telemetrie live · joc global.
            </p>

            {/* Console intro */}
            <div className="mt-8 max-w-md text-emerald-800/90 text-[12px] leading-relaxed">
              <div>{greet}<span className="geo-caret" /></div>
            </div>

            {/* Side stats */}
            <div className="mt-10 grid grid-cols-3 gap-3 max-w-md">
              <SideStat k="Sesiuni" v="14.2k" />
              <SideStat k="Latency" v="28 ms" />
              <SideStat k="Uptime" v="99.97%" />
            </div>

            {/* Coordinate strip */}
            <div className="mt-10 hidden lg:flex flex-wrap gap-x-6 gap-y-2 text-[10px] tracking-[0.3em] text-emerald-700/70 uppercase">
              <span>· London 51°30'N</span>
              <span>· Tokyo 35°41'N</span>
              <span>· São Paulo 23°32'S</span>
              <span>· Sydney 33°51'S</span>
              <span>· Paris 48°51'N</span>
            </div>
          </div>
        </aside>

        {/* ─── RIGHT COLUMN — Auth panel ─── */}
        <section className="col-span-12 lg:col-span-5">
          <div className="relative bg-[#fbf6ec]/85 backdrop-blur-md border border-emerald-300/60 rounded-sm overflow-hidden shadow-[0_30px_80px_-30px_rgba(25,107,70,0.25)]"
               style={{ boxShadow: "inset 0 0 0 1px rgba(25,107,70,0.06), 0 30px 80px -30px rgba(25,107,70,0.25)" }}>
            <GraticuleTick pos="tl" /><GraticuleTick pos="tr" /><GraticuleTick pos="bl" /><GraticuleTick pos="br" />

            {/* Header label */}
            <div className="absolute -top-2 left-5 px-2 bg-[#fbf6ec] text-[10px] font-mono tracking-[0.4em] uppercase text-emerald-700">
              CRED · 01
            </div>
            <div className="absolute -top-2 right-5 px-2 bg-[#fbf6ec] text-[10px] font-mono tracking-widest text-emerald-700/70">
              44°N · 26°E
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-2 border-b border-emerald-300/50 font-mono">
              {(["login", "register"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => { setTab(k); setServerError(""); }}
                  className={`relative py-4 text-[11px] font-semibold uppercase tracking-[0.3em] transition-colors ${
                    tab === k
                      ? "text-emerald-700 bg-emerald-100/40"
                      : "text-stone-500 hover:text-emerald-700 hover:bg-emerald-100/20"
                  }`}
                >
                  {k === "login" ? "› Conectare" : "+ Cont Nou"}
                  {tab === k && <span className="absolute inset-x-0 bottom-0 h-px bg-emerald-600" />}
                </button>
              ))}
            </div>

            <div className="p-6 sm:p-7">
              {serverError && (
                <div className="mb-5 p-3 bg-red-50/80 border border-red-300 rounded-sm text-red-700 text-[11px] font-mono tracking-wider">
                  ⚠ {serverError}
                </div>
              )}

              {tab === "login" && (
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
                  <Field label="Nume utilizator" error={loginForm.formState.errors.username?.message}>
                    <input {...loginForm.register("username")} placeholder="username" className={inputCls} />
                  </Field>
                  <Field label="Parola" error={loginForm.formState.errors.password?.message}>
                    <input {...loginForm.register("password")} type="password" placeholder="••••••••" className={inputCls} />
                  </Field>
                  <SubmitBtn loading={loading}>Conectare ↩</SubmitBtn>
                  <p className="text-center text-[11px] text-stone-500 font-mono">
                    Nu ai cont?{" "}
                    <button type="button" onClick={() => setTab("register")} className="text-emerald-700 hover:text-emerald-800 underline underline-offset-2">
                      Creeaza unul
                    </button>
                  </p>
                </form>
              )}

              {tab === "register" && (
                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                  <Field label="Nume utilizator" error={registerForm.formState.errors.username?.message}>
                    <input {...registerForm.register("username")} placeholder="username" className={inputCls} />
                  </Field>
                  <Field label="Parola" error={registerForm.formState.errors.password?.message}>
                    <input {...registerForm.register("password")} type="password" placeholder="••••••••" className={inputCls} />
                  </Field>
                  <Field label="Confirmare parola" error={registerForm.formState.errors.confirmPassword?.message}>
                    <input {...registerForm.register("confirmPassword")} type="password" placeholder="••••••••" className={inputCls} />
                  </Field>
                  <SubmitBtn loading={loading}>Creare Cont ↩</SubmitBtn>
                  <p className="text-center text-[11px] text-stone-500 font-mono">
                    Ai deja cont?{" "}
                    <button type="button" onClick={() => setTab("login")} className="text-emerald-700 hover:text-emerald-800 underline underline-offset-2">
                      Conecteaza-te
                    </button>
                  </p>
                </form>
              )}

              {/* Divider */}
              <div className="my-6 flex items-center gap-3 font-mono">
                <div className="flex-1 h-px bg-emerald-300/60" />
                <span className="text-[10px] tracking-[0.4em] text-emerald-700/70 uppercase">sau</span>
                <div className="flex-1 h-px bg-emerald-300/60" />
              </div>

              <button
                type="button" onClick={handleGuest} disabled={loading}
                className="w-full bg-[#f4efe6]/80 hover:bg-emerald-50 border border-emerald-300/60 hover:border-emerald-600 disabled:opacity-50 text-emerald-700 hover:text-emerald-800 font-mono font-semibold text-[11px] py-3 rounded-sm transition-all uppercase tracking-[0.3em]"
              >
                ⯈ Continua ca vizitator
              </button>
            </div>

            {/* Footer label inside card */}
            <div className="px-7 pb-5 -mt-1 flex items-center justify-between text-[9px] font-mono tracking-[0.3em] uppercase text-emerald-700/70">
              <span>jwt · hs256</span>
              <span>session 24h</span>
            </div>
          </div>

          {/* Below-card meta */}
          <p className="text-center text-stone-500 font-mono text-[10px] mt-5 tracking-[0.3em] uppercase">
            Mercator · WGS84 · v1.0
          </p>
        </section>
      </div>
    </div>
  );
}

/* ── helpers ── */
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-mono font-medium text-emerald-700 uppercase tracking-[0.3em] mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-[11px] text-red-700 font-mono">↳ {error}</p>}
    </div>
  );
}
function SubmitBtn({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit" disabled={loading}
      className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-stone-50 font-mono font-semibold text-[12px] py-3 rounded-sm transition-all uppercase tracking-[0.3em] shadow-[0_8px_24px_-12px_rgba(25,107,70,0.6)]"
    >
      {loading ? "◌ se proceseaza..." : children}
    </button>
  );
}
function SideStat({ k, v }: { k: string; v: string }) {
  return (
    <div className="border border-emerald-300/50 bg-[#fbf6ec]/60 px-3 py-2.5">
      <div className="text-[9px] tracking-[0.3em] text-emerald-700/70 uppercase">{k}</div>
      <div className="text-emerald-800 text-[16px] tabular-nums mt-0.5">{v}</div>
    </div>
  );
}
