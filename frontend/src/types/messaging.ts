export interface ConversationDto {
  id: string;
  userId: string;
  userName: string;
  userTitle: string | null;
  companyId: string;
  companyName: string;
  companyLogoUrl: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
}

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export interface SendMessagePayload {
  conversationId?: string;
  toCompanyId?: string;
  toUserId?: string;
  body: string;
}
