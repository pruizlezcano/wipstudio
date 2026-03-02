import { Mark, mergeAttributes } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    comment: {
      /**
       * Set a comment mark
       */
      setComment: (id: string) => ReturnType;
      /**
       * Remove comments from the selection
       */
      unsetComment: () => ReturnType;
      /**
       * Helper for external sync: set a mark at a specific range
       */
      setCommentMark: (id: string, from: number, to: number) => ReturnType;
    };
  }
}

export interface CommentRange {
  id: string; // The parent comment's ID
  from: number;
  to: number;
  text?: string; // Optional: store the text to help relocate if positions change
}

export interface CommentOptions {
  HTMLAttributes: Record<string, string | number | boolean>;
  onCommentActivated: (id: string | null) => void;
  onCommentHover?: (id: string | null, element: HTMLElement | null) => void;
}

export interface CommentStorage {
  activeCommentId: string | null;
}

// No plugin key needed as we use standard marks

export const CommentExtension = Mark.create<CommentOptions, CommentStorage>({
  name: "comment",

  addOptions() {
    return {
      HTMLAttributes: {
        class: "comment-mark",
      },
      onCommentActivated: () => {},
      onCommentHover: () => {},
    };
  },

  addStorage() {
    return {
      activeCommentId: null,
    };
  },

  // We still define attributes for HTML serialization, but won't use marks in the doc
  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-comment-id"),
        renderHTML: (
          attributes: Record<string, string | number | boolean>
        ) => ({
          "data-comment-id": attributes.id,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-comment-id]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  addProseMirrorPlugins() {
    const options = this.options;

    return [
      new Plugin({
        key: new PluginKey("commentActions"),
        props: {
          // Handle clicks on comment marks
          handleClick(view, pos) {
            const { schema } = view.state;
            const markType = schema.marks.comment;
            const $pos = view.state.doc.resolve(pos);
            const mark = markType.isInSet($pos.marks());

            if (mark) {
              options.onCommentActivated(mark.attrs.id);
              return true;
            }

            return false;
          },

          handleDOMEvents: {
            mouseover: (view, event) => {
              const target = event.target as HTMLElement;
              const commentMark = target.closest("[data-comment-id]");

              if (commentMark) {
                const commentId = commentMark.getAttribute("data-comment-id");
                if (commentId && options.onCommentHover) {
                  options.onCommentHover(commentId, commentMark as HTMLElement);
                }
              }

              return false;
            },
            mouseout: (view, event) => {
              const target = event.target as HTMLElement;
              const commentMark = target.closest("[data-comment-id]");

              if (commentMark && options.onCommentHover) {
                const relatedTarget = event.relatedTarget as HTMLElement;
                const stillInComment =
                  relatedTarget?.closest("[data-comment-id]");

                if (!stillInComment) {
                  options.onCommentHover(null, null);
                }
              }

              return false;
            },
          },
        },
      }),
    ];
  },

  onTransaction({ transaction }) {
    if (!transaction.selectionSet) return;

    const pos = transaction.selection.$from.pos;
    const markType = this.editor.schema.marks.comment;
    const $pos = transaction.doc.resolve(pos);
    const mark = markType.isInSet($pos.marks());
    const foundCommentId = mark ? mark.attrs.id : null;

    if (this.storage.activeCommentId !== foundCommentId) {
      this.storage.activeCommentId = foundCommentId;
      this.options.onCommentActivated(foundCommentId);
    }
  },

  addCommands() {
    return {
      setComment:
        (id) =>
        ({ commands }) => {
          return commands.setMark(this.name, { id });
        },
      unsetComment:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
      setCommentMark:
        (id, from, to) =>
        ({ state, dispatch }) => {
          if (dispatch) {
            dispatch(
              state.tr.addMark(
                from,
                to,
                state.schema.marks.comment.create({ id })
              )
            );
          }
          return true;
        },
    };
  },
});
