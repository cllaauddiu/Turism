import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authApi } from "~/lib/api";
import { CartoBackground, GraticuleTick } from "~/components/dashboard/atlas";

const schema = z.object({
  newPassword: z.string().min(6, "Minim 6 caractere"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Parolele nu coincid",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!token) navigate("/auth");
  }, [token, navigate]);

  const onSubmit = async (data: FormData) => {
    if (!token) return;
    setServerError(""); setLoading(true);
    try {
      await authApi.resetPassword(token, data.newPassword);
      setSuccess(true);
    } catch (e: any) {
      setServerError(e?.response?.data?.message ?? "Token invalid sau expirat.");
    } finally { setLoading(false); }
  };

  const inputCls =
    "w-full bg-[#fbf6ec]/80 border border-emerald-300/60 rounded-sm px-3 py-2.5 text-stone-900 placeholder-stone-400 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 transition";

  return (
    <div className="min-h-screen bg-[#f4efe6] text-stone-900 relative overflow-hidden flex items-center justify-center px-4">
      <CartoBackground />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 font-mono">
          <div className="text-emerald-700 text-sm tracking-[0.3em] font-semibold">GEO·ATLAS</div>
          <div className="text-emerald-700/70 text-[10px] tracking-[0.4em] uppercase mt-1">Cartographic Console v2</div>
        </div>

        <div className="relative bg-[#fbf6ec]/85 backdrop-blur-md border border-emerald-300/60 rounded-sm overflow-hidden shadow-[0_30px_80px_-30px_rgba(25,107,70,0.25)]">
          <GraticuleTick pos="tl" /><GraticuleTick pos="tr" /><GraticuleTick pos="bl" /><GraticuleTick pos="br" />

          <div className="absolute -top-2 left-5 px-2 bg-[#fbf6ec] text-[10px] font-mono tracking-[0.4em] uppercase text-emerald-700">
            RESET · 01
          </div>

          <div className="p-7">
            {success ? (
              <div className="text-center space-y-5 py-4">
                <div className="text-5xl">✓</div>
                <div className="text-emerald-700 font-mono text-base font-semibold tracking-wider">
                  Parolă resetată!
                </div>
                <p className="text-stone-500 font-mono text-[11px] leading-relaxed">
                  Parola ta a fost actualizată cu succes. Poți să te conectezi cu noua parolă.
                </p>
                <button
                  onClick={() => navigate("/auth")}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-stone-50 font-mono font-semibold text-[12px] py-3 rounded-sm transition-all uppercase tracking-[0.3em]"
                >
                  Mergi la conectare ↩
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="mb-2">
                  <div className="text-emerald-700 font-mono text-[11px] uppercase tracking-[0.3em] font-semibold mb-1">
                    Resetare parolă
                  </div>
                  <p className="text-stone-500 font-mono text-[11px]">
                    Introdu noua parolă pentru contul tău.
                  </p>
                </div>

                {serverError && (
                  <div className="p-3 bg-red-50/80 border border-red-300 rounded-sm text-red-700 text-[11px] font-mono tracking-wider">
                    ⚠ {serverError}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-mono font-medium text-emerald-700 uppercase tracking-[0.3em] mb-1.5">
                    Parolă nouă
                  </label>
                  <input
                    {...register("newPassword")}
                    type="password"
                    placeholder="••••••••"
                    className={inputCls}
                  />
                  {errors.newPassword && (
                    <p className="mt-1.5 text-[11px] text-red-700 font-mono">↳ {errors.newPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-medium text-emerald-700 uppercase tracking-[0.3em] mb-1.5">
                    Confirmare parolă
                  </label>
                  <input
                    {...register("confirmPassword")}
                    type="password"
                    placeholder="••••••••"
                    className={inputCls}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1.5 text-[11px] text-red-700 font-mono">↳ {errors.confirmPassword.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-stone-50 font-mono font-semibold text-[12px] py-3 rounded-sm transition-all uppercase tracking-[0.3em] shadow-[0_8px_24px_-12px_rgba(25,107,70,0.6)]"
                >
                  {loading ? "◌ se procesează..." : "Salvează parola nouă ↩"}
                </button>

                <p className="text-center text-[11px] font-mono text-stone-400">
                  <button type="button" onClick={() => navigate("/auth")} className="text-emerald-700 hover:text-emerald-800 underline underline-offset-2">
                    ← Înapoi la conectare
                  </button>
                </p>
              </form>
            )}
          </div>

          <div className="px-7 pb-5 -mt-1 flex items-center justify-between text-[9px] font-mono tracking-[0.3em] uppercase text-emerald-700/70">
            <span>token · uuid · 1h</span>
            <span>bcrypt · hs256</span>
          </div>
        </div>
      </div>
    </div>
  );
}
