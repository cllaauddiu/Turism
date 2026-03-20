import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/hooks/useAuth";
import { usersApi, type UserDTO, type UserRole } from "~/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────
type ModalMode = "create" | "edit" | "delete" | "role" | null;

interface ModalState {
  mode: ModalMode;
  user?: UserDTO;
}

// ── Small reusable components ──────────────────────────────────────────────

function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: string; color: string }) {
  return (
    <div className={`bg-gray-900 border ${color} rounded-xl p-5 flex items-center gap-4`}>
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-gray-500 uppercase tracking-widest mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function Badge({ role }: { role: UserRole }) {
  return role === "ADMIN" ? (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-violet-900/50 border border-violet-700/50 text-violet-300 font-mono font-semibold">
      ⚡ ADMIN
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-900/50 border border-emerald-700/50 text-emerald-300 font-mono font-semibold">
      👤 CLIENT
    </span>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, icon, onClose }: { title: string; icon: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <h3 className="text-white font-semibold text-sm">{title}</h3>
      </div>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors text-lg leading-none">✕</button>
    </div>
  );
}

// ── Input field ────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition";

// ── Main admin dashboard ───────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<"ALL" | UserRole>("ALL");
  const [modal, setModal] = useState<ModalState>({ mode: null });
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "stats">("users");

  // form states
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("CLIENT");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate("/auth");
  }, [isAuthenticated, navigate]);

  const showToast = (msg: string, type: "ok" | "err") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await usersApi.getAll();
      setUsers(data);
    } catch {
      showToast("Eroare la încărcarea utilizatorilor.", "err");
    } finally {
      setLoading(false);
    }
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

  // ── CRUD handlers ─────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!formUsername.trim() || formUsername.length < 3) { setFormError("Minim 3 caractere pentru username."); return; }
    if (!formPassword || formPassword.length < 6) { setFormError("Parola trebuie să aibă minim 6 caractere."); return; }
    setFormLoading(true); setFormError("");
    try {
      await usersApi.create({ username: formUsername.trim(), password: formPassword });
      showToast(`Utilizatorul „${formUsername}" a fost creat.`, "ok");
      closeModal();
      fetchUsers();
    } catch (e: any) {
      setFormError(e?.response?.data?.message ?? "Eroare la creare.");
    } finally { setFormLoading(false); }
  };

  const handleEdit = async () => {
    if (!formUsername.trim() || formUsername.length < 3) { setFormError("Minim 3 caractere pentru username."); return; }
    if (formPassword && formPassword.length < 6) { setFormError("Parola trebuie să aibă minim 6 caractere."); return; }
    setFormLoading(true); setFormError("");
    try {
      await usersApi.update(modal.user!.id, {
        username: formUsername.trim(),
        ...(formPassword ? { password: formPassword } : {}),
      });
      showToast(`Utilizatorul a fost actualizat.`, "ok");
      closeModal();
      fetchUsers();
    } catch (e: any) {
      setFormError(e?.response?.data?.message ?? "Eroare la actualizare.");
    } finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      await usersApi.delete(modal.user!.id);
      showToast(`Utilizatorul „${modal.user!.username}" a fost șters.`, "ok");
      closeModal();
      fetchUsers();
    } catch (e: any) {
      setFormError(e?.response?.data?.message ?? "Eroare la ștergere.");
    } finally { setFormLoading(false); }
  };

  const handleChangeRole = async () => {
    setFormLoading(true); setFormError("");
    try {
      await usersApi.changeRole(modal.user!.id, { role: formRole });
      showToast(`Rolul a fost schimbat în ${formRole}.`, "ok");
      closeModal();
      fetchUsers();
    } catch (e: any) {
      setFormError(e?.response?.data?.message ?? "Eroare la schimbarea rolului.");
    } finally { setFormLoading(false); }
  };

  // ── Derived data ───────────────────────────────────────────────────────
  const filtered = users.filter((u) => {
    const matchSearch = u.username.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "ALL" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const clientCount = users.filter((u) => u.role === "CLIENT").length;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-30 bg-gray-950/90 backdrop-blur border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-700/50 flex items-center justify-center text-sm">⚡</div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">GeoAtlas Admin</h1>
            <p className="text-xs text-gray-600">Panou de administrare</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-white">{user.username}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-violet-900/50 border border-violet-700/50 text-violet-300 font-semibold">
            ADMIN
          </span>
          <button
            onClick={() => { logout(); navigate("/auth"); }}
            className="text-xs px-3 py-1.5 rounded border border-red-900/60 text-red-400 hover:bg-red-900/30 hover:border-red-600 transition-all"
          >
            Deconectare
          </button>
        </div>
      </nav>

      {/* ── Page body ── */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900/60 border border-gray-800 rounded-xl p-1 w-fit">
          {(["users", "stats"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === t
                  ? "bg-violet-600 text-white shadow"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {t === "users" ? "👥 Utilizatori" : "📊 Statistici"}
            </button>
          ))}
        </div>

        {/* ── STATS TAB ── */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Total utilizatori" value={users.length} icon="👥" color="border-gray-800" />
              <StatCard label="Administratori" value={adminCount} icon="⚡" color="border-violet-800/50" />
              <StatCard label="Clienți" value={clientCount} icon="👤" color="border-emerald-800/50" />
            </div>

            {/* Role distribution bar */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Distribuție roluri</h3>
              <div className="flex rounded-full overflow-hidden h-4 bg-gray-800 mb-3">
                {users.length > 0 && (
                  <>
                    <div
                      className="bg-violet-600 transition-all duration-700"
                      style={{ width: `${(adminCount / users.length) * 100}%` }}
                    />
                    <div
                      className="bg-emerald-600 transition-all duration-700"
                      style={{ width: `${(clientCount / users.length) * 100}%` }}
                    />
                  </>
                )}
              </div>
              <div className="flex gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-violet-600 inline-block" /> ADMIN ({adminCount})</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" /> CLIENT ({clientCount})</span>
              </div>
            </div>

            {/* Recent users */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Ultimii utilizatori înregistrați</h3>
              <div className="space-y-2">
                {[...users].reverse().slice(0, 5).map((u) => (
                  <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xs font-bold text-gray-400">
                        {u.username[0].toUpperCase()}
                      </div>
                      <span className="text-sm text-white">{u.username}</span>
                    </div>
                    <Badge role={u.role as UserRole} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── USERS TAB ── */}
        {activeTab === "users" && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-2 flex-1">
                {/* Search */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-sm">🔍</span>
                  <input
                    type="text"
                    placeholder="Caută utilizator..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition w-56"
                  />
                </div>
                {/* Role filter */}
                <div className="flex gap-1">
                  {(["ALL", "ADMIN", "CLIENT"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setFilterRole(r)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                        filterRole === r
                          ? "bg-violet-600/20 border-violet-600/50 text-violet-300"
                          : "border-gray-800 text-gray-600 hover:text-gray-400 hover:border-gray-700"
                      }`}
                    >
                      {r === "ALL" ? "Toți" : r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Create button */}
              <button
                onClick={() => openModal("create")}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all shadow hover:shadow-violet-900/40 shrink-0"
              >
                ＋ Utilizator nou
              </button>
            </div>

            {/* Results count */}
            <p className="text-xs text-gray-600">
              {filtered.length} {filtered.length === 1 ? "utilizator" : "utilizatori"} găsiți
            </p>

            {/* Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-20 gap-3 text-gray-600">
                  <span className="animate-spin text-xl">⟳</span>
                  <span className="text-sm">Se încarcă...</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-700">
                  <span className="text-4xl mb-3">🔍</span>
                  <p className="text-sm">Niciun utilizator găsit.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 bg-gray-950/50">
                      <th className="text-left text-xs text-gray-600 uppercase tracking-widest px-5 py-3 font-medium">#</th>
                      <th className="text-left text-xs text-gray-600 uppercase tracking-widest px-5 py-3 font-medium">Utilizator</th>
                      <th className="text-left text-xs text-gray-600 uppercase tracking-widest px-5 py-3 font-medium">Rol</th>
                      <th className="text-right text-xs text-gray-600 uppercase tracking-widest px-5 py-3 font-medium">Acțiuni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u, idx) => (
                      <tr
                        key={u.id}
                        className="border-b border-gray-800/60 last:border-0 hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="px-5 py-3.5 text-gray-600 font-mono text-xs">{String(idx + 1).padStart(2, "0")}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xs font-bold text-gray-300 shrink-0">
                              {u.username[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-white">{u.username}</p>
                              <p className="text-xs text-gray-600">ID: {u.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge role={u.role as UserRole} />
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openModal("role", u)}
                              title="Schimbă rol"
                              className="p-1.5 rounded-lg border border-gray-700 text-gray-500 hover:text-violet-400 hover:border-violet-700/60 transition-all text-xs"
                            >
                              🔄
                            </button>
                            <button
                              onClick={() => openModal("edit", u)}
                              title="Editează"
                              className="p-1.5 rounded-lg border border-gray-700 text-gray-500 hover:text-blue-400 hover:border-blue-700/60 transition-all text-xs"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => openModal("delete", u)}
                              title="Șterge"
                              className="p-1.5 rounded-lg border border-gray-700 text-gray-500 hover:text-red-400 hover:border-red-700/60 transition-all text-xs"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── Toast notification ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl text-sm font-medium transition-all ${
          toast.type === "ok"
            ? "bg-emerald-950 border-emerald-700/60 text-emerald-300"
            : "bg-red-950 border-red-700/60 text-red-300"
        }`}>
          <span>{toast.type === "ok" ? "✓" : "⚠"}</span>
          {toast.msg}
        </div>
      )}

      {/* ──────────────────── MODALS ──────────────────── */}

      {/* CREATE */}
      {modal.mode === "create" && (
        <Modal onClose={closeModal}>
          <ModalHeader title="Utilizator nou" icon="➕" onClose={closeModal} />
          <div className="p-6 space-y-4">
            <Field label="Nume utilizator">
              <input value={formUsername} onChange={(e) => setFormUsername(e.target.value)} placeholder="username" className={inputCls} />
            </Field>
            <Field label="Parolă">
              <input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="min. 6 caractere" className={inputCls} />
            </Field>
            {formError && <p className="text-xs text-red-400">⚠ {formError}</p>}
          </div>
          <div className="flex gap-2 px-6 pb-6">
            <button onClick={closeModal} className="flex-1 py-2.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white text-sm transition-all">Anulează</button>
            <button onClick={handleCreate} disabled={formLoading} className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold transition-all">
              {formLoading ? "Se creează..." : "Creează"}
            </button>
          </div>
        </Modal>
      )}

      {/* EDIT */}
      {modal.mode === "edit" && (
        <Modal onClose={closeModal}>
          <ModalHeader title={`Editează — ${modal.user?.username}`} icon="✏️" onClose={closeModal} />
          <div className="p-6 space-y-4">
            <Field label="Nume utilizator">
              <input value={formUsername} onChange={(e) => setFormUsername(e.target.value)} placeholder="username" className={inputCls} />
            </Field>
            <Field label="Parolă nouă (opțional)">
              <input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="Lasă gol pentru a păstra parola" className={inputCls} />
            </Field>
            {formError && <p className="text-xs text-red-400">⚠ {formError}</p>}
          </div>
          <div className="flex gap-2 px-6 pb-6">
            <button onClick={closeModal} className="flex-1 py-2.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white text-sm transition-all">Anulează</button>
            <button onClick={handleEdit} disabled={formLoading} className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold transition-all">
              {formLoading ? "Se salvează..." : "Salvează"}
            </button>
          </div>
        </Modal>
      )}

      {/* DELETE */}
      {modal.mode === "delete" && (
        <Modal onClose={closeModal}>
          <ModalHeader title="Confirmare ștergere" icon="🗑️" onClose={closeModal} />
          <div className="p-6">
            <p className="text-gray-400 text-sm">
              Ești sigur că vrei să ștergi utilizatorul{" "}
              <span className="text-white font-semibold">„{modal.user?.username}"</span>?
              Această acțiune este ireversibilă.
            </p>
            {formError && <p className="mt-3 text-xs text-red-400">⚠ {formError}</p>}
          </div>
          <div className="flex gap-2 px-6 pb-6">
            <button onClick={closeModal} className="flex-1 py-2.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white text-sm transition-all">Anulează</button>
            <button onClick={handleDelete} disabled={formLoading} className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold transition-all">
              {formLoading ? "Se șterge..." : "Șterge"}
            </button>
          </div>
        </Modal>
      )}

      {/* CHANGE ROLE */}
      {modal.mode === "role" && (
        <Modal onClose={closeModal}>
          <ModalHeader title={`Schimbă rol — ${modal.user?.username}`} icon="🔄" onClose={closeModal} />
          <div className="p-6 space-y-4">
            <p className="text-gray-500 text-xs">Rol curent: <Badge role={modal.user!.role as UserRole} /></p>
            <Field label="Rol nou">
              <div className="flex gap-2 mt-1">
                {(["CLIENT", "ADMIN"] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setFormRole(r)}
                    className={`flex-1 py-3 rounded-lg border text-sm font-semibold transition-all ${
                      formRole === r
                        ? r === "ADMIN"
                          ? "bg-violet-600/20 border-violet-600 text-violet-300"
                          : "bg-emerald-600/20 border-emerald-600 text-emerald-300"
                        : "border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600"
                    }`}
                  >
                    {r === "ADMIN" ? "⚡ ADMIN" : "👤 CLIENT"}
                  </button>
                ))}
              </div>
            </Field>
            {formError && <p className="text-xs text-red-400">⚠ {formError}</p>}
          </div>
          <div className="flex gap-2 px-6 pb-6">
            <button onClick={closeModal} className="flex-1 py-2.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white text-sm transition-all">Anulează</button>
            <button
              onClick={handleChangeRole}
              disabled={formLoading || formRole === modal.user?.role}
              className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold transition-all"
            >
              {formLoading ? "Se aplică..." : "Aplică"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

