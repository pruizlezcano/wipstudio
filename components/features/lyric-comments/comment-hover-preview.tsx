"use client";

import { useLayoutEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@daveyplate/better-auth-ui";
import { DateTime } from "@/components/common/date-time";
import type { LyricsComment } from "@/types/lyrics-comment";

interface CommentHoverPreviewProps {
  comments: LyricsComment[];
  commentId: string | null;
  targetElement: HTMLElement | null;
}

export function CommentHoverPreview({
  comments,
  commentId,
  targetElement,
}: CommentHoverPreviewProps) {
  const [position, setPosition] = useState({ x: -1000, y: -1000 });
  const [isPlaced, setIsPlaced] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Find the thread (parent comment and its replies)
  const thread = comments.find((c) => c.id === commentId && !c.parentId);
  const replies = thread?.replies || [];

  // Derived state - don't use useState for visibility
  const isVisible = !!(targetElement && commentId && thread);

  // Sync state to props during render (official React pattern for resetting state on prop change)
  const [prevCommentId, setPrevCommentId] = useState(commentId);
  if (commentId !== prevCommentId) {
    setPrevCommentId(commentId);
    setIsPlaced(false);
  }

  useLayoutEffect(() => {
    if (!isVisible || !targetElement) {
      return;
    }

    const updatePosition = () => {
      if (!targetElement) return;

      const rect = targetElement.getBoundingClientRect();
      const cardHeight = cardRef.current?.offsetHeight || 0;
      const cardWidth = cardRef.current?.offsetWidth || 0;

      let x = rect.left;
      let y = rect.bottom + 8; // 8px below the highlight

      // Adjust if it would go off the right edge
      if (x + cardWidth > window.innerWidth - 16) {
        x = window.innerWidth - cardWidth - 16;
      }

      // Adjust if it would go off the left edge
      if (x < 16) {
        x = 16;
      }

      // If it would go off the bottom, show it above instead
      if (y + cardHeight > window.innerHeight - 16) {
        y = rect.top - cardHeight - 8;
      }

      setPosition({ x, y });
      setIsPlaced(true);
    };

    updatePosition();

    // Update position on scroll or resize
    const handleUpdate = () => updatePosition();
    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("resize", handleUpdate);

    return () => {
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
    };
  }, [isVisible, targetElement, commentId]);

  if (!isVisible || !thread) {
    return null;
  }

  return (
    <div
      ref={cardRef}
      className={`fixed z-50 transition-opacity duration-200 ${
        isPlaced ? "opacity-100 animate-in fade-in-0 zoom-in-95" : "opacity-0"
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        maxWidth: "400px",
        pointerEvents: "none",
      }}
    >
      <Card className="shadow-lg border-2 p-4">
        <CardContent className="space-y-2 p-0">
          <div className="flex gap-2">
            <div className="shrink-0">
              {thread.user ? (
                <UserAvatar user={thread.user} className="size-7" />
              ) : (
                <div className="size-7 rounded-full bg-destructive flex items-center justify-center text-destructive-foreground text-xs">
                  ?
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex flex-wrap items-baseline gap-1">
                <span className="text-xs font-bold">
                  {thread.user ? thread.user.name : "Deleted User"}
                </span>
                <span className="text-xs">
                  • <DateTime date={thread.createdAt} mode="relative" />
                  {thread.editedAt && (
                    <span className="text-muted-foreground"> (edited)</span>
                  )}
                </span>
                {thread.resolvedAt && (
                  <Badge variant="secondary" className="text-xs">
                    Resolved
                  </Badge>
                )}
              </div>
              <p className="text-xs whitespace-pre-wrap wrap-break-word line-clamp-3">
                {thread.content}
              </p>
              {replies.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {replies.length} {replies.length === 1 ? "reply" : "replies"}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
