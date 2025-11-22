"use client";

import { useRouter } from "next/navigation";
import {
  Check,
  Trash2,
  Music,
  Upload,
  MessageCircle,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NotificationMetadata } from "@/lib/notifications/types";

interface Notification {
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

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: () => void;
  onDelete: () => void;
}

const notificationIcons = {
  invitation: Mail,
  new_track: Music,
  new_version: Upload,
  new_comment: MessageCircle,
  comment_reply: MessageCircle,
};

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) {
  const router = useRouter();
  const isUnread = !notification.readAt;
  const Icon = notificationIcons[notification.type];

  const handleClick = () => {
    if (isUnread) {
      onMarkAsRead();
    }
    if (notification.metadata?.url) {
      router.push(notification.metadata.url);
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor(
      (now.getTime() - notificationDate.getTime()) / 1000
    );

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return notificationDate.toLocaleDateString();
  };

  return (
    <div
      className={cn(
        "p-4 hover:bg-accent transition-colors cursor-pointer group relative",
        isUnread && "bg-accent/50"
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div
          className={cn(
            "shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
            isUnread ? "bg-primary/10" : "bg-muted"
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5",
              isUnread ? "text-primary" : "text-muted-foreground"
            )}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4
              className={cn(
                "text-sm font-medium line-clamp-1",
                isUnread && "font-semibold"
              )}
            >
              {notification.title}
            </h4>
            {isUnread && (
              <div className="shrink-0 w-2 h-2 rounded-full bg-primary mt-1" />
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {notification.message}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-mono">
              {formatTimeAgo(notification.createdAt)}
            </span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {isUnread && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead();
                  }}
                  title="Mark as read"
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                className="hover:bg-destructive hover:text-white"
                size="icon-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
