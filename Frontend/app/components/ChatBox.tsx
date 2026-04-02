import { useEffect, useRef, useState } from "react";
import { chatApi } from "~/lib/api";

interface ChatBoxProps {
  onClose: () => void;
}

type UiMessage = {
  id: string;
  role: "user" | "ai";
  text: string;
  model?: string;
};

export default function ChatBox({ onClose }: ChatBoxProps) {
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      id: "welcome",
      role: "ai",
      text: "Salut! Sunt asistentul tau AI. Intreaba-ma orice despre geografie, turism sau platforma ta.",
      model: "chatbox",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, sending]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMessage: UiMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setError(null);
    setSending(true);

    try {
      const response = await chatApi.sendMessage(text);
      const aiMessage: UiMessage = {
        id: `a-${Date.now()}`,
        role: "ai",
        text: response.answer,
        model: response.model,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { data?: { error?: string } } }).response?.data?.error
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : "Chat indisponibil momentan.";
      setError(message ?? "Chat indisponibil momentan.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full h-full sm:max-w-4xl sm:h-[82vh] bg-gray-950 rounded-none sm:rounded-2xl border-0 sm:border border-cyan-900/50 overflow-hidden shadow-2xl shadow-cyan-950/40 flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-cyan-900/40 bg-gray-950/90">
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 text-lg">AI</span>
            <div>
              <h2 className="text-cyan-300 font-mono font-bold text-sm tracking-widest uppercase">ChatBox AI</h2>
              <p className="text-cyan-800 font-mono text-xs">Conversatie cu AIService</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-400 transition-colors text-xl leading-none font-mono"
            title="Inchide (Esc)"
          >
            X
          </button>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[85%] rounded-xl border px-3 py-2 font-mono text-sm ${
                message.role === "user"
                  ? "ml-auto bg-cyan-900/30 border-cyan-700/50 text-cyan-100"
                  : "mr-auto bg-gray-900/90 border-cyan-900/40 text-gray-200"
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed">{message.text}</div>
              {message.role === "ai" && message.model && (
                <div className="text-[10px] mt-1 text-cyan-700">model: {message.model}</div>
              )}
            </div>
          ))}

          {sending && (
            <div className="mr-auto max-w-[85%] rounded-xl border border-cyan-900/40 bg-gray-900/90 px-3 py-2 font-mono text-sm text-gray-400 animate-pulse">
              AI scrie...
            </div>
          )}
        </div>

        <div className="border-t border-cyan-900/40 bg-gray-950/90 p-3">
          {error && <div className="text-red-400 text-xs font-mono mb-2">{error}</div>}
          <div className="flex items-center gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="Scrie mesajul tau..."
              className="flex-1 resize-none h-12 sm:h-20 rounded-lg bg-gray-900 border border-cyan-900/40 text-gray-100 font-mono text-sm px-3 py-2 outline-none focus:border-cyan-500"
            />
            <button
              onClick={() => { void sendMessage(); }}
              disabled={sending || !input.trim()}
              className="h-12 sm:h-20 px-3 sm:px-4 rounded-lg border border-cyan-600/50 text-cyan-300 hover:bg-cyan-900/20 disabled:opacity-40 disabled:cursor-not-allowed font-mono text-sm"
            >
              Trimite
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

