"use client";

import { useState } from "react";
import { useLyricsComments } from "@/hooks/use-lyrics-comments";
import { LyricsCommentThread } from "./lyrics-comment-thread";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Editor } from "@tiptap/react";
import type { UseMutationResult } from "@tanstack/react-query";
import type { LyricsComment } from "@/types/lyrics-comment";

interface LyricsCommentsSidebarProps {
  trackId: string;
  projectOwnerId?: string;
  activeCommentId: string | null;
  editor: Editor | null;
  deleteComment: UseMutationResult<
    void,
    Error,
    { trackId: string; commentId: string },
    unknown
  >;
}

export function LyricsCommentsSidebar({
  trackId,
  projectOwnerId,
  activeCommentId,
  editor,
  deleteComment,
}: LyricsCommentsSidebarProps) {
  const [includeResolved, setIncludeResolved] = useState(false);
  const { data: comments, isLoading } = useLyricsComments(
    trackId,
    includeResolved
  );

  if (isLoading) {
    return (
      <Card className="min-h-50">
        <CardContent className="py-8 h-full flex items-center justify-center">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row lg:flex-col items-left md:justify-between gap-3">
          <div>
            <CardTitle>Comments ({comments?.length || 0})</CardTitle>
            <CardDescription>
              Select text in the editor to add comments
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-resolved-lyrics"
              checked={includeResolved}
              onCheckedChange={(checked) =>
                setIncludeResolved(checked as boolean)
              }
            />
            <Label
              htmlFor="show-resolved-lyrics"
              className="mb-0 text-xs sm:text-sm"
            >
              Show resolved
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent
        className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto"
        id="lyrics-comments-container"
      >
        {comments && comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment: LyricsComment) => {
              const isActive = comment.id === activeCommentId;

              return (
                <div
                  key={comment.id}
                  id={`comment-${comment.id}`}
                  className={`
                    p-2 -mx-2 transition-colors
                    ${isActive && "bg-accent/30"}
                  `}
                >
                  <LyricsCommentThread
                    comment={comment}
                    trackId={trackId}
                    projectOwnerId={projectOwnerId}
                    editor={editor}
                    deleteComment={deleteComment}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground uppercase font-medium tracking-tight text-center">
            No comments yet. Select some text in the editor to add a comment.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
