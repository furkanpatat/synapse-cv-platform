import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { MessageDto } from "@/types/messaging";
import type { NotificationDto } from "@/types/notification";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080/api/ws";

type MessageListener = (m: MessageDto) => void;
type NotificationListener = (n: NotificationDto) => void;

export class MessagingSocket {
  private client: Client | null = null;
  private messageListeners = new Set<MessageListener>();
  private notificationListeners = new Set<NotificationListener>();

  connect(accessToken: string) {
    if (this.client?.active) return;

    this.client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 5000,
      onConnect: () => {
        this.client?.subscribe("/user/queue/messages", (frame: IMessage) => {
          try {
            const msg = JSON.parse(frame.body) as MessageDto;
            this.messageListeners.forEach((l) => l(msg));
          } catch {
            // ignore
          }
        });
        this.client?.subscribe("/user/queue/notifications", (frame: IMessage) => {
          try {
            const n = JSON.parse(frame.body) as NotificationDto;
            this.notificationListeners.forEach((l) => l(n));
          } catch {
            // ignore
          }
        });
      },
      onStompError: (frame) => {
        console.warn("[WS] STOMP error:", frame.headers["message"]);
      },
    });
    this.client.activate();
  }

  disconnect() {
    this.client?.deactivate();
    this.client = null;
    this.messageListeners.clear();
    this.notificationListeners.clear();
  }

  onMessage(listener: MessageListener): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  onNotification(listener: NotificationListener): () => void {
    this.notificationListeners.add(listener);
    return () => this.notificationListeners.delete(listener);
  }
}

let singleton: MessagingSocket | null = null;
export function getMessagingSocket(): MessagingSocket {
  if (!singleton) singleton = new MessagingSocket();
  return singleton;
}
