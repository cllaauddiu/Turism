import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/hooks/useAuth";
import { usersApi, type UserDTO, type UserRole } from "~/lib/api";
import AdminSupportPanel from "~/components/AdminSupportPanel";
import { CartoBackground, GraticuleTick, SectionRule, useTime, pad, useTypewriter } from "~/components/dashboard/atlas";

/* ═════════════════════════════════════════════════════════════════════════
   ADMIN CONSOLE — Cartographic Operator Dashboard
   ═════════════════════════════════════════════════════════════════════════ */
type ModalMode = "create" | "edit" | "delete" | "role" | null;
interface ModalState { mode: ModalMode; user?: UserDTO; }

export default function AdminDashboard() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"users" | "stats" | "support">("users");
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<"ALL" | UserRole>("ALL");
  const [modal, setModal] = useState<ModalState>({ mode: null });
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("CLIENT");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const t = useTime();
  const utc = `${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}:${pad(t.getUTCSeconds())} UTC`;
  const greet = useTypewriter("> consola admin · acces complet · inventory utilizatori sincron", 14, 250);

  // ── Auth guard ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/auth");
    if (user && user.role !== "ADMIN") navigate("/client-dashboard");
  }, [loading, isAuthenticated, navigate, user]);

  useEffect(() => {
    const open = () => setActiveTab("support");
    window.addEventListener("open-chat-admin", open);
    return () => window.removeEventListener("open-chat-admin", open);
  }, []);

  const showToast = (msg: string, type: "ok" | "err") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const data = await usersApi.getAll();
      setUsers(data);
    } catch {
      showToast("Eroare la incarcarea utilizatorilor.", "err");
    } finally { setLoadingUsers(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openModal = (mode: ModalMode, u?: UserDTO) => {
    setFormError("");
    setFormUsername(u?.username ?? "");
    setFormPassword("");
    setFormRole((u?.role as UserRole) ?? "CLIENT");
    setModal({ mode, user: u });
  };
  const closeModal = () => setModal({ mode: null });

  const handleCreate = async () => {
    if (!formUsername.trim() || formUsername.length < 3) { setFormError("Minim 3 caractere pentru username."); return; }
    if (!formPassword || formPassword.length < 6) { setFormError("Parola trebuie sa aiba minim 6 caractere."); return; }
    setFormLoading(true); setFormError("");
    try {
      await usersApi.create({ username: formUsername.trim(), password: formPassword });
      showToast(`Utilizatorul „${formUsername}" a fost creat.`, "ok"); closeModal(); fetchUsers();
    } catch (e: any) {
      setFormError(e?.response?.data?.message ?? "Eroare la creare.");
    } finally { setFormLoading(false); }
  };
  const handleEdit = async () => {
    if (!formUsername.trim() || formUsername.length < 3) { setFormError("Minim 3 caractere pentru username."); return; }
    if (formPassword && formPassword.length < 6) { setFormError("Parola trebuie sa aiba minim 6 caractere."); return; }
    setFormLoading(true); setFormError("");
    try {
      await usersApi.update(modal.user!.id, { username: formUsername.trim(), ...(formPassword ? { password: formPassword } : {}) });
      showToast("Utilizatorul a fost actualizat.", "ok"); closeModal(); fetchUsers();
    } catch (e: any) {
      setFormError(e?.response?.data?.message ?? "Eroare la actualizare.");
    } finally { setFormLoading(false); }
  };
  const handleDelete = async () => {
    setFormLoading(true);
    try {
      await usersApi.delete(modal.user!.id);
      showToast(`Utilizatorul „${modal.user!.username}" a fost sters.`, "ok"); closeModal(); fetchUsers();
    } catch (e: any) {
      setFormError(e?.response?.data?.message ?? "Eroare la stergere.");
    } finally { setFormLoading(false); }
  };
  const handleChangeRole = async () => {
    setFormLoading(true); setFormError("");
    try {
      await usersApi.changeRole(modal.user!.id, { role: formRole });
      showToast(`Rolul a fost schimbat in ${formRole}.`, "ok"); closeModal(); fetchUsers();
    } catch (e: any) {
      setFormError(e?.response?.data?.message ?? "Eroare la schimbarea rolului.");
    } finally { setFormLoading(false); }
  };

  const filtered = users.filter((u) => {
    const ms = u.username.toLowerCase().includes(search.toLowerCase());
    const mr = filterRole === "ALL" || u.role === filterRole;
    return ms && mr;
  });
  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const clientCount = users.filter((u) => u.role === "CLIENT").length;
  const guestCount = users.filter((u) => u.role === "GUEST").length;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f4efe6] text-stone-900 relative overflow-x-hidden">
      <CartoBackground />

      {/* ── Top operator strip ── */}
      <header className="relative z-30 border-b border-emerald-300/50 bg-[#f4efe6]/85 backdrop-blur-md font-mono">
        <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />
        <div className="px-4 sm:px-6 py-3 grid grid-cols-3 items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-9 h-9 shrink-0">
              <svg viewBox="0 0 40 40" className="absolute inset-0 geo-spin-slow text-violet-700/60">
                <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="2 3" />
              </svg>
              <svg viewBox="0 0 40 40" className="absolute inset-0 geo-spin-slower text-violet-700/40">
                <circle cx="20" cy="20" r="13" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 4" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-600 shadow-[0_0_10px_rgba(124,58,237,0.5)]" />
              </div>
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-violet-700 text-[13px] tracking-[0.3em] font-semibold">GEO·ATLAS · ADMIN</div>
              <div className="text-violet-700/70 text-[10px] tracking-[0.4em] uppercase">Operator Console v2</div>
            </div>
          </div>

          {/* Center */}
          <div className="hidden md:flex items-center justify-center gap-6">
            <RibbonStat k="POS" v="44°26'N · 26°06'E" />
            <RibbonStat k="UTC" v={utc} />
            <RibbonStat k="USR" v={`${users.length}`} />
          </div>

          {/* Right */}
          <div className="flex items-center justify-end gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-violet-300/60 bg-violet-100/40">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse" />
              <span className="text-[10px] tracking-widest text-violet-700">ADMIN·LOCK</span>
            </div>
            <div className="hidden sm:block text-right leading-tight">
              <div className="text-[12px] text-violet-800">{user.username}</div>
              <div className="text-[9px] text-stone-500 tracking-widest uppercase">root operator</div>
            </div>
            <div className="sm:hidden w-8 h-8 border border-violet-300 bg-violet-100/50 flex items-center justify-center text-xs font-bold text-violet-700">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={() => { logout(); navigate("/auth"); }}
              className="text-[10px] tracking-[0.25em] uppercase px-3 py-2 border border-red-400/60 text-red-700 hover:bg-red-100/40 transition"
            >
              Disconnect
            </button>
          </div>
        </div>
      </header>

      {/* ── Mission line ── */}
      <section className="relative z-10 px-4 sm:px-6 pt-8 pb-4 max-w-7xl mx-auto">
        <div className="text-[11px] tracking-[0.4em] text-violet-700 uppercase mb-3 font-mono">
          Sector · Administrare
        </div>
        <h1 className="text-[32px] sm:text-[44px] md:text-[52px] leading-[0.95] tracking-tight font-semibold font-mono text-stone-900">
          <span className="text-violet-700">Operator</span> control · inventory & support.
        </h1>
        <div className="mt-3 max-w-xl text-emerald-800/90 text-[12px] font-mono">
          <div>{greet}<span className="geo-caret" /></div>
        </div>
      </section>

      {/* ── Tabs ── */}
      <section className="relative z-10 px-4 sm:px-6 pb-6 max-w-7xl mx-auto">
        <div className="flex gap-1 bg-[#fbf6ec]/70 border border-emerald-300/60 rounded-sm p-1 w-fit font-mono">
          {(["users", "stats", "support"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 text-[11px] tracking-[0.3em] uppercase font-semibold transition-all ${
                activeTab === tab
                  ? "bg-violet-700 text-stone-50 shadow-[0_4px_14px_-6px_rgba(124,58,237,0.5)]"
                  : "text-stone-500 hover:text-violet-700 hover:bg-violet-50/60"
              }`}
            >
              {tab === "users" ? "› Utilizatori" : tab === "stats" ? "Statistici" : "Suport"}
            </button>
          ))}
        </div>
      </section>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-20">

        {/* ─── STATS TAB ─── */}
        {activeTab === "stats" && (
          <div className="space-y-8">
            <SectionRule label="Inventory" sub="distributie + recenti" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Total"       value={users.length}  accent="emerald" />
              <StatCard label="Admini"      value={adminCount}    accent="violet" />
              <StatCard label="Clienti"     value={clientCount}   accent="emerald" />
            </div>

            {/* Distribution */}
            <div className="relative bg-[#fbf6ec]/70 border border-emerald-300/50 rounded-sm p-6">
              <GraticuleTick pos="tl" /><GraticuleTick pos="tr" /><GraticuleTick pos="bl" /><GraticuleTick pos="br" />
              <div className="absolute -top-2 left-4 px-1.5 bg-[#fbf6ec] text-[10px] font-mono tracking-[0.4em] uppercase text-violet-700">DIST·01</div>
              <div className="font-mono">
                <div className="text-[11px] tracking-[0.3em] uppercase text-stone-500 mb-3">Distributie roluri</div>
                <div className="flex rounded-none overflow-hidden h-3 bg-stone-200 mb-3 border border-stone-300">
                  {users.length > 0 && (
                    <>
                      <div className="bg-violet-600 transition-all duration-700"   style={{ width: `${(adminCount / users.length) * 100}%` }} />
                      <div className="bg-emerald-600 transition-all duration-700"  style={{ width: `${(clientCount / users.length) * 100}%` }} />
                      <div className="bg-amber-500 transition-all duration-700"    style={{ width: `${(guestCount / users.length) * 100}%` }} />
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-[11px] text-stone-500 tracking-wider">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-violet-600 inline-block" /> ADMIN ({adminCount})</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-600 inline-block" /> CLIENT ({clientCount})</span>
                  {guestCount > 0 && (
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-500 inline-block" /> GUEST ({guestCount})</span>
                  )}
                </div>
              </div>
            </div>

            {/* Recent users */}
            <div className="relative bg-[#fbf6ec]/70 border border-emerald-300/50 rounded-sm p-6">
              <GraticuleTick pos="tl" /><GraticuleTick pos="tr" /><GraticuleTick pos="bl" /><GraticuleTick pos="br" />
              <div className="absolute -top-2 left-4 px-1.5 bg-[#fbf6ec] text-[10px] font-mono tracking-[0.4em] uppercase text-violet-700">LOG·02</div>
              <div className="font-mono">
                <div className="text-[11px] tracking-[0.3em] uppercase text-stone-500 mb-3">Ultimii inregistrati</div>
                <ul className="divide-y divide-emerald-300/50">
                  {[...users].reverse().slice(0, 6).map((u, i) => (
                    <li key={u.id} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-stone-400 tabular-nums w-6">#{String(i + 1).padStart(2, "0")}</span>
                        <div className="w-7 h-7 border border-stone-300 bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-700">
                          {u.username[0].toUpperCase()}
                        </div>
                        <span className="text-[13px] text-stone-900">{u.username}</span>
                      </div>
                      <RoleBadge role={u.role as UserRole} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ─── USERS TAB ─── */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <SectionRule label="Utilizatori" sub="cauta · filtru · CRUD" />

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between font-mono">
              <div className="flex flex-col sm:flex-row gap-2 flex-1">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-700 text-sm">⌕</span>
                  <input
                    type="text" placeholder="cauta utilizator..."
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-4 py-2.5 bg-[#fbf6ec]/80 border border-emerald-300/60 rounded-sm text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-violet-600 focus:border-violet-600 transition w-64"
                  />
                </div>
                <div className="flex gap-1">
                  {(["ALL", "ADMIN", "CLIENT"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setFilterRole(r)}
                      className={`px-3 py-2.5 text-[11px] tracking-[0.25em] uppercase font-semibold transition-all border ${
                        filterRole === r
                          ? "bg-violet-100 border-violet-500 text-violet-700"
                          : "border-emerald-300/60 text-stone-500 hover:text-violet-700 hover:border-violet-400"
                      }`}
                    >
                      {r === "ALL" ? "Toti" : r}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => openModal("create")}
                className="flex items-center gap-2 bg-violet-700 hover:bg-violet-800 text-stone-50 text-[11px] tracking-[0.3em] uppercase font-semibold px-4 py-2.5 rounded-sm transition-all shadow-[0_8px_24px_-12px_rgba(124,58,237,0.6)] shrink-0"
              >
                ＋ Utilizator nou
              </button>
            </div>

            <p className="text-[11px] text-stone-500 font-mono tracking-widest uppercase">
              {filtered.length} {filtered.length === 1 ? "utilizator" : "utilizatori"} gasiti
            </p>

            {/* Table */}
            <div className="relative bg-[#fbf6ec]/70 border border-emerald-300/50 rounded-sm overflow-hidden">
              <GraticuleTick pos="tl" /><GraticuleTick pos="tr" /><GraticuleTick pos="bl" /><GraticuleTick pos="br" />
              <div className="absolute -top-2 left-4 px-1.5 bg-[#fbf6ec] text-[10px] font-mono tracking-[0.4em] uppercase text-violet-700">USR·TBL</div>

              {loadingUsers ? (
                <div className="flex items-center justify-center py-20 gap-3 text-stone-500 font-mono">
                  <span className="animate-spin text-xl">⟳</span>
                  <span className="text-sm tracking-widest uppercase">se incarca...</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-stone-400 font-mono">
                  <span className="text-2xl mb-3">—</span>
                  <p className="text-sm tracking-widest uppercase">niciun utilizator gasit</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[640px] font-mono">
                    <thead>
                      <tr className="border-b border-emerald-300/60 bg-emerald-50/40">
                        <th className="text-left text-[10px] text-emerald-700 uppercase tracking-[0.3em] px-5 py-3 font-semibold">#</th>
                        <th className="text-left text-[10px] text-emerald-700 uppercase tracking-[0.3em] px-5 py-3 font-semibold">Utilizator</th>
                        <th className="text-left text-[10px] text-emerald-700 uppercase tracking-[0.3em] px-5 py-3 font-semibold">Rol</th>
                        <th className="text-right text-[10px] text-emerald-700 uppercase tracking-[0.3em] px-5 py-3 font-semibold">Actiuni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((u, idx) => (
                        <tr key={u.id} className="border-b border-emerald-300/30 last:border-0 hover:bg-violet-50/40 transition-colors">
                          <td className="px-5 py-3.5 text-stone-400 text-[11px] tabular-nums">{String(idx + 1).padStart(2, "0")}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 border border-stone-300 bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-700">
                                {u.username[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-stone-900 text-[13px]">{u.username}</p>
                                <p className="text-[10px] text-stone-400 tracking-wider">ID · {u.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5"><RoleBadge role={u.role as UserRole} /></td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-end gap-2">
                              <IconAction title="Schimba rol" tone="violet" onClick={() => openModal("role", u)}>↻</IconAction>
                              <IconAction title="Editeaza"     tone="blue"   onClick={() => openModal("edit", u)}>✎</IconAction>
                              <IconAction title="Sterge"       tone="red"    onClick={() => openModal("delete", u)}>✕</IconAction>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── SUPPORT TAB ─── */}
        {activeTab === "support" && (
          <div className="space-y-6">
            <SectionRule label="Suport" sub="sesiuni live · WS" />
            <div className="relative bg-[#fbf6ec]/70 border border-emerald-300/50 rounded-sm p-1 h-[640px]">
              <GraticuleTick pos="tl" /><GraticuleTick pos="tr" /><GraticuleTick pos="bl" /><GraticuleTick pos="br" />
              <AdminSupportPanel />
            </div>
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 flex items-center gap-3 px-4 sm:px-5 py-3 rounded-sm border shadow-2xl text-sm font-mono tracking-wider transition-all ${
          toast.type === "ok"
            ? "bg-emerald-50 border-emerald-500/60 text-emerald-800"
            : "bg-red-50 border-red-500/60 text-red-700"
        }`}>
          <span>{toast.type === "ok" ? "✓" : "⚠"}</span>{toast.msg}
        </div>
      )}

      {/* ──────────────── MODALS ──────────────── */}
      {modal.mode === "create" && (
        <Modal onClose={closeModal} title="Utilizator nou" code="USR·NEW">
          <div className="p-6 space-y-4">
            <FormField label="Nume utilizator">
              <input value={formUsername} onChange={(e) => setFormUsername(e.target.value)} placeholder="username" className={inputCls} />
            </FormField>
            <FormField label="Parola">
              <input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="min. 6 caractere" className={inputCls} />
            </FormField>
            {formError && <p className="text-[11px] text-red-700 font-mono">⚠ {formError}</p>}
          </div>
          <ModalFooter onCancel={closeModal} onConfirm={handleCreate} loading={formLoading} confirmLabel="Creeaza" tone="violet" />
        </Modal>
      )}

      {modal.mode === "edit" && (
        <Modal onClose={closeModal} title={`Editeaza · ${modal.user?.username}`} code="USR·EDT">
          <div className="p-6 space-y-4">
            <FormField label="Nume utilizator">
              <input value={formUsername} onChange={(e) => setFormUsername(e.target.value)} placeholder="username" className={inputCls} />
            </FormField>
            <FormField label="Parola noua (optional)">
              <input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="lasa gol pentru a pastra parola" className={inputCls} />
            </FormField>
            {formError && <p className="text-[11px] text-red-700 font-mono">⚠ {formError}</p>}
          </div>
          <ModalFooter onCancel={closeModal} onConfirm={handleEdit} loading={formLoading} confirmLabel="Salveaza" tone="blue" />
        </Modal>
      )}

      {modal.mode === "delete" && (
        <Modal onClose={closeModal} title="Confirmare stergere" code="USR·DEL">
          <div className="p-6 font-mono">
            <p className="text-stone-700 text-sm leading-relaxed">
              Esti sigur ca vrei sa stergi utilizatorul{" "}
              <span className="text-stone-900 font-semibold">„{modal.user?.username}"</span>?
              Aceasta actiune este ireversibila.
            </p>
            {formError && <p className="mt-3 text-[11px] text-red-700">⚠ {formError}</p>}
          </div>
          <ModalFooter onCancel={closeModal} onConfirm={handleDelete} loading={formLoading} confirmLabel="Sterge" tone="red" />
        </Modal>
      )}

      {modal.mode === "role" && (
        <Modal onClose={closeModal} title={`Schimba rol · ${modal.user?.username}`} code="USR·ROL">
          <div className="p-6 space-y-4 font-mono">
            <p className="text-stone-500 text-[11px] tracking-widest uppercase flex items-center gap-2">
              Rol curent · <RoleBadge role={modal.user!.role as UserRole} />
            </p>
            <FormField label="Rol nou">
              <div className="flex gap-2 mt-1">
                {(["CLIENT", "ADMIN"] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setFormRole(r)}
                    className={`flex-1 py-3 text-sm tracking-[0.25em] uppercase font-semibold border transition-all ${
                      formRole === r
                        ? r === "ADMIN"
                          ? "bg-violet-100 border-violet-600 text-violet-700"
                          : "bg-emerald-100 border-emerald-600 text-emerald-800"
                        : "border-stone-300 text-stone-500 hover:text-stone-700 hover:border-stone-400"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </FormField>
            {formError && <p className="text-[11px] text-red-700">⚠ {formError}</p>}
          </div>
          <ModalFooter onCancel={closeModal} onConfirm={handleChangeRole} loading={formLoading} confirmLabel="Aplica" tone="violet" disabled={formRole === modal.user?.role} />
        </Modal>
      )}
    </div>
  );
}

/* ── helpers ──────────────────────────────────────────────────────────── */

const inputCls =
  "w-full bg-[#fbf6ec]/80 border border-emerald-300/60 rounded-sm px-3 py-2.5 text-stone-900 text-sm placeholder-stone-400 font-mono focus:outline-none focus:ring-1 focus:ring-violet-600 focus:border-violet-600 transition";

function RibbonStat({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[9px] tracking-[0.3em] text-violet-700/70">{k}</span>
      <span className="text-[12px] text-violet-800 tabular-nums">{v}</span>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number | string; accent: "emerald" | "violet" }) {
  const tone = accent === "violet"
    ? "border-violet-300 hover:border-violet-500 text-violet-800"
    : "border-emerald-300 hover:border-emerald-500 text-emerald-800";
  return (
    <div className={`relative bg-[#fbf6ec]/70 border ${tone} transition-colors p-5 font-mono`}>
      <GraticuleTick pos="tl" /><GraticuleTick pos="tr" /><GraticuleTick pos="bl" /><GraticuleTick pos="br" />
      <p className={`text-3xl font-semibold tabular-nums leading-none`}>{value}</p>
      <p className="text-[10px] text-stone-500 uppercase tracking-[0.3em] mt-3">{label}</p>
      <div className="mt-3 h-px bg-gradient-to-r from-current/40 via-current/10 to-transparent opacity-30" />
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  if (role === "ADMIN") return (
    <span className="inline-flex items-center text-[10px] tracking-[0.3em] uppercase px-2 py-0.5 bg-violet-100 border border-violet-400 text-violet-700 font-mono font-semibold">ADMIN</span>
  );
  if (role === "GUEST") return (
    <span className="inline-flex items-center text-[10px] tracking-[0.3em] uppercase px-2 py-0.5 bg-amber-100 border border-amber-400 text-amber-800 font-mono font-semibold">GUEST</span>
  );
  return (
    <span className="inline-flex items-center text-[10px] tracking-[0.3em] uppercase px-2 py-0.5 bg-emerald-100 border border-emerald-400 text-emerald-800 font-mono font-semibold">CLIENT</span>
  );
}

function IconAction({ children, title, onClick, tone }: { children: React.ReactNode; title: string; onClick: () => void; tone: "violet" | "blue" | "red" }) {
  const cls = {
    violet: "border-stone-300 text-stone-500 hover:text-violet-700 hover:border-violet-500",
    blue:   "border-stone-300 text-stone-500 hover:text-blue-700 hover:border-blue-500",
    red:    "border-stone-300 text-stone-500 hover:text-red-700 hover:border-red-500",
  }[tone];
  return (
    <button onClick={onClick} title={title} className={`p-1.5 rounded-sm border transition-all text-xs ${cls}`}>
      {children}
    </button>
  );
}

function Modal({ children, onClose, title, code }: { children: React.ReactNode; onClose: () => void; title: string; code: string }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{ background: "rgba(40,30,10,0.32)" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-md bg-[#fbf6ec] border border-emerald-300/60 rounded-sm shadow-2xl overflow-hidden font-mono">
        <GraticuleTick pos="tl" /><GraticuleTick pos="tr" /><GraticuleTick pos="bl" /><GraticuleTick pos="br" />
        <div className="absolute -top-2 left-4 px-1.5 bg-[#fbf6ec] text-[10px] tracking-[0.4em] uppercase text-violet-700">{code}</div>
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-300/50">
          <h3 className="text-stone-900 text-sm font-semibold tracking-wider">{title}</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 transition-colors text-lg leading-none">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalFooter({ onCancel, onConfirm, loading, confirmLabel, tone, disabled = false }: { onCancel: () => void; onConfirm: () => void; loading: boolean; confirmLabel: string; tone: "violet" | "blue" | "red"; disabled?: boolean }) {
  const conf = {
    violet: "bg-violet-700 hover:bg-violet-800",
    blue:   "bg-blue-700 hover:bg-blue-800",
    red:    "bg-red-700 hover:bg-red-800",
  }[tone];
  return (
    <div className="flex gap-2 px-6 pb-6 font-mono">
      <button onClick={onCancel} className="flex-1 py-2.5 rounded-sm border border-stone-300 text-stone-600 hover:text-stone-900 hover:border-stone-400 text-[11px] tracking-[0.3em] uppercase font-semibold transition-all">
        Anuleaza
      </button>
      <button onClick={onConfirm} disabled={loading || disabled} className={`flex-1 py-2.5 rounded-sm ${conf} disabled:opacity-50 text-stone-50 text-[11px] tracking-[0.3em] uppercase font-semibold transition-all shadow-[0_6px_18px_-8px_rgba(0,0,0,0.4)]`}>
        {loading ? "◌ ..." : confirmLabel}
      </button>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] text-emerald-700 uppercase tracking-[0.3em] mb-1.5 font-mono font-medium">{label}</label>
      {children}
    </div>
  );
}
