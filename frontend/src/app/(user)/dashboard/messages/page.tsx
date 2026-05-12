"use client";

import { MessagingPanel } from "@/components/messaging/MessagingPanel";

export default function UserMessagesPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Mesajlar</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Şirketlerle olan yazışmaların.
        </p>
      </header>
      <MessagingPanel viewer="USER" />
    </div>
  );
}
