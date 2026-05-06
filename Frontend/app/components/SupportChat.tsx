import { useEffect, useRef, useState } from "react";
import { supportApi, type SupportMessage, type SupportSessionSummary } from "~/lib/api";
import { SupportSocket, type SessionEvent } from "~/lib/supportSocket";
import { useAuth } from "~/hooks/useAuth";

export default function SupportChat() {
  const { user } = useAuth();
  const username = user?.username ?? "";

  const [session, setSession] = useState<SupportSessionSummary | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState("");
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<SupportSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Trebuie sa fii autentificat ca sa vorbesti cu adminul.");
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

        socket.subscribeToMyEvents(username, (event: SessionEvent) => {
          if (!active) return;
          setSession(event.session);
          if (event.type === "CREATED" || event.type === "UPDATED") {
            socket.subscribeToSession(event.session.id, handleSessionMessage);
          }
        });

        const existing = await supportApi.getMyActiveSession();
        if (!active) return;
        if (existing) {
          setSession(existing);
          const history = await supportApi.getMessages(existing.id);
          if (!active) return;
          setMessages(history);
          socket.subscribeToSession(existing.id, handleSessionMessage);
        }
      } catch (err: unknown) {
        if (!active) return;
        const status =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { status?: number } }).response?.status
            : undefined;
        if (status === 401) {
          setError("Sesiunea a expirat. Reconecteaza-te.");
        } else {
          setError("Nu am putut conecta la suport. Verifica conexiunea sau autentificarea.");
        }
        // eslint-disable-next-line no-console
        console.error("Support chat connect failed:", err);
      } finally {
        if (active) setConnecting(false);
      }
    })();

    return () => {
      active = false;
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSessionMessage(payload: SupportMessage | SessionEvent) {
    if ("type" in payload) {
      setSession(payload.session);
      if (payload.type === "CLOSED") {
        // session closed; nothing more to do
      }
      return;
    }
    setMessages((prev) =>
      prev.some((m) => m.id === payload.id) ? prev : [...prev, payload]
    );
  }

  function startConversation() {
    socketRef.current?.startSession();
  }

  function sendMessage() {
    const text = input.trim();
    if (!text || !session || !socketRef.current) return;
    socketRef.current.sendMessage(session.id, text);
    setInput("");
  }

  function closeConversation() {
    if (!session || !socketRef.current) return;
    socketRef.current.closeSession(session.id);
  }

  if (connecting) {
    return (
      <div className="flex-1 flex items-center justify-center text-stone-500 font-mono text-sm">
        Se conecteaza la suport...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-700 font-mono text-sm p-6 text-center">
        {error}
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-5 p-6 text-center">
        <div className="text-[10px] tracking-[0.4em] uppercase text-emerald-700 font-mono">◈ canal suport · admin online</div>
        <div className="text-emerald-700 font-mono text-sm max-w-sm">
          Vorbeste direct cu un administrator GeoAtlas. Trimite o intrebare si un admin online iti va raspunde in timp real.
        </div>
        <button
          onClick={startConversation}
          className="px-5 py-2.5 rounded-sm border border-emerald-500/60 bg-emerald-100/40 text-emerald-700 hover:bg-emerald-700 hover:text-stone-50 font-mono text-[11px] tracking-[0.3em] uppercase font-semibold transition-all"
        >
          Incepe conversatia
        </button>
      </div>
    );
  }

  const isClosed = session.status === "CLOSED";

  return (
    <>
      <div className="px-4 py-2 border-b border-emerald-200/40 bg-stone-100/80 flex items-center justify-between">
        <div className="font-mono text-xs text-stone-500">
          Sesiune <span className="text-emerald-700">#{session.id.slice(0, 8)}</span>
          {isClosed && <span className="ml-2 text-red-700">(inchisa)</span>}
        </div>
        {!isClosed && (
          <button
            onClick={closeConversation}
            className="text-xs text-stone-500 hover:text-red-700 font-mono"
          >
            inchide
          </button>
        )}
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-stone-500 font-mono text-xs py-8">
            Astepti raspunsul unui administrator. Poti scrie deja primul mesaj.
          </div>
        )}
        {messages.map((m) => {
          const mine = m.senderUsername === username;
          return (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-sm border px-3 py-2 font-mono text-sm ${
                mine
                  ? "ml-auto bg-emerald-100/30 border-emerald-400/50 text-emerald-800"
                  : "mr-auto bg-stone-50/90 border-emerald-200/40 text-stone-800"
              }`}
            >
              <div className="text-[10px] mb-1 text-stone-500">
                {m.senderRole === "ADMIN" ? "Admin" : "Tu"} · {new Date(m.createdAt).toLocaleTimeString()}
              </div>
              <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
            </div>
          );
        })}
      </div>

      {!isClosed && (
        <div className="border-t border-emerald-200/40 bg-stone-100/90 p-3">
          <div className="flex items-center gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Scrie un mesaj catre admin..."
              className="flex-1 resize-none h-12 sm:h-20 rounded-sm bg-stone-50 border border-emerald-200/40 text-stone-900 font-mono text-sm px-3 py-2 outline-none focus:border-emerald-600"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="h-12 sm:h-20 px-3 sm:px-4 rounded-sm border border-emerald-500/50 text-emerald-700 hover:bg-emerald-100/20 disabled:opacity-40 disabled:cursor-not-allowed font-mono text-sm"
            >
              Trimite
            </button>
          </div>
        </div>
      )}
    </>
  );
}
