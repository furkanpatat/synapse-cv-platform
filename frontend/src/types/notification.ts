export type NotificationType =
  | "APPLICATION_STATUS"
  | "NEW_APPLICATION"
  | "NEW_MESSAGE"
  | "ANALYSIS_COMPLETE"
  | "COMPANY_VERIFIED"
  | "SYSTEM";

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationFeed {
  items: NotificationDto[];
  unread: number;
  total: number;
}
