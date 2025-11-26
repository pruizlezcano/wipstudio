"use client";

import { useState } from "react";
import { UserAvatar } from "@daveyplate/better-auth-ui";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextareaAutosize } from "@/components/ui/textarea";
import {
  useCreateComment,
  useDeleteComment,
  useResolveComment,
  useUnresolveComment,
} from "@/hooks/use-comments";
import type { Comment } from "@/types";

interface CommentThreadProps {
  comment: Comment;
  trackId: string;
  versionId: string;
  onSeek?: (time: number) => void;
}

export function CommentThread({
  comment,
  trackId,
  versionId,
  onSeek,
}: CommentThreadProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();
  const resolveComment = useResolveComment();
  const unresolveComment = useUnresolveComment();

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    await createComment.mutateAsync({
      trackId,
      versionId,
      data: {
        content: replyContent,
        parentId: comment.id,
      },
    });
    setReplyContent("");
    setIsReplying(false);
  };

  const handleDelete = async (commentId: string) => {
    await deleteComment.mutateAsync({ trackId, versionId, commentId });
  };

  const handleResolve = async () => {
    await resolveComment.mutateAsync({
      trackId,
      versionId,
      commentId: comment.id,
    });
  };

  const handleUnresolve = async () => {
    await unresolveComment.mutateAsync({
      trackId,
      versionId,
      commentId: comment.id,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-3" id={`comment-${comment.id}`}>
      <div className="flex gap-3">
        <div className="shrink-0">
          {comment.user ? (
            <UserAvatar user={comment.user} />
          ) : (
            <div className="size-8 rounded-full bg-destructive flex items-center justify-center text-destructive-foreground">
              ?
            </div>
          )}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {comment.user ? comment.user.name : "Deleted User"}
            </span>
            {comment.timestamp !== null && (
              <button
                onClick={() => onSeek?.(comment.timestamp!)}
                className="text-xs text-orange-600 hover:text-orange-700 font-medium"
              >
                {formatTime(comment.timestamp)}
              </button>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
              })}
            </span>
            {comment.resolvedAt && <Badge variant="secondary">Resolved</Badge>}
          </div>
          <p className="text-sm">{comment.content}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Reply
            </button>
            {/* Only show resolve/unresolve for top-level comments (with timestamp) */}
            {comment.timestamp !== null && !comment.parentId && (
              <>
                {comment.resolvedAt ? (
                  <button
                    onClick={handleUnresolve}
                    disabled={unresolveComment.isPending}
                    className="text-xs text-green-600 hover:text-green-700"
                  >
                    {unresolveComment.isPending
                      ? "Unresolving..."
                      : "Unresolve"}
                  </button>
                ) : (
                  <button
                    onClick={handleResolve}
                    disabled={resolveComment.isPending}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    {resolveComment.isPending ? "Resolving..." : "Resolve"}
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => handleDelete(comment.id)}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Delete
            </button>
          </div>

          {isReplying && (
            <form onSubmit={handleReply} className="mt-2 space-y-2">
              <TextareaAutosize
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="resize-none"
                minRows={1}
                maxRows={10}
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!replyContent.trim() || createComment.isPending}
                >
                  {createComment.isPending ? "Posting..." : "Post Reply"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsReplying(false);
                    setReplyContent("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Render replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3 pl-4 border-l">
              {comment.replies.map((reply) => (
                <CommentThread
                  key={reply.id}
                  comment={reply}
                  trackId={trackId}
                  versionId={versionId}
                  onSeek={onSeek}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
