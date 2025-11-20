"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { UserAvatar } from "@daveyplate/better-auth-ui";
import { useParams, useRouter } from "next/navigation";
import WaveSurfer from "wavesurfer.js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useTrack,
  useUpdateTrack,
  useDeleteTrack,
  useVersions,
  useUploadVersion,
  useUpdateVersion,
  useDeleteVersion,
  useSetMasterVersion,
} from "@/lib/hooks/use-tracks";
import {
  Comment,
  useComments,
  useCreateComment,
  useDeleteComment,
} from "@/lib/hooks/use-comments";
import { useTheme } from "next-themes";

// Comment Thread Component
function CommentThread({
  comment,
  trackId,
  versionId,
  onSeek,
}: {
  comment: Comment;
  trackId: string;
  versionId: string;
  onSeek?: (time: number) => void;
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-3" id={`comment-${comment.id}`}>
      <div className="flex gap-3">
        <div className="shrink-0">
          <UserAvatar user={comment.user} />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{comment.user.name}</span>
            {comment.timestamp !== null && (
              <button
                onClick={() => onSeek?.(comment.timestamp!)}
                className="text-xs text-orange-600 hover:text-orange-700 font-medium"
              >
                {formatTime(comment.timestamp)}
              </button>
            )}
            <span className="text-xs text-muted-foreground">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm">{comment.content}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Reply
            </button>
            <button
              onClick={() => handleDelete(comment.id)}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Delete
            </button>
          </div>

          {isReplying && (
            <form onSubmit={handleReply} className="mt-2 space-y-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                rows={2}
                className="text-sm"
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

// Comment Form Component
function CommentForm({
  trackId,
  versionId,
  timestamp,
  onCancel,
}: {
  trackId: string;
  versionId: string;
  timestamp?: number;
  onCancel?: () => void;
}) {
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
      {timestamp !== undefined && (
        <div className="text-sm text-muted-foreground">
          Commenting at {formatTime(timestamp)}
        </div>
      )}
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={
          timestamp !== undefined
            ? "Add a comment at this timestamp..."
            : "Add a general comment..."
        }
        rows={3}
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

// Define the ref type for Waveform
export interface WaveformRef {
  seekTo: (time: number) => void;
}

// Waveform component using WaveSurfer.js with comment markers
const Waveform = forwardRef<
  WaveformRef,
  {
    audioUrl: string;
    comments?: Comment[];
    onTimeClick?: (time: number) => void;
    onCommentClick?: (commentId: string) => void;
  }
>(({ audioUrl, comments = [], onTimeClick, onCommentClick }, ref) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const onTimeClickRef = useRef(onTimeClick);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const { theme } = useTheme();

  // Expose seekTo method via ref
  useImperativeHandle(
    ref,
    () => ({
      seekTo: (time: number) => {
        if (wavesurferRef.current) {
          wavesurferRef.current.seekTo(
            time / wavesurferRef.current.getDuration()
          );
        }
      },
    }),
    []
  );

  // Keep ref in sync with prop
  useEffect(() => {
    onTimeClickRef.current = onTimeClick;
  }, [onTimeClick]);

  useEffect(() => {
    if (!waveformRef.current) return;

    // Get theme-aware colors
    const isDark = theme === "dark";

    const waveColor = isDark ? "hsl(0 0% 35%)" : "hsl(0 0% 65%)";
    const progressColor = isDark ? "hsl(0 0% 85%)" : "hsl(0 0% 25%)";
    const cursorColor = isDark ? "hsl(0 0% 85%)" : "hsl(0 0% 25%)";

    // Initialize WaveSurfer
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor,
      progressColor,
      cursorColor,
      height: 120,
      normalize: true,
      backend: "WebAudio",
    });

    wavesurferRef.current = wavesurfer;

    // Load audio
    wavesurfer.load(audioUrl);

    // Event listeners
    wavesurfer.on("ready", () => {
      setIsLoading(false);
      setDuration(wavesurfer.getDuration());
    });

    wavesurfer.on("play", () => {
      setIsPlaying(true);
    });

    wavesurfer.on("pause", () => {
      setIsPlaying(false);
    });

    wavesurfer.on("finish", () => {
      setIsPlaying(false);
    });

    wavesurfer.on("timeupdate", (time) => {
      setCurrentTime(time);
    });

    wavesurfer.on("error", (error) => {
      console.error("WaveSurfer error:", error);
      setIsLoading(false);
    });

    // Handle clicks on waveform to add comments
    wavesurfer.on("click", (relativeX) => {
      if (onTimeClickRef.current) {
        const clickTime = relativeX * wavesurfer.getDuration();
        onTimeClickRef.current(clickTime);
      }
    });

    // Cleanup
    return () => {
      wavesurfer.destroy();
    };
  }, [audioUrl, theme]);

  const handlePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Get top-level comments with timestamps
  const timestampComments = comments.filter(
    (c) => c.timestamp !== null && !c.parentId
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <div ref={waveformRef} className="overflow-visible relative pt-4" />
        {isLoading && (
          <div className="container mx-auto py-12 flex flex-col items-center justify-center gap-4">
            <div className="size-12 border border-foreground/50 animate-spin" />
          </div>
        )}
        {!isLoading &&
          duration > 0 &&
          timestampComments.map((comment) => (
            <div
              key={comment.id}
              className="absolute cursor-pointer group"
              style={{
                left: `${(comment.timestamp! / duration) * 100}%`,
                top: "4px",
                transform: "translateX(-50%)",
                zIndex: 20,
                height: "120px",
              }}
              onClick={(e) => {
                e.stopPropagation();
                onCommentClick?.(comment.id);
              }}
            >
              {/* Vertical line */}
              <div className="absolute w-0.5 bg-orange-500 group-hover:bg-orange-600 transition-colors h-full left-1/2 -translate-x-1/2" />

              {/* Avatar circle */}
              <UserAvatar user={comment.user} size="sm" />
            </div>
          ))}
      </div>
      <div className="flex items-center gap-2">
        <Button
          onClick={handlePlayPause}
          variant="outline"
          size="sm"
          disabled={isLoading}
        >
          {isPlaying ? "Pause" : "Play"}
        </Button>
        {!isLoading && duration > 0 && (
          <span className="text-sm text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        )}
        {timestampComments.length > 0 && (
          <span className="text-sm text-muted-foreground ml-auto">
            {timestampComments.length} comment
            {timestampComments.length !== 1 ? "s" : ""} on timeline
          </span>
        )}
      </div>
    </div>
  );
});

Waveform.displayName = "Waveform";

export default function TrackDetailPage() {
  const params = useParams();
  const router = useRouter();
  const trackId = params.trackId as string;
  const projectId = params.id as string;

  const { data: track, isLoading: trackLoading } = useTrack(trackId);
  const { data: versions, isLoading: versionsLoading } = useVersions(trackId);
  const updateTrack = useUpdateTrack();
  const deleteTrack = useDeleteTrack();
  const uploadVersion = useUploadVersion();
  const updateVersion = useUpdateVersion();
  const deleteVersion = useDeleteVersion();
  const setMasterVersion = useSetMasterVersion();

  const waveformRef = useRef<WaveformRef>(null);

  // Find master version
  const defaultVersion = versions?.find((v) => v.isMaster);

  // State for selected version (for viewing waveform/comments)
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null
  );

  // Update selectedVersionId when defaultVersion changes
  useEffect(() => {
    if (defaultVersion && !selectedVersionId) {
      setSelectedVersionId(defaultVersion.id);
    }
  }, [defaultVersion, selectedVersionId]);

  // Get the currently selected version object
  const selectedVersion = versions?.find((v) => v.id === selectedVersionId);

  // Fetch comments for the selected version
  const { data: comments = [], isLoading: commentsLoading } = useComments(
    trackId,
    selectedVersionId || ""
  );

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedName, setEditedName] = useState("");

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [versionNotes, setVersionNotes] = useState("");
  const [isUploadingVersion, setIsUploadingVersion] = useState(false);
  const versionFileInputRef = useRef<HTMLInputElement>(null);

  const [editingVersion, setEditingVersion] = useState<{
    versionId: string;
    notes: string;
  } | null>(null);
  const [isEditVersionDialogOpen, setIsEditVersionDialogOpen] = useState(false);

  const [commentTimestamp, setCommentTimestamp] = useState<number | undefined>(
    0
  );

  const handleEditTrack = () => {
    if (track) {
      setEditedName(track.name);
      setIsEditDialogOpen(true);
    }
  };

  const handleUpdateTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!track) return;

    await updateTrack.mutateAsync({
      id: track.id,
      data: { name: editedName },
    });
    setIsEditDialogOpen(false);
  };

  const handleDeleteTrack = async () => {
    if (!track) return;
    await deleteTrack.mutateAsync(track.id);
    router.push(`/projects/${projectId}`);
  };

  const handleVersionFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVersionFile(file);
    }
  };

  const handleUploadVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionFile) return;

    setIsUploadingVersion(true);
    try {
      await uploadVersion.mutateAsync({
        file: versionFile,
        trackId,
        projectId,
        notes: versionNotes || undefined,
      });
      setIsUploadDialogOpen(false);
      setVersionFile(null);
      setVersionNotes("");
      if (versionFileInputRef.current) {
        versionFileInputRef.current.value = "";
      }
    } finally {
      setIsUploadingVersion(false);
    }
  };

  const handleEditVersion = (
    versionId: string,
    currentNotes: string | null
  ) => {
    setEditingVersion({
      versionId,
      notes: currentNotes || "",
    });
    setIsEditVersionDialogOpen(true);
  };

  const handleUpdateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVersion) return;

    await updateVersion.mutateAsync({
      trackId,
      versionId: editingVersion.versionId,
      notes: editingVersion.notes,
    });
    setIsEditVersionDialogOpen(false);
    setEditingVersion(null);
  };

  const handleDeleteVersion = async (versionId: string) => {
    // If deleting the currently selected version, switch to another one first
    if (versionId === selectedVersionId) {
      const remainingVersions = versions?.filter((v) => v.id !== versionId);
      if (remainingVersions && remainingVersions.length > 0) {
        // Select master version if available, otherwise the first one
        const nextVersion =
          remainingVersions.find((v) => v.isMaster) || remainingVersions[0];
        setSelectedVersionId(nextVersion.id);
      }
    }
    await deleteVersion.mutateAsync({ trackId, versionId });
  };

  const handleSetMasterVersion = async (versionId: string) => {
    await setMasterVersion.mutateAsync({ trackId, versionId });
  };

  const handleSelectVersion = (versionId: string) => {
    setSelectedVersionId(versionId);
    // Scroll to the waveform smoothly
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleWaveformClick = useCallback((time: number) => {
    setCommentTimestamp(time);
  }, []);

  const handleSeekToTime = useCallback((time: number) => {
    // Seek the waveform to the specified time
    if (waveformRef.current) {
      waveformRef.current.seekTo(time);
      // Scroll to the waveform so user can see the playback position
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const handleCommentClick = useCallback((commentId: string) => {
    const commentElement = document.getElementById(`comment-${commentId}`);
    if (commentElement) {
      commentElement.scrollIntoView({ behavior: "smooth", block: "center" });
      // Add a subtle highlight effect
      commentElement.classList.add(
        "ring-2",
        "ring-foreground",
        "ring-opacity-50"
      );
      setTimeout(() => {
        commentElement.classList.remove(
          "ring-2",
          "ring-foreground",
          "ring-opacity-50"
        );
      }, 2000);
    }
  }, []);

  if (trackLoading) {
    return (
      <div className="container mx-auto py-12 flex flex-col items-center justify-center gap-4 min-h-screen">
        <div className="size-12 border border-foreground/50 animate-spin" />
        <h1 className="text-2xl font-bold uppercase tracking-tighter mb-2">
          BACKSTAGE
        </h1>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Track not found</p>
        <Button
          onClick={() => router.push(`/projects/${projectId}`)}
          className="mt-4"
        >
          Back to Project
        </Button>
      </div>
    );
  }

  if (versionsLoading) {
    return (
      <div className="container mx-auto py-12 flex flex-col items-center justify-center gap-4 min-h-screen">
        <div className="size-12 border border-foreground/50 animate-spin" />
        <h1 className="text-2xl font-bold uppercase tracking-tighter mb-2">
          BACKSTAGE
        </h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 max-w-6xl px-6 min-h-screen">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push(`/projects/${projectId}`)}
          className="mb-4"
        >
          ← Back to Project
        </Button>

        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 uppercase tracking-tighter">
              {track.name}
            </h1>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-tight">
              Created {new Date(track.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEditTrack}>
              Rename
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Track</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Track</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete &quot;{track.name}&quot;?
                    This action cannot be undone and will delete all versions
                    and audio files.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteTrack}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {track.versionCount > 0 ? (
        <>
          {/* Version Selector */}
          <div className="mb-2 flex items-center gap-2 flex-wrap">
            <Select
              value={selectedVersionId || ""}
              onValueChange={handleSelectVersion}
            >
              <SelectTrigger className="border-foreground" size="sm">
                <SelectValue placeholder="Select version" />
              </SelectTrigger>
              <SelectContent>
                {versions?.map((version) => (
                  <SelectItem key={version.id} value={version.id}>
                    v{version.versionNumber}
                    {version.isMaster && (
                      <Badge className="ml-2 text-xs">MASTER</Badge>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedVersion && !selectedVersion.isMaster && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSetMasterVersion(selectedVersion.id)}
                disabled={setMasterVersion.isPending}
              >
                Set as Master
              </Button>
            )}
            {selectedVersion && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleEditVersion(selectedVersion.id, selectedVersion.notes)
                }
              >
                Edit Notes
              </Button>
            )}
            {selectedVersion && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Delete Version
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Version</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete version{" "}
                      {selectedVersion.versionNumber}? This action cannot be
                      undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteVersion(selectedVersion.id)}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <div className="ml-auto">
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsUploadDialogOpen(true)}
              >
                + New Version
              </Button>
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>
                  {selectedVersion
                    ? `v${selectedVersion.versionNumber}`
                    : "Select a version"}
                </CardTitle>
                {selectedVersion?.isMaster && (
                  <Badge className="text-xs">MASTER</Badge>
                )}
              </div>
              {selectedVersion?.notes && (
                <CardDescription className="mt-2">
                  {selectedVersion.notes}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {selectedVersion && (
                <Waveform
                  ref={waveformRef}
                  audioUrl={selectedVersion.audioUrl}
                  comments={comments}
                  onTimeClick={handleWaveformClick}
                  onCommentClick={handleCommentClick}
                />
              )}
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle>Comments ({comments.length})</CardTitle>
              <CardDescription>
                Click on the waveform to add a comment at a specific time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedVersion && (
                <div className="rounded-lg border bg-card p-4">
                  <CommentForm
                    trackId={trackId}
                    versionId={selectedVersion.id}
                    timestamp={commentTimestamp}
                    onCancel={() => {
                      setCommentTimestamp(0);
                    }}
                  />
                </div>
              )}

              {commentsLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading comments...
                </p>
              ) : comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <CommentThread
                      key={comment.id}
                      comment={comment}
                      trackId={trackId}
                      versionId={selectedVersion!.id}
                      onSeek={handleSeekToTime}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground uppercase font-medium tracking-tight">
                  No comments yet. Click on the waveform to add a comment at a
                  specific time.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No versions available</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Track Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Track</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateTrack} className="space-y-4">
            <div>
              <Label htmlFor="editTrackName">Track Name</Label>
              <Input
                id="editTrackName"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Enter track name"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upload Version Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload New Version</DialogTitle>
            <DialogDescription>
              Upload a new version of this track
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUploadVersion} className="space-y-4">
            <div>
              <Label htmlFor="version-file">Audio File</Label>
              <Input
                id="version-file"
                ref={versionFileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleVersionFileSelect}
                required
              />
              {versionFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  Selected: {versionFile.name} (
                  {(versionFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="version-notes">Notes (Optional)</Label>
              <Textarea
                id="version-notes"
                value={versionNotes}
                onChange={(e) => setVersionNotes(e.target.value)}
                placeholder="What changed in this version..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUploadDialogOpen(false)}
                disabled={isUploadingVersion}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUploadingVersion || !versionFile}
              >
                {isUploadingVersion ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Version Dialog */}
      <Dialog
        open={isEditVersionDialogOpen}
        onOpenChange={setIsEditVersionDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Version Notes</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateVersion} className="space-y-4">
            <div>
              <Label htmlFor="editVersionNotes">Notes</Label>
              <Textarea
                id="editVersionNotes"
                value={editingVersion?.notes || ""}
                onChange={(e) =>
                  setEditingVersion(
                    editingVersion
                      ? { ...editingVersion, notes: e.target.value }
                      : null
                  )
                }
                placeholder="Enter version notes"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditVersionDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
