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
      <div className="flex-1 flex items-center justify-center text-cyan-700 font-mono text-sm">
        Se conecteaza la suport...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-400 font-mono text-sm p-6 text-center">
        {error}
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-cyan-200 font-mono text-sm max-w-sm">
          Vorbeste direct cu un administrator GeoAtlas. Trimite o intrebare si un admin online iti va raspunde in timp real.
        </div>
        <button
          onClick={startConversation}
          className="px-5 py-2.5 rounded-lg border border-cyan-600/60 bg-cyan-900/20 text-cyan-200 hover:bg-cyan-900/40 font-mono text-sm tracking-wider"
        >
          Incepe conversatia
        </button>
      </div>
    );
  }

  const isClosed = session.status === "CLOSED";

  return (
    <>
      <div className="px-4 py-2 border-b border-cyan-900/40 bg-gray-950/80 flex items-center justify-between">
        <div className="font-mono text-xs text-cyan-700">
          Sesiune <span className="text-cyan-300">#{session.id.slice(0, 8)}</span>
          {isClosed && <span className="ml-2 text-red-400">(inchisa)</span>}
        </div>
        {!isClosed && (
          <button
            onClick={closeConversation}
            className="text-xs text-gray-500 hover:text-red-400 font-mono"
          >
            inchide
          </button>
        )}
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-cyan-800 font-mono text-xs py-8">
            Astepti raspunsul unui administrator. Poti scrie deja primul mesaj.
          </div>
        )}
        {messages.map((m) => {
          const mine = m.senderUsername === username;
          return (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-xl border px-3 py-2 font-mono text-sm ${
                mine
                  ? "ml-auto bg-cyan-900/30 border-cyan-700/50 text-cyan-100"
                  : "mr-auto bg-gray-900/90 border-cyan-900/40 text-gray-200"
              }`}
            >
              <div className="text-[10px] mb-1 text-cyan-700">
                {m.senderRole === "ADMIN" ? "Admin" : "Tu"} · {new Date(m.createdAt).toLocaleTimeString()}
              </div>
              <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
            </div>
          );
        })}
      </div>

      {!isClosed && (
        <div className="border-t border-cyan-900/40 bg-gray-950/90 p-3">
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
              className="flex-1 resize-none h-12 sm:h-20 rounded-lg bg-gray-900 border border-cyan-900/40 text-gray-100 font-mono text-sm px-3 py-2 outline-none focus:border-cyan-500"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="h-12 sm:h-20 px-3 sm:px-4 rounded-lg border border-cyan-600/50 text-cyan-300 hover:bg-cyan-900/20 disabled:opacity-40 disabled:cursor-not-allowed font-mono text-sm"
            >
              Trimite
            </button>
          </div>
        </div>
      )}
    </>
  );
}
