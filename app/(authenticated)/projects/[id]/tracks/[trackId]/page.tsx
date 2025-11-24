"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { UserAvatar } from "@daveyplate/better-auth-ui";
import { useParams, useRouter } from "next/navigation";
import { useQueryState, parseAsInteger } from "nuqs";
import { useQueryClient } from "@tanstack/react-query";
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
import { TextareaAutosize } from "@/components/ui/textarea";
import {
  useTrack,
  useUpdateTrack,
  useDeleteTrack,
  useVersions,
  useUploadVersion,
  useUpdateVersion,
  useDeleteVersion,
  useSetMasterVersion,
  trackKeys,
  Track,
  TrackVersion,
} from "@/lib/hooks/use-tracks";
import {
  Comment,
  useComments,
  useCreateComment,
  useDeleteComment,
  useResolveComment,
  useUnresolveComment,
} from "@/lib/hooks/use-comments";
import { useTheme } from "next-themes";
import { Progress } from "@/components/ui/progress";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { formatTime } from "@/lib/utils";
import WavesurferPlayer from "@wavesurfer/react";
import { Checkbox } from "@/components/ui/checkbox";
import { format, formatDistanceToNow } from "date-fns";

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
  const resolveComment = useResolveComment();
  const unresolveComment = useUnresolveComment();

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

  const handleResolve = async () => {
    await resolveComment.mutateAsync({
      trackId,
      versionId,
      commentId: comment.id,
    });
  };

  const handleUnresolve = async () => {
    await unresolveComment.mutateAsync({
      trackId,
      versionId,
      commentId: comment.id,
    });
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
          {comment.user ? (
            <UserAvatar user={comment.user} />
          ) : (
            <div className="size-8 rounded-full bg-destructive flex items-center justify-center text-destructive-foreground">
              ?
            </div>
          )}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {comment.user ? comment.user.name : "Deleted User"}
            </span>
            {comment.timestamp !== null && (
              <button
                onClick={() => onSeek?.(comment.timestamp!)}
                className="text-xs text-orange-600 hover:text-orange-700 font-medium"
              >
                {formatTime(comment.timestamp)}
              </button>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
              })}
            </span>
            {comment.resolvedAt && <Badge variant="secondary">Resolved</Badge>}
          </div>
          <p className="text-sm">{comment.content}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Reply
            </button>
            {/* Only show resolve/unresolve for top-level comments (with timestamp) */}
            {comment.timestamp !== null && !comment.parentId && (
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
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    {resolveComment.isPending ? "Resolving..." : "Resolve"}
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => handleDelete(comment.id)}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Delete
            </button>
          </div>

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

// Waveform component using WaveSurfer.js with comment markers
const Waveform = memo(
  function Waveform({
    track,
    version,
    comments,
    onTimeClick,
    onCommentClick,
  }: {
    track: Track;
    version: TrackVersion;
    comments?: Comment[];
    onTimeClick?: (time: number) => void;
    onCommentClick?: (commentId: string) => void;
  }) {
    const {
      waveSurfer: playerWaveSurfer,
      version: playerVersion,
      setIsPlaying: setPlayerIsPlaying,
      isPlaying: playerIsPlaying,
      isLoading: playerIsLoading,
      loadVersion,
    } = usePlayerStore();
    const [waveSurfer, setWaveSurfer] = useState<WaveSurfer>();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { theme } = useTheme();

    // Sync global player with local player
    useEffect(() => {
      if (playerWaveSurfer && waveSurfer && playerVersion?.id === version.id) {
        const cleanupEvents = () => {
          playerWaveSurfer.un("play", () => {});
          playerWaveSurfer.un("pause", () => {});
          playerWaveSurfer.un("timeupdate", () => {});
          waveSurfer.un("click", () => {});
        };

        cleanupEvents();

        // Global player handlers
        const handleGlobalPlay = () => {
          setIsPlaying(true);
          const currentTime = playerWaveSurfer.getCurrentTime();
          waveSurfer.setTime(currentTime);
        };

        const handleGlobalPause = () => {
          setIsPlaying(false);
          waveSurfer.pause();
        };

        const handleGlobalTimeUpdate = () => {
          waveSurfer.setTime(playerWaveSurfer.getCurrentTime());
        };

        // Local player handlers
        const handleLocalClick = (time: number) => {
          const absoluteTime = time * waveSurfer.getDuration();
          playerWaveSurfer.setTime(absoluteTime);
          onTimeClick?.(absoluteTime);
        };

        // Listen to global player events
        playerWaveSurfer.on("play", handleGlobalPlay);
        playerWaveSurfer.on("pause", handleGlobalPause);
        playerWaveSurfer.on("timeupdate", handleGlobalTimeUpdate);

        // Listen to local player events
        waveSurfer.on("click", handleLocalClick);

        // Initial sync
        if (playerIsPlaying) {
          handleGlobalPlay();
        }

        return cleanupEvents;
      }
    }, [
      onTimeClick,
      playerIsPlaying,
      playerVersion,
      playerWaveSurfer,
      waveSurfer,
      version,
    ]);

    const handlePlayPause = () => {
      // If no player loaded yet, or different version, load it
      if (!playerWaveSurfer || playerVersion?.id !== version.id) {
        loadVersion(track, version, true);
      } else {
        // Same version already loaded, just toggle play/pause
        if (playerIsPlaying) {
          playerWaveSurfer.pause();
          setPlayerIsPlaying(false);
        } else {
          playerWaveSurfer.play();
          setPlayerIsPlaying(true);
        }
      }
    };

    // Get top-level comments with timestamps
    const timestampComments = comments?.filter(
      (c) => c.timestamp !== null && !c.parentId
    );

    return (
      <div className="space-y-3">
        <div className="relative">
          {isLoading && (
            <div className="z-10 flex items-center justify-center h-30">
              <div className="size-12 border border-foreground/50 animate-spin" />
            </div>
          )}
          {waveSurfer && !isLoading && (
            <div className="flex">
              {timestampComments?.map((comment) => (
                <div
                  key={comment.id}
                  className="absolute z-10 transform -translate-x-1/2 hover:scale-110 hover:z-50 transition-transform cursor-pointer"
                  style={{
                    left: `${(comment.timestamp! / waveSurfer.getDuration()) * 100}%`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCommentClick?.(comment.id);
                  }}
                >
                  {comment.user ? (
                    <UserAvatar user={comment.user} className="size-5" />
                  ) : (
                    <div className="size-5 rounded-full bg-destructive flex items-center justify-center text-destructive-foreground text-xs">
                      ?
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <WavesurferPlayer
            height={isLoading ? 0 : 120}
            waveColor={theme === "dark" ? "hsl(0 0% 35%)" : "hsl(0 0% 65%)"}
            progressColor={theme === "dark" ? "hsl(0 0% 85%)" : "hsl(0 0% 25%)"}
            cursorColor={theme === "dark" ? "hsl(0 0% 85%)" : "hsl(0 0% 25%)"}
            url={version.audioUrl}
            onReady={(ws) => {
              ws.setVolume(0);
              setWaveSurfer(ws);
              setIsLoading(false);

              // Add click handler that always works, independent of global player
              ws.on("click", (relativeTime) => {
                const absoluteTime = relativeTime * ws.getDuration();
                onTimeClick?.(absoluteTime);
              });
            }}
            onPlay={() => {
              if (playerVersion?.id !== version.id) {
                loadVersion(track, version, true);
              }
              setIsPlaying(true);
            }}
            onPause={() => setIsPlaying(false)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handlePlayPause}
            variant="outline"
            size="sm"
            disabled={playerIsLoading && playerVersion?.id === version.id}
          >
            {isPlaying && playerVersion?.id === version.id ? "Pause" : "Play"}
          </Button>
          {waveSurfer && waveSurfer.getDuration() > 0 && (
            <span className="text-sm text-muted-foreground">
              {formatTime(waveSurfer.getCurrentTime())} /{" "}
              {formatTime(waveSurfer.getDuration())}
            </span>
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function to prevent re-renders
    // Only re-render if version ID or comments actually changed
    const prevComments = prevProps.comments ?? [];
    const nextComments = nextProps.comments ?? [];

    return (
      prevProps.version.id === nextProps.version.id &&
      prevProps.track.id === nextProps.track.id &&
      prevComments.length === nextComments.length &&
      prevComments.every((c, i) => c.id === nextComments[i]?.id)
    );
  }
);

export default function TrackDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
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
  const {
    waveSurfer: playerWaveSurfer,
    version: playerVersion,
    loadVersion,
    setIsPlaying,
  } = usePlayerStore();

  // Find master version
  const defaultVersion = versions?.find((v) => v.isMaster);

  // Use URL query param for selected version number
  const [versionNumberParam, setVersionNumberParam] = useQueryState(
    "v",
    parseAsInteger
  );

  // Use URL query param for comment ID to enable direct linking to comments
  const [commentIdParam, setCommentIdParam] = useQueryState("c");

  // Get the currently selected version object based on URL param
  // If no param, default to master version
  const selectedVersion =
    versionNumberParam !== null
      ? versions?.find((v) => v.versionNumber === versionNumberParam)
      : defaultVersion;

  // Track the previous master version ID to detect new uploads
  const previousMasterIdRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);

  // State for showing resolved comments
  const [showResolvedComments, setShowResolvedComments] = useState(false);

  // Update URL param when defaultVersion changes (new upload or initial load)
  useEffect(() => {
    if (defaultVersion && versions) {
      const masterId = defaultVersion.id;
      const masterVersionNumber = defaultVersion.versionNumber;

      // On initial load, set the previousMasterIdRef and respect the URL param if valid
      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;
        previousMasterIdRef.current = masterId;

        // If URL has a valid version param, don't override it
        if (versionNumberParam !== null) {
          const hasValidSelection = versions.some(
            (v) => v.versionNumber === versionNumberParam
          );

          if (!hasValidSelection) {
            // Invalid version number in URL, redirect to master
            setVersionNumberParam(masterVersionNumber);
          }
          // Otherwise, respect the valid URL param
        }
        // If versionNumberParam is null, we don't set it - let it stay null to show master
        return;
      }

      // After initialization, only auto-switch if master version changed (new upload)
      if (previousMasterIdRef.current !== masterId) {
        setVersionNumberParam(masterVersionNumber);
        previousMasterIdRef.current = masterId;
      }
    }
  }, [defaultVersion, versions, versionNumberParam, setVersionNumberParam]);

  // Refetch versions when URL param changes and version doesn't exist
  // This handles the case when clicking a notification while already on the track page
  useEffect(() => {
    if (versionNumberParam !== null && versions && !versionsLoading) {
      const versionExists = versions.some(
        (v) => v.versionNumber === versionNumberParam
      );

      // If the requested version doesn't exist, refetch to get latest versions
      if (!versionExists) {
        queryClient.invalidateQueries({
          queryKey: trackKeys.versions(trackId),
        });
      }
    }
  }, [versionNumberParam, versions, versionsLoading, trackId, queryClient]);

  // Fetch comments for the selected version
  const { data: comments = [], isLoading: commentsLoading } = useComments(
    trackId,
    selectedVersion?.id || "",
    showResolvedComments
  );

  // Auto-scroll to comment when commentId is in URL
  useEffect(() => {
    if (commentIdParam && selectedVersion) {
      // Add a small delay to ensure DOM is ready and comments are rendered
      const timer = setTimeout(() => {
        const commentElement = document.getElementById(
          `comment-${commentIdParam}`
        );
        if (commentElement) {
          commentElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
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
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [commentIdParam, selectedVersion, comments]);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedName, setEditedName] = useState("");

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [versionNotes, setVersionNotes] = useState("");
  const [isUploadingVersion, setIsUploadingVersion] = useState(false);
  const [versionUploadProgress, setVersionUploadProgress] = useState(0);
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
    setVersionUploadProgress(0);
    try {
      await uploadVersion.mutateAsync({
        file: versionFile,
        trackId,
        projectId,
        notes: versionNotes || undefined,
        onProgress: (loaded, total) => {
          setVersionUploadProgress(Math.round((loaded / total) * 100));
        },
      });
      setIsUploadDialogOpen(false);
      setVersionFile(null);
      setVersionNotes("");
      setVersionUploadProgress(0);
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
    if (versionId === selectedVersion?.id) {
      const remainingVersions = versions?.filter((v) => v.id !== versionId);
      if (remainingVersions && remainingVersions.length > 0) {
        // Select master version if available, otherwise the first one
        const nextVersion =
          remainingVersions.find((v) => v.isMaster) || remainingVersions[0];
        setVersionNumberParam(nextVersion.versionNumber);
      }
    }
    await deleteVersion.mutateAsync({ trackId, versionId });
  };

  const handleSetMasterVersion = async (versionId: string) => {
    await setMasterVersion.mutateAsync({ trackId, versionId });
  };

  const handleSelectVersion = (versionNumber: number) => {
    setVersionNumberParam(versionNumber);
    setCommentTimestamp(0);
  };

  const handleWaveformClick = useCallback((time: number) => {
    setCommentTimestamp(time);
  }, []);

  const handleSeekToTime = (time: number) => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    // If no player or wrong version loaded, load the correct version first
    if (!playerWaveSurfer || playerVersion?.id !== selectedVersion?.id) {
      if (selectedVersion && track) {
        loadVersion(track, selectedVersion, false);
        // Wait for the player to be ready, then seek and play
        const checkInterval = setInterval(() => {
          const { waveSurfer, isLoading } = usePlayerStore.getState();
          if (waveSurfer && !isLoading) {
            clearInterval(checkInterval);
            waveSurfer.setTime(time);
            waveSurfer.play();
            setIsPlaying(true);
          }
        }, 100);
        // Clear interval after 5 seconds if player doesn't load
        setTimeout(() => clearInterval(checkInterval), 5000);
      }
    } else {
      // Player is already loaded with the correct version
      playerWaveSurfer.setTime(time);
      playerWaveSurfer.play();
      setIsPlaying(true);
    }
  };

  const handleCommentClick = useCallback(
    (commentId: string) => {
      setCommentIdParam(commentId);
      // The useEffect will handle scrolling automatically
    },
    [setCommentIdParam]
  );

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
              Created {format(new Date(track.createdAt), "P")}
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
              value={selectedVersion?.versionNumber.toString() || ""}
              onValueChange={(value) => handleSelectVersion(parseInt(value))}
            >
              <SelectTrigger className="border-foreground" size="sm">
                <SelectValue placeholder="Select version" />
              </SelectTrigger>
              <SelectContent>
                {versions?.map((version) => (
                  <SelectItem
                    key={version.id}
                    value={version.versionNumber.toString()}
                  >
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
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={versions?.length === 1}
                  >
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
                  track={track}
                  version={selectedVersion}
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Comments ({comments.length})</CardTitle>
                  <CardDescription>
                    Click on the waveform to add a comment at a specific time
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="show-resolved"
                    checked={showResolvedComments}
                    onCheckedChange={(checked) =>
                      setShowResolvedComments(checked as boolean)
                    }
                  />
                  <Label htmlFor="show-resolved" className="mb-0">
                    Show resolved
                  </Label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedVersion && (
                <CommentForm
                  trackId={trackId}
                  versionId={selectedVersion.id}
                  timestamp={commentTimestamp}
                  onCancel={() => {
                    setCommentTimestamp(0);
                  }}
                />
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
              <TextareaAutosize
                id="version-notes"
                className="resize-none"
                value={versionNotes}
                onChange={(e) => setVersionNotes(e.target.value)}
                placeholder="What changed in this version..."
                minRows={1}
                maxRows={8}
              />
            </div>
            {isUploadingVersion && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Uploading...</span>
                  <span>{versionUploadProgress}%</span>
                </div>
                <Progress value={versionUploadProgress} className="h-full" />
              </div>
            )}
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
              <TextareaAutosize
                className="resize-none"
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
                minRows={1}
                maxRows={10}
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
