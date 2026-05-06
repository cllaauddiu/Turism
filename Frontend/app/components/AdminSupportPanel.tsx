import { useEffect, useRef, useState } from "react";
import { supportApi, type SupportMessage, type SupportSessionSummary } from "~/lib/api";
import { SupportSocket, type SessionEvent } from "~/lib/supportSocket";
import { useAuth } from "~/hooks/useAuth";

export default function AdminSupportPanel() {
  const { user } = useAuth();
  const adminUsername = user?.username ?? "";

  const [sessions, setSessions] = useState<SupportSessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState("");
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<SupportSocket | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Trebuie sa fii autentificat ca admin.");
      setConnecting(false);
      return;
    }

    let active = true;
    const socket = new SupportSocket(token);
    socketRef.current = socket;

    (async () => {
      try {
        await socket.connect();
        if (!active) return;

        socket.subscribeToAdminSessions((event: SessionEvent) => {
          if (!active) return;
          setSessions((prev) => upsertSession(prev, event));
        });

        const list = await supportApi.listSessions();
        if (!active) return;
        setSessions(list);
      } catch (err) {
        if (active) setError("Nu am putut conecta WebSocket-ul.");
      } finally {
        if (active) setConnecting(false);
      }
    })();

    return () => {
      active = false;
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  function upsertSession(list: SupportSessionSummary[], event: SessionEvent): SupportSessionSummary[] {
    const idx = list.findIndex((s) => s.id === event.session.id);
    if (idx === -1) return [event.session, ...list];
    const next = [...list];
    next[idx] = event.session;
    next.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    return next;
  }

  async function openSession(sessionId: string) {
    if (!socketRef.current) return;
    if (activeSessionId) socketRef.current.unsubscribe(`/topic/support/${activeSessionId}`);

    setActiveSessionId(sessionId);
    setMessages([]);

    try {
      const history = await supportApi.getMessages(sessionId);
      setMessages(history);
    } catch {
      setError("Nu am putut incarca istoricul.");
    }

    socketRef.current.subscribeToSession(sessionId, (payload) => {
      if ("type" in payload) {
        // session event
        return;
      }
      setMessages((prev) =>
        prev.some((m) => m.id === payload.id) ? prev : [...prev, payload]
      );
    });
  }

  function sendReply() {
    const text = input.trim();
    if (!text || !activeSessionId || !socketRef.current) return;
    socketRef.current.sendMessage(activeSessionId, text);
    setInput("");
  }

  function closeSession() {
    if (!activeSessionId || !socketRef.current) return;
    socketRef.current.closeSession(activeSessionId);
  }

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;
  const isClosed = activeSession?.status === "CLOSED";

  if (connecting) {
    return <div className="text-center text-stone-500 py-8 font-mono text-sm">Se conecteaza la WebSocket...</div>;
  }

  if (error) {
    return <div className="text-center text-red-700 py-8 font-mono text-sm">{error}</div>;
  }

  return (
    <div className="bg-[#fbf6ec]/80 border border-emerald-300/50 rounded-sm-sm overflow-hidden grid grid-cols-1 md:grid-cols-[280px_1fr] h-full font-mono">
      {/* ── Sessions list ── */}
      <aside className="border-r border-emerald-300/50 overflow-y-auto bg-[#f4efe6]/60">
        <div className="px-4 py-3 border-b border-emerald-300/50 sticky top-0 bg-[#f4efe6]/95 backdrop-blur">
          <h3 className="text-[10px] uppercase tracking-[0.3em] text-violet-700 font-semibold">Sesiuni Suport</h3>
          <p className="text-[10px] text-stone-500 mt-0.5">{sessions.length} total · live</p>
        </div>
        {sessions.length === 0 ? (
          <div className="px-4 py-8 text-center text-stone-500 text-sm">Niciun client nu a deschis o conversatie.</div>
        ) : (
          <ul>
            {sessions.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => openSession(s.id)}
                  className={`w-full text-left px-4 py-3 border-b border-emerald-300/30 transition-colors ${
                    activeSessionId === s.id ? "bg-violet-100 border-l-2 border-l-violet-600" : "hover:bg-violet-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-stone-900 truncate">{s.clientUsername}</span>
                    {s.status === "CLOSED" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-stone-200 text-stone-500 uppercase">inchis</span>
                    )}
                    {s.status === "OPEN" && (
                      <span className="w-2 h-2 rounded-sm-full bg-emerald-500" />
                    )}
                  </div>
                  <div className="text-[11px] text-stone-500 truncate mt-1">
                    {s.lastMessagePreview || "(niciun mesaj inca)"}
                  </div>
                  <div className="text-[10px] text-stone-500 mt-1">
                    {s.messageCount} mesaje · {new Date(s.lastMessageAt).toLocaleTimeString()}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* ── Chat panel ── */}
      <section className="flex flex-col">
        {!activeSession ? (
          <div className="flex-1 flex items-center justify-center text-stone-500 font-mono text-sm">
            Selecteaza o sesiune din stanga.
          </div>
        ) : (
          <>
            <header className="px-5 py-3 border-b border-emerald-300/50 bg-[#f4efe6]/70 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-stone-900">{activeSession.clientUsername}</div>
                <div className="text-[10px] text-stone-500 font-mono">#{activeSession.id.slice(0, 8)} · {activeSession.status}</div>
              </div>
              {!isClosed && (
                <button
                  onClick={closeSession}
                  className="text-xs px-3 py-1.5 rounded-sm border border-red-300/60 text-red-700 hover:bg-red-100/30"
                >
                  Inchide sesiunea
                </button>
              )}
            </header>

            <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#fbf6ec]/40">
              {messages.length === 0 && (
                <div className="text-center text-stone-500 text-xs font-mono py-8">
                  Niciun mesaj inca. Astepti clientul.
                </div>
              )}
              {messages.map((m) => {
                const mine = m.senderUsername === adminUsername;
                return (
                  <div
                    key={m.id}
                    className={`max-w-[80%] rounded-sm-sm border px-3 py-2 text-sm ${
                      mine
                        ? "ml-auto bg-violet-100 border-violet-400/60 text-violet-800"
                        : "mr-auto bg-stone-50 border-stone-300 text-stone-800"
                    }`}
                  >
                    <div className="text-[10px] mb-1 text-stone-500">
                      {m.senderRole === "ADMIN" ? `Admin (${m.senderUsername})` : `Client (${m.senderUsername})`} ·{" "}
                      {new Date(m.createdAt).toLocaleTimeString()}
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                  </div>
                );
              })}
            </div>

            {!isClosed && (
              <div className="border-t border-emerald-300/50 bg-[#f4efe6]/70 p-3">
                <div className="flex items-center gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendReply();
                      }
                    }}
                    placeholder="Raspunde clientului..."
                    className="flex-1 resize-none h-12 sm:h-16 rounded-sm-sm bg-stone-50 border border-stone-300 text-stone-900 text-sm px-3 py-2 outline-none focus:border-violet-500"
                  />
                  <button
                    onClick={sendReply}
                    disabled={!input.trim()}
                    className="h-12 sm:h-16 px-4 rounded-sm-sm bg-violet-600 hover:bg-violet-500 text-stone-900 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Trimite
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
