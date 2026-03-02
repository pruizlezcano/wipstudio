"use client";

import { useEffect, useState, useRef } from "react";
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

  useEffect(() => {
    if (!editor) return;

    const updateButton = () => {
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
        return;
      }

      // Show button only if there's a selection and no existing comment
      if (from === to) {
        setShow(false);
        setShowForm(false);
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
        return;
      }

      // Get the coordinates of the selection
      const start = editor.view.coordsAtPos(from);
      const end = editor.view.coordsAtPos(to);

      // Position the button at the end of the selection
      setPosition({
        top: start.top - 40, // Above the selection
        left: end.right + 10, // To the right of selection end
      });
      setShow(true);
    };

    // Update on selection change
    editor.on("selectionUpdate", updateButton);
    editor.on("update", updateButton);

    return () => {
      editor.off("selectionUpdate", updateButton);
      editor.off("update", updateButton);
    };
  }, [editor]);

  useEffect(() => {
    if (showForm && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showForm]);

  const handleSubmit = async (e: React.SubmitEvent) => {
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
      className="fixed z-30"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {!showForm ? (
        <Button
          onClick={() => setShowForm(true)}
          size="sm"
          variant="default"
          className="shadow-lg text-xs h-8 px-3"
        >
          <MessageSquarePlus className="h-3.5 w-3.5 mr-1.5" />
          Add Comment
        </Button>
      ) : (
        <div className="bg-card border rounded-md shadow-lg p-3 w-80">
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
              className="w-full p-2 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
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
