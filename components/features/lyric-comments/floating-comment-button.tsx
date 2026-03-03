"use client";

import { useEffect, useState, useRef, useCallback, useLayoutEffect } from "react";
import { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, X } from "lucide-react";

interface FloatingCommentButtonProps {
  editor: Editor | null;
  onAddComment: (content: string) => void;
}

export function FloatingCommentButton({
  editor,
  onAddComment,
}: FloatingCommentButtonProps) {
  const [show, setShow] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [commentContent, setCommentContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isPlaced, setIsPlaced] = useState(false);

  // Function to calculate and update position
  const updatePosition = useCallback(() => {
    if (!editor || !show) return;

    const { state } = editor;
    const { from, to } = state.selection;

    // Get the coordinates of the selection
    let start, end;
    try {
      start = editor.view.coordsAtPos(from);
      end = editor.view.coordsAtPos(to);
    } catch {
      return;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Use actual dimensions if available, otherwise fallback to estimates
    const rect = buttonRef.current?.getBoundingClientRect();
    const currentWidth = rect?.width || (showForm ? 320 : 120);
    const currentHeight = rect?.height || (showForm ? 200 : 32);

    // Default: Above the selection end
    let top = start.top - currentHeight - 10;
    let left = end.right + 10;

    // 1. Horizontal adjustment
    if (left + currentWidth > viewportWidth - 16) {
      // If it goes off-screen right, Try showing it at the start of the selection instead
      left = Math.max(16, start.left - currentWidth - 10);

      // If it still goes off-screen (too wide for line), center it on the screen
      if (left + currentWidth > viewportWidth - 16) {
        left = Math.max(16, (viewportWidth - currentWidth) / 2);
      }
    }

    if (left < 16) {
      left = 16;
    }

    // 2. Vertical adjustment
    // If there's no space above selection, show it below
    if (top < 16) {
      top = end.bottom + 10;
    }

    // If it would go off the bottom, jump back up or adjust
    if (top + currentHeight > viewportHeight - 16) {
      top = Math.max(16, viewportHeight - currentHeight - 16);
    }

    setPosition({ top, left });
    setIsPlaced(true);
  }, [editor, show, showForm]);

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      const { state } = editor;
      const { from, to } = state.selection;

      // Don't show button if user is typing in a textarea or input
      const activeElement = document.activeElement;
      if (
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.tagName === "INPUT"
      ) {
        setShow(false);
        setShowForm(false);
        setIsPlaced(false);
        return;
      }

      // Show button only if there's a selection and no existing comment
      if (from === to) {
        setShow(false);
        setShowForm(false);
        setIsPlaced(false);
        return;
      }

      // Check if selection already has a comment
      const hasComment = state.doc.rangeHasMark(
        from,
        to,
        state.schema.marks.comment
      );
      if (hasComment) {
        setShow(false);
        setShowForm(false);
        setIsPlaced(false);
        return;
      }

      setShow(true);
    };

    editor.on("selectionUpdate", handleUpdate);
    editor.on("update", handleUpdate);

    return () => {
      editor.off("selectionUpdate", handleUpdate);
      editor.off("update", handleUpdate);
    };
  }, [editor]);

  // Update position whenever visibility, form state, or content changes
  useLayoutEffect(() => {
    if (show) {
      updatePosition();
    }
  }, [show, showForm, updatePosition]);

  // Handle scroll and resize separately to stay synchronized
  useEffect(() => {
    if (!show) return;

    const handleEvents = () => {
      updatePosition();
    };

    window.addEventListener("scroll", handleEvents, true);
    window.addEventListener("resize", handleEvents);

    return () => {
      window.removeEventListener("scroll", handleEvents, true);
      window.removeEventListener("resize", handleEvents);
    };
  }, [show, updatePosition]);

  useEffect(() => {
    if (showForm && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      onAddComment(commentContent);
      setCommentContent("");
      setShowForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setCommentContent("");
    setShowForm(false);
    // Clear selection
    if (editor) {
      editor.commands.setTextSelection(editor.state.selection.to);
    }
  };

  if (!show) return null;

  return (
    <div
      ref={buttonRef}
      className={`fixed z-30 transition-opacity duration-200 ${
        isPlaced ? "opacity-100" : "opacity-0"
      }`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {!showForm ? (
        <Button
          onClick={() => {
            setShowForm(true);
            setIsPlaced(false); // Trigger re-placement for the form
          }}
          size="sm"
          variant="default"
          className="shadow-lg text-xs h-8 px-3 whitespace-nowrap animate-in fade-in zoom-in-95 duration-200"
        >
          <MessageSquarePlus className="h-3.5 w-3.5 mr-1.5" />
          Add Comment
        </Button>
      ) : (
        <div className="bg-card border rounded-md shadow-lg p-3 w-[min(calc(100vw-32px),320px)] animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Add Comment</h3>
            <button
              onClick={handleCancel}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-2">
            <textarea
              ref={textareaRef}
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="Write your comment..."
              className="w-full p-2 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={!commentContent.trim() || isSubmitting}
                className="text-xs"
              >
                {isSubmitting ? "Adding..." : "Add Comment"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCancel}
                className="text-xs"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
