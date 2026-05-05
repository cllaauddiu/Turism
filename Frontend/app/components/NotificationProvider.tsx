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
            className="bg-white border-l-4 border-blue-500 shadow-md p-4 rounded min-w-[250px] cursor-pointer"
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
            <div className="text-sm font-bold text-gray-800">{notif.title}</div>
            <div className="text-sm text-gray-600 mt-1">{notif.message}</div>
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
