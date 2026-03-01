"use client";

import "./styles.css";

import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import StarterKit from "@tiptap/starter-kit";
import { useParams, useRouter } from "next/navigation";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import { authClient } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";
import { useTrack } from "@/hooks/use-tracks";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { getWebSocketUrl } from "@/lib/websocket-client";

export default function Lyrics() {
  const params = useParams();
  const router = useRouter();
  const trackId = params.trackId as string;
  const projectId = params.id as string;

  const { data: track, isLoading: trackLoading } = useTrack(trackId);
  const { data: session } = authClient.useSession();

  const provider = new HocuspocusProvider({
    url: `${getWebSocketUrl()}/ws`,
    name: trackId,
    token: session?.session.token,
  });

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
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
          },
        }),
      ],
      content: "",
    },
    [session]
  );

  if (trackLoading || !provider) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto py-6 sm:py-12 max-w-6xl px-4 sm:px-6 min-h-screen">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() =>
            router.push(`/projects/${projectId}/tracks/${trackId}`)
          }
          className="mb-4 text-xs sm:text-sm"
        >
          ← Back to Track
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 uppercase tracking-tighter">
          {track?.name}
        </h1>

        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-tight">
            Lyrics
          </p>
          <EditorContent editor={editor} className="bg-card border" />
          <p className="text-muted-foreground text-xs font-medium tracking-tight">
            This is a collaborative editor. Changes are synced in real-time with
            other users editing this track&apos;s lyrics and changes are saved
            automatically
          </p>
        </div>
      </div>

      <div className="mt-4 text-xs text-muted-foreground"></div>
    </div>
  );
}
