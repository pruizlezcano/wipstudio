"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextareaAutosize } from "@/components/ui/textarea";
import { useCreateComment } from "@/hooks/use-comments";
import { useUIStore } from "@/stores/uiStore";
import { usePlayerStore } from "@/stores/playerStore";

interface CommentFormProps {
  trackId: string;
  versionId: string;
  timestamp?: number;
  onSeek?: (time: number) => void;
}

export const CommentForm = ({
  trackId,
  versionId,
  timestamp: initialTimestamp,
  onSeek,
}: CommentFormProps) => {
  const [content, setContent] = useState("");
  const [timestamp, setTimestamp] = useState<number | undefined>(initialTimestamp);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { focusCommentInput, setFocusCommentInput } = useUIStore();
  const { waveSurfer } = usePlayerStore();
  const createComment = useCreateComment();

  // Sync with prop if it changes (e.g. clicking waveform)
  useEffect(() => {
    setTimestamp(initialTimestamp);
  }, [initialTimestamp]);

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
  };

  useEffect(() => {
    if (focusCommentInput && textareaRef.current) {
      if (waveSurfer) {
        setTimestamp(waveSurfer.getCurrentTime());
      }
      textareaRef.current.focus();
      setFocusCommentInput(false);
    }
  }, [focusCommentInput, setFocusCommentInput, waveSurfer]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-1.5">
      {timestamp !== undefined && (
        <Badge
          className="text-xs cursor-pointer hover:bg-primary/60 transition-colors select-none"
          onClick={() => onSeek?.(timestamp)}
        >
          @ {formatTime(timestamp)}
        </Badge>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <TextareaAutosize
          ref={textareaRef}
          className="min-w-0 flex-1 resize-none"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            timestamp !== undefined
              ? "Add a comment at this timestamp..."
              : "Add a general comment..."
          }
          minRows={1}
          maxRows={10}
        />
        <Button
          type="submit"
          disabled={!content.trim() || createComment.isPending}
          className="w-full sm:w-auto text-xs sm:text-sm shrink-0"
        >
          {createComment.isPending ? "Posting..." : "Post Comment"}
        </Button>
      </div>
    </form>
  );
}
