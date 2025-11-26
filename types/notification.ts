import type { NotificationMetadata } from "@/lib/notifications/types";

export interface Notification {
  id: string;
  userId: string;
  type:
    | "invitation"
    | "new_track"
    | "new_version"
    | "new_comment"
    | "comment_reply";
  title: string;
  message: string;
  metadata: NotificationMetadata | null;
  readAt: string | null;
  createdAt: string;
}

export interface UseNotificationsOptions {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}
