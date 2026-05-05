import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import type { SupportMessage, SupportSessionSummary } from "~/lib/api";

export interface SessionEvent {
  type: "CREATED" | "UPDATED" | "CLOSED";
  session: SupportSessionSummary;
}

const WS_URL = typeof window !== "undefined"
  ? `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/chatbox/ws`
  : "ws://chatbox-service:8086/chatbox/ws";

export class SupportSocket {
  private client: Client;
  private subscriptions = new Map<string, StompSubscription>();
  private connected = false;
  private connectPromise: Promise<void> | null = null;

  constructor(token: string) {
    this.client = new Client({
      brokerURL: WS_URL,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {},
    });
  }

  connect(): Promise<void> {
    if (this.connected) return Promise.resolve();
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = new Promise((resolve, reject) => {
      this.client.onConnect = () => {
        this.connected = true;
        resolve();
      };
      this.client.onStompError = (frame) => {
        this.connected = false;
        reject(new Error(frame.headers["message"] ?? "STOMP error"));
      };
      this.client.onWebSocketError = (event) => {
        this.connected = false;
        reject(event instanceof Error ? event : new Error("WebSocket error"));
      };
      this.client.activate();
    });

    return this.connectPromise;
  }

  disconnect() {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.subscriptions.clear();
    this.client.deactivate();
    this.connected = false;
    this.connectPromise = null;
  }

  subscribeToSession(sessionId: string, onMessage: (msg: SupportMessage | SessionEvent) => void) {
    const dest = `/topic/support/${sessionId}`;
    this.unsubscribe(dest);
    const sub = this.client.subscribe(dest, (frame: IMessage) => {
      try {
        onMessage(JSON.parse(frame.body));
      } catch {
        /* ignore malformed payloads */
      }
    });
    this.subscriptions.set(dest, sub);
  }

  subscribeToMyEvents(username: string, onEvent: (e: SessionEvent) => void) {
    const dest = `/user/queue/support/session`;
    this.unsubscribe(dest);
    const sub = this.client.subscribe(dest, (frame: IMessage) => {
      try {
        onEvent(JSON.parse(frame.body));
      } catch { /* ignore */ }
    });
    this.subscriptions.set(dest, sub);
  }

  subscribeToAdminSessions(onEvent: (e: SessionEvent) => void) {
    const dest = `/topic/admin/sessions`;
    this.unsubscribe(dest);
    const sub = this.client.subscribe(dest, (frame: IMessage) => {
      try {
        onEvent(JSON.parse(frame.body));
      } catch { /* ignore */ }
    });
    this.subscriptions.set(dest, sub);
  }

  unsubscribe(dest: string) {
    const existing = this.subscriptions.get(dest);
    if (existing) {
      existing.unsubscribe();
      this.subscriptions.delete(dest);
    }
  }

  startSession() {
    this.client.publish({ destination: "/app/support/start", body: "" });
  }

  sendMessage(sessionId: string, content: string) {
    this.client.publish({
      destination: "/app/support/send",
      body: JSON.stringify({ sessionId, content }),
    });
  }

  closeSession(sessionId: string) {
    this.client.publish({ destination: "/app/support/close", body: sessionId });
  }
}
