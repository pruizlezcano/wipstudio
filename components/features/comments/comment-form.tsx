"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextareaAutosize } from "@/components/ui/textarea";
import { useCreateComment } from "@/hooks/use-comments";

interface CommentFormProps {
  trackId: string;
  versionId: string;
  timestamp?: number;
  onCancel?: () => void;
}

export function CommentForm({
  trackId,
  versionId,
  timestamp,
  onCancel,
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const createComment = useCreateComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    await createComment.mutateAsync({
      trackId,
      versionId,
      data: {
        content,
        timestamp,
      },
    });
    setContent("");
    onCancel?.();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {timestamp !== undefined && <Badge>@{formatTime(timestamp)}</Badge>}
      <TextareaAutosize
        className="resize-none"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={
          timestamp !== undefined
            ? "Add a comment at this timestamp..."
            : "Add a general comment..."
        }
        minRows={1}
        maxRows={10}
      />
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={!content.trim() || createComment.isPending}
        >
          {createComment.isPending ? "Posting..." : "Post Comment"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
