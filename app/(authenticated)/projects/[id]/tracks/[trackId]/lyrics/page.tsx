"use client";

import "./styles.css";

import { Placeholder } from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import StarterKit from "@tiptap/starter-kit";
import { useParams, useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import { useQueryClient } from "@tanstack/react-query";
import { lyricsCommentKeys } from "@/hooks/use-lyrics-comments";
import { authClient } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTrack } from "@/hooks/use-tracks";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { CommentExtension } from "@/lib/tiptap/comments";
import { getWebSocketUrl } from "@/lib/websocket-client";
import { useState, useCallback, useEffect, useMemo } from "react";
import {
  useLyricsComments,
  useCreateLyricsComment,
  useDeleteLyricsComment,
} from "@/hooks/use-lyrics-comments";
import { useProject } from "@/hooks/use-projects";
import { LyricsCommentsSidebar } from "@/components/features/lyric-comments/lyrics-comments-sidebar";
import { FloatingCommentButton } from "@/components/features/lyric-comments/floating-comment-button";
import { CommentHoverPreview } from "@/components/features/lyric-comments/comment-hover-preview";
import { nanoid } from "nanoid";
import { useTheme } from "next-themes";

export default function Lyrics() {
  const params = useParams();
  const router = useRouter();
  const [commentIdParam, setCommentIdParam] = useQueryState("c");
  const trackId = params.trackId as string;
  const projectId = params.id as string;

  const { data: track, isLoading: trackLoading } = useTrack(trackId);
  const { data: project } = useProject(projectId);
  const { data: session } = authClient.useSession();
  const { data: comments = [] } = useLyricsComments(trackId);
  const createComment = useCreateLyricsComment();
  const queryClient = useQueryClient();
  const { resolvedTheme } = useTheme();

  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(
    null
  );

  const provider = useMemo(
    () =>
      new HocuspocusProvider({
        url: `${getWebSocketUrl()}/ws`,
        name: trackId,
        token: session?.session.token,
      }),
    [trackId, session?.session.token]
  );

  const handleCommentActivated = useCallback((commentId: string | null) => {
    setActiveCommentId(commentId);
  }, []);

  const handleCommentHover = useCallback(
    (commentId: string | null, element: HTMLElement | null) => {
      setHoveredCommentId(commentId);
      setHoveredElement(element);
    },
    []
  );

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        undoRedo: false,
      }),
      Document,
      Paragraph,
      Text,
      Placeholder.configure({
        placeholder: "Start writing your lyrics...",
      }),
      Collaboration.configure({
        document: provider.document,
      }),
      CollaborationCaret.configure({
        provider,
        user: {
          name: session?.user.name || "Anonymous",
          color: resolvedTheme === "dark" ? "#ffffff" : "#000000",
        },
      }),
      CommentExtension.configure({
        HTMLAttributes: {
          class: "comment-mark",
        },
        onCommentActivated: handleCommentActivated,
        onCommentHover: handleCommentHover,
      }),
    ],
    [
      provider,
      session,
      resolvedTheme,
      handleCommentActivated,
      handleCommentHover,
    ]
  );

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions,
      content: "",
    },
    []
  );

  const scrollToComment = useCallback((commentId: string) => {
    // Add a small delay to ensure DOM is ready and comments are rendered
    setTimeout(() => {
      // 1. Scroll Sidebar
      const sidebarElement = document.getElementById(`comment-${commentId}`);
      if (sidebarElement) {
        sidebarElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });

        // Add a subtle highlight effect
        sidebarElement.classList.add(
          "ring-2",
          "ring-foreground",
          "ring-opacity-50"
        );
        setTimeout(() => {
          sidebarElement.classList.remove(
            "ring-2",
            "ring-foreground",
            "ring-opacity-50"
          );
        }, 2000);
      }

      // 2. Scroll Editor
      const editorElement = document.querySelector(
        `[data-comment-id="${commentId}"]`
      );
      if (editorElement) {
        editorElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }

      setActiveCommentId(commentId);
    }, 150);
  }, []);

  // Auto-scroll to comment when commentId is in URL (from notifications/deep links)
  useEffect(() => {
    if (commentIdParam && comments.length > 0) {
      scrollToComment(commentIdParam);
      // Clear the URL parameter after scrolling completes
      const timer = setTimeout(() => {
        setCommentIdParam(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [commentIdParam, comments, scrollToComment, setCommentIdParam]);

  // Reactive Sync: Invalidate queries when document marks change
  useEffect(() => {
    if (!editor) return;

    const handleTransaction = () => {
      const markIds = new Set<string>();
      editor.state.doc.descendants((node) => {
        node.marks.forEach((mark) => {
          if (mark.type.name === "comment") {
            markIds.add(mark.attrs.id);
          }
        });
      });

      const apiIds = new Set(comments.map((c) => c.id));

      let hasNewMarks = false;
      for (const id of markIds) {
        if (!apiIds.has(id)) {
          hasNewMarks = true;
          break;
        }
      }

      let hasDeletedMarks = false;
      if (!hasNewMarks) {
        for (const comment of comments) {
          if (
            !comment.parentId &&
            comment.rangeFrom !== null &&
            !markIds.has(comment.id)
          ) {
            hasDeletedMarks = true;
            break;
          }
        }
      }

      if (hasNewMarks || hasDeletedMarks) {
        queryClient.invalidateQueries({
          queryKey: lyricsCommentKeys.list(trackId),
        });
      }
    };

    editor.on("transaction", handleTransaction);
    return () => {
      editor.off("transaction", handleTransaction);
    };
  }, [editor, comments, queryClient, trackId]);

  const deleteComment = useDeleteLyricsComment();

  const handleAddComment = async (content: string) => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    if (from === to) return;

    const text = editor.state.doc.textBetween(from, to);
    const id = nanoid();

    try {
      await createComment.mutateAsync({
        trackId,
        data: {
          id,
          content,
          rangeFrom: from,
          rangeTo: to,
          rangeText: text,
        },
      });

      editor.chain().focus().setComment(id).run();
    } catch (error) {
      console.error("Failed to create comment:", error);
    }
  };

  // Reconciliation Effect: Inject missing anchors (marks) from API
  useEffect(() => {
    if (!editor) return;

    const { state, view } = editor;
    const { tr } = state;
    let hasChanges = false;

    const currentMarks = new Set<string>();
    state.doc.descendants((node) => {
      node.marks.forEach((mark) => {
        if (mark.type.name === "comment") {
          currentMarks.add(mark.attrs.id);
        }
      });
    });

    // 1. Remove marks that are in the editor but NOT in the API (deleted or resolved)
    const apiIds = new Set(comments.map((c) => c.id));
    currentMarks.forEach((id) => {
      if (!apiIds.has(id)) {
        state.doc.descendants((node, pos) => {
          node.marks.forEach((mark) => {
            if (mark.type.name === "comment" && mark.attrs.id === id) {
              tr.removeMark(
                pos,
                pos + node.nodeSize,
                state.schema.marks.comment
              );
              hasChanges = true;
            }
          });
        });
      }
    });

    // 2. Inject marks for comments that are in the API but MISSING in editor
    comments.forEach((comment) => {
      if (
        !comment.parentId &&
        comment.rangeFrom !== null &&
        comment.rangeTo !== null &&
        !currentMarks.has(comment.id)
      ) {
        const from = Math.max(
          0,
          Math.min(comment.rangeFrom, state.doc.content.size)
        );
        const to = Math.max(
          0,
          Math.min(comment.rangeTo, state.doc.content.size)
        );

        if (from < to) {
          tr.addMark(
            from,
            to,
            state.schema.marks.comment.create({ id: comment.id })
          );
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      view.dispatch(tr);
    }
  }, [editor, comments]);

  if (trackLoading || !provider) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col container mx-auto py-6 sm:py-12 max-w-6xl px-4 sm:px-6 min-h-screen gap-6">
      <div className="flex-1">
        <div className="mb-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/projects/${projectId}/tracks/${trackId}`)
            }
            className="mb-4 text-xs sm:text-sm"
          >
            ← Back to Track
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 uppercase tracking-tighter">
            {track?.name}
          </h1>
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-tight">
            Lyrics
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <Card className="max-w-3xl grow">
            <CardContent>
              <EditorContent editor={editor} />
            </CardContent>
          </Card>

          <div className="w-full lg:w-100 shrink-0">
            <LyricsCommentsSidebar
              trackId={trackId}
              projectOwnerId={project?.owner.userId}
              activeCommentId={activeCommentId}
              editor={editor}
              deleteComment={deleteComment}
            />
          </div>
        </div>

        <FloatingCommentButton
          editor={editor}
          onAddComment={handleAddComment}
        />
      </div>

      <CommentHoverPreview
        comments={comments}
        commentId={hoveredCommentId}
        targetElement={hoveredElement}
      />
    </div>
  );
}
