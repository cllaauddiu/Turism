import { useEffect, useRef, useState } from "react";
import { chatApi } from "~/lib/api";
import SupportChat from "~/components/SupportChat";
import { useAuth } from "~/hooks/useAuth";

interface ChatBoxProps {
  onClose: () => void;
  initialTab?: "ai" | "admin";
}

type UiMessage = {
  id: string;
  role: "user" | "ai";
  text: string;
  model?: string;
};

type Tab = "ai" | "admin";

export default function ChatBox({ onClose, initialTab = "ai" }: ChatBoxProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

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
      style={{ background: "rgba(40,30,10,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full h-full sm:max-w-4xl sm:h-[82vh] bg-[#fbf6ec] rounded-none sm:rounded-sm border-0 sm:border border-emerald-300/60 overflow-hidden shadow-[0_30px_80px_-30px_rgba(25,107,70,0.35)] flex flex-col font-mono">
        <div className="relative flex items-center justify-between px-5 py-3 border-b border-emerald-300/50 bg-[#f4efe6]/85"><span className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
            <div>
              <h2 className="text-emerald-700 font-mono font-bold text-[12px] tracking-[0.3em] uppercase">
                {activeTab === "ai" ? "AI Assistant" : "Vorbeste cu Admin"}
              </h2>
              <p className="text-stone-500 font-mono text-xs">
                {activeTab === "ai" ? "Conversatie cu AIService" : "Chat in timp real cu un administrator"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-red-700 transition-colors text-xl leading-none font-mono"
            title="Inchide (Esc)"
          >
            X
          </button>
        </div>

        <div className="flex border-b border-emerald-300/50 bg-[#f4efe6]/40">
          <button
            onClick={() => setActiveTab("ai")}
            className={`flex-1 px-4 py-2 font-mono text-xs tracking-wider uppercase transition-colors ${
              activeTab === "ai"
                ? "text-emerald-700 border-b-2 border-emerald-600 bg-[#fbf6ec]"
                : "text-stone-500 hover:text-emerald-700"
            }`}
          >
            AI Assistant
          </button>
          <button
            onClick={() => setActiveTab("admin")}
            className={`flex-1 px-4 py-2 font-mono text-xs tracking-wider uppercase transition-colors ${
              activeTab === "admin"
                ? "text-emerald-700 border-b-2 border-emerald-600 bg-[#fbf6ec]"
                : "text-stone-500 hover:text-emerald-700"
            }`}
          >
            Vorbeste cu Admin
          </button>
        </div>

        {user?.role === "GUEST" ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100/20 border border-emerald-400/50 flex items-center justify-center text-2xl">
              🔒
            </div>
            <h3 className="text-emerald-700 font-mono text-lg font-bold">Acces Restrictionat</h3>
            <p className="text-stone-600 font-mono text-sm max-w-sm">
              Acest serviciu este disponibil doar membrilor. Creează-ți un cont pentru a interacționa cu asistentul AI sau cu administratorul!
            </p>
            <a href="/auth" className="mt-4 px-6 py-2 bg-transparent border border-emerald-600 text-emerald-700 rounded-sm font-mono text-sm tracking-wider uppercase hover:bg-emerald-100/30 transition-colors">
              Creează cont
            </a>
          </div>
        ) : activeTab === "ai" ? (
          <>
            <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[85%] rounded-sm border px-3 py-2 font-mono text-sm ${
                    message.role === "user"
                      ? "ml-auto bg-emerald-100/30 border-emerald-400/50 text-emerald-800"
                      : "mr-auto bg-stone-50/90 border-emerald-200/40 text-stone-800"
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">{message.text}</div>
                  {message.role === "ai" && message.model && (
                    <div className="text-[10px] mt-1 text-stone-500">model: {message.model}</div>
                  )}
                </div>
              ))}

              {sending && (
                <div className="mr-auto max-w-[85%] rounded-sm border border-emerald-200/40 bg-stone-50/90 px-3 py-2 font-mono text-sm text-stone-600 animate-pulse">
                  AI scrie...
                </div>
              )}
            </div>

            <div className="border-t border-emerald-200/40 bg-stone-100/90 p-3">
              {error && <div className="text-red-700 text-xs font-mono mb-2">{error}</div>}
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
                  className="flex-1 resize-none h-12 sm:h-20 rounded-sm bg-stone-50 border border-emerald-200/40 text-stone-900 font-mono text-sm px-3 py-2 outline-none focus:border-emerald-600"
                />
                <button
                  onClick={() => { void sendMessage(); }}
                  disabled={sending || !input.trim()}
                  className="h-12 sm:h-20 px-3 sm:px-4 rounded-sm border border-emerald-500/50 text-emerald-700 hover:bg-emerald-100/20 disabled:opacity-40 disabled:cursor-not-allowed font-mono text-sm"
                >
                  Trimite
                </button>
              </div>
            </div>
          </>
        ) : (
          <SupportChat />
        )}
      </div>
    </div>
  );
}
