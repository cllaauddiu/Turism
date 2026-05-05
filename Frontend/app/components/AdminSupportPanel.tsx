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
    return <div className="text-center text-gray-500 py-8 font-mono text-sm">Se conecteaza la WebSocket...</div>;
  }

  if (error) {
    return <div className="text-center text-red-400 py-8 font-mono text-sm">{error}</div>;
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden grid grid-cols-1 md:grid-cols-[280px_1fr] h-[600px]">
      {/* ── Sessions list ── */}
      <aside className="border-r border-gray-800 overflow-y-auto bg-gray-950/50">
        <div className="px-4 py-3 border-b border-gray-800 sticky top-0 bg-gray-950/95 backdrop-blur">
          <h3 className="text-xs uppercase tracking-widest text-gray-500">Sesiuni Suport</h3>
          <p className="text-[10px] text-gray-600 mt-0.5">{sessions.length} total · live</p>
        </div>
        {sessions.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-600 text-sm">Niciun client nu a deschis o conversatie.</div>
        ) : (
          <ul>
            {sessions.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => openSession(s.id)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-800 transition-colors ${
                    activeSessionId === s.id ? "bg-violet-900/30" : "hover:bg-gray-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-white truncate">{s.clientUsername}</span>
                    {s.status === "CLOSED" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 uppercase">inchis</span>
                    )}
                    {s.status === "OPEN" && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                  </div>
                  <div className="text-[11px] text-gray-500 truncate mt-1">
                    {s.lastMessagePreview || "(niciun mesaj inca)"}
                  </div>
                  <div className="text-[10px] text-gray-600 mt-1">
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
          <div className="flex-1 flex items-center justify-center text-gray-600 font-mono text-sm">
            Selecteaza o sesiune din stanga.
          </div>
        ) : (
          <>
            <header className="px-5 py-3 border-b border-gray-800 bg-gray-950/80 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white">{activeSession.clientUsername}</div>
                <div className="text-[10px] text-gray-500 font-mono">#{activeSession.id.slice(0, 8)} · {activeSession.status}</div>
              </div>
              {!isClosed && (
                <button
                  onClick={closeSession}
                  className="text-xs px-3 py-1.5 rounded border border-red-900/60 text-red-400 hover:bg-red-900/30"
                >
                  Inchide sesiunea
                </button>
              )}
            </header>

            <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-950/40">
              {messages.length === 0 && (
                <div className="text-center text-gray-600 text-xs font-mono py-8">
                  Niciun mesaj inca. Astepti clientul.
                </div>
              )}
              {messages.map((m) => {
                const mine = m.senderUsername === adminUsername;
                return (
                  <div
                    key={m.id}
                    className={`max-w-[80%] rounded-xl border px-3 py-2 text-sm ${
                      mine
                        ? "ml-auto bg-violet-900/30 border-violet-700/50 text-violet-100"
                        : "mr-auto bg-gray-900 border-gray-800 text-gray-200"
                    }`}
                  >
                    <div className="text-[10px] mb-1 text-gray-500">
                      {m.senderRole === "ADMIN" ? `Admin (${m.senderUsername})` : `Client (${m.senderUsername})`} ·{" "}
                      {new Date(m.createdAt).toLocaleTimeString()}
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                  </div>
                );
              })}
            </div>

            {!isClosed && (
              <div className="border-t border-gray-800 bg-gray-950/80 p-3">
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
                    className="flex-1 resize-none h-12 sm:h-16 rounded-lg bg-gray-900 border border-gray-800 text-gray-100 text-sm px-3 py-2 outline-none focus:border-violet-500"
                  />
                  <button
                    onClick={sendReply}
                    disabled={!input.trim()}
                    className="h-12 sm:h-16 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed"
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
