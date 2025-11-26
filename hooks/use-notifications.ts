import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Notification, UseNotificationsOptions } from "@/types/notification";

export function useNotifications(options: UseNotificationsOptions = {}) {
  const queryClient = useQueryClient();
  const { unreadOnly = false, limit = 50, offset = 0 } = options;

  const query = useQuery<Notification[]>({
    queryKey: ["notifications", { unreadOnly, limit, offset }],
    queryFn: async () => {
      const params = new URLSearchParams({
        unreadOnly: String(unreadOnly),
        limit: String(limit),
        offset: String(offset),
      });

      const res = await fetch(`/api/notifications?${params}`);
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    structuralSharing: true,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to mark notification as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to mark all notifications as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete notification");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unreadCount = query.data?.filter((n) => !n.readAt).length ?? 0;

  return {
    notifications: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    unreadCount,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    refetch: query.refetch,
  };
}
