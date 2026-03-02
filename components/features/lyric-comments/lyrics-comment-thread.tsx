"use client";

import { useState } from "react";
import { UserAvatar } from "@daveyplate/better-auth-ui";
import { authClient } from "@/lib/auth/auth-client";
import { Badge } from "@/components/ui/badge";
import { RelativeTime } from "@/components/common/relative-time";
import { Button } from "@/components/ui/button";
import { TextareaAutosize } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useCreateLyricsComment,
  useResolveLyricsComment,
  useUnresolveLyricsComment,
  useUpdateLyricsComment,
} from "@/hooks/use-lyrics-comments";
import type { LyricsComment } from "@/types/lyrics-comment";
import type { Editor } from "@tiptap/react";
import type { UseMutationResult } from "@tanstack/react-query";
import { nanoid } from "nanoid";

interface LyricsCommentThreadProps {
  comment: LyricsComment;
  trackId: string;
  projectOwnerId?: string;
  editor: Editor | null;
  deleteComment: UseMutationResult<
    void,
    Error,
    { trackId: string; commentId: string },
    unknown
  >;
}

export function LyricsCommentThread({
  comment,
  trackId,
  projectOwnerId,
  editor,
  deleteComment,
}: LyricsCommentThreadProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const createComment = useCreateLyricsComment();
  const resolveComment = useResolveLyricsComment();
  const unresolveComment = useUnresolveLyricsComment();
  const updateComment = useUpdateLyricsComment();

  // Get current user session
  const { data: session } = authClient.useSession();
  const isCommentAuthor = session?.user?.id === comment.userId;

  const handleReply = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    await createComment.mutateAsync({
      trackId,
      data: {
        id: nanoid(), // Generate new ID for the reply
        content: replyContent,
        parentId: comment.id, // Reference the parent comment's id
      },
    });
    setReplyContent("");
    setIsReplying(false);
  };

  const handleDelete = async (commentId: string) => {
    await deleteComment.mutateAsync({ trackId, commentId });
  };

  const handleResolve = async () => {
    await resolveComment.mutateAsync({
      trackId,
      commentId: comment.id,
    });
  };

  const handleUnresolve = async () => {
    await unresolveComment.mutateAsync({
      trackId,
      commentId: comment.id,
    });
  };

  const handleEdit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!editContent.trim() || editContent === comment.content) {
      setIsEditing(false);
      return;
    }

    await updateComment.mutateAsync({
      trackId,
      commentId: comment.id,
      data: {
        content: editContent,
      },
    });
    setIsEditing(false);
  };
  const handleThreadClick = () => {
    if (editor && !comment.parentId) {
      editor.chain().focus().setComment(comment.id).run();
    }
  };

  return (
    <div
      className="space-y-3"
      id={`comment-${comment.id}`}
      onClick={handleThreadClick}
    >
      <div className="flex gap-2 sm:gap-3">
        <div className="shrink-0">
          {comment.user ? (
            <UserAvatar user={comment.user} className="size-7 sm:size-8" />
          ) : (
            <div className="size-7 sm:size-8 rounded-full bg-destructive flex items-center justify-center text-destructive-foreground text-xs">
              ?
            </div>
          )}
        </div>
        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-1">
            <span className="text-xs sm:text-sm font-bold">
              {comment.user ? comment.user.name : "Deleted User"}
            </span>
            <span className="text-xs sm:text-sm">
              • <RelativeTime date={comment.createdAt} />
              {comment.editedAt && (
                <span className="text-muted-foreground"> (edited)</span>
              )}
            </span>
            {comment.resolvedAt && (
              <Badge variant="secondary" className="text-xs">
                Resolved
              </Badge>
            )}
          </div>
          {isEditing ? (
            <form onSubmit={handleEdit} className="mt-2 space-y-2">
              <TextareaAutosize
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Edit your comment..."
                className="resize-none"
                minRows={1}
                maxRows={10}
                autoFocus
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={
                    !editContent.trim() ||
                    editContent === comment.content ||
                    updateComment.isPending
                  }
                  className="text-xs w-full sm:w-auto"
                >
                  {updateComment.isPending ? "Saving..." : "Save"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  className="text-xs w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <>
              <p className="text-xs sm:text-sm wrap-break-word whitespace-pre-wrap">
                {comment.content}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setIsReplying(!isReplying)}
                  className="text-xs text-foreground"
                >
                  Reply
                </button>
                {isCommentAuthor && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-foreground"
                  >
                    Edit
                  </button>
                )}
                {/* Only show resolve/unresolve for top-level comments */}
                {!comment.parentId && (
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
                        className="text-xs text-blue-700 hover:text-blue-400 dark:text-blue-400 dark:hover:text-blue-200"
                      >
                        {resolveComment.isPending ? "Resolving..." : "Resolve"}
                      </button>
                    )}
                  </>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="text-xs text-red-900 hover:text-red-500 dark:text-red-500 dark:hover:text-red-300">
                      Delete
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this comment? This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(comment.id)}
                        className="bg-destructive text-white border-destructive hover:bg-white hover:text-destructive hover:border-destructive"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          )}

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
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!replyContent.trim() || createComment.isPending}
                  className="text-xs w-full sm:w-auto"
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
                  className="text-xs w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Render replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3 pl-3 sm:pl-4 border-l">
              {comment.replies.map((reply) => (
                <LyricsCommentThread
                  key={reply.id}
                  comment={reply}
                  trackId={trackId}
                  projectOwnerId={projectOwnerId}
                  editor={editor}
                  deleteComment={deleteComment}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
