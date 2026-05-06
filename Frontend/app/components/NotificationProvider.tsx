import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { SupportSocket, type AppNotification } from "~/lib/supportSocket";
import { useAuth } from "~/hooks/useAuth";

interface NotificationContextProps {
  notifications: AppNotification[];
  removeNotification: (timestamp: number) => void;
  sendNotification: (type: "CHAT" | "FAVORITE" | "SYSTEM", title: string, message: string) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const socketRef = useRef<SupportSocket | null>(null);

  useEffect(() => {
    if (!user) return;

    const socket = new SupportSocket(user.token);
    socketRef.current = socket;

    socket.connect().then(() => {
      // Ensure we pass whether user is admin to correctly subscribe
      socket.subscribeToNotifications((notif) => {
        setNotifications((prev) => [...prev, notif]);
        // Auto remove after 5 seconds
        setTimeout(() => {
          setNotifications((current) => current.filter((n) => n.timestamp !== notif.timestamp));
        }, 5000);
      }, user.role === "ADMIN");
    }).catch(console.error);

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const removeNotification = (timestamp: number) => {
    setNotifications((prev) => prev.filter((n) => n.timestamp !== timestamp));
  };

  const sendNotification = (type: "CHAT" | "FAVORITE" | "SYSTEM", title: string, message: string) => {
    if (socketRef.current) {
      socketRef.current.sendNotification(type, title, message);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, removeNotification, sendNotification }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {notifications.map((notif) => (
          <div
            key={notif.timestamp}
            className="relative bg-[#fbf6ec] border border-emerald-300/60 shadow-[0_18px_40px_-18px_rgba(25,107,70,0.35)] p-4 rounded-sm min-w-[280px] cursor-pointer hover:border-emerald-500 transition-all font-mono group"
            onClick={() => {
              removeNotification(notif.timestamp);
              if (notif.type === "CHAT") {
                if (user?.role === "ADMIN") {
                  window.dispatchEvent(new CustomEvent("open-chat-admin"));
                } else {
                  window.dispatchEvent(new CustomEvent("open-chat-client"));
                }
              }
            }}
          >
            <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-600" />
            <div className="absolute -top-2 left-3 px-1.5 bg-[#fbf6ec] text-[9px] tracking-[0.4em] uppercase text-emerald-700 font-semibold">
              {notif.type === "CHAT" ? "MSG·NEW" : notif.type === "FAVORITE" ? "FAV·NEW" : "SYS·NEW"}
            </div>
            <div className="flex items-start justify-between gap-3 pl-2">
              <div className="text-[13px] font-semibold text-stone-900 tracking-wide">{notif.title}</div>
              <span className="text-[9px] tracking-[0.3em] uppercase text-emerald-700/70 tabular-nums shrink-0">
                {new Date(notif.timestamp).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <div className="text-[12px] text-stone-600 mt-1 leading-relaxed pl-2">{notif.message}</div>
            <div className="mt-2 pl-2 text-[9px] tracking-[0.3em] uppercase text-emerald-700/60 group-hover:text-emerald-700 transition">
              ↩ click pentru a deschide
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
}
