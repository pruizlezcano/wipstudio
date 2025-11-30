"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryState, parseAsInteger } from "nuqs";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useTrack,
  useDeleteTrack,
  useVersions,
  useDeleteVersion,
  useSetMasterVersion,
  trackKeys,
} from "@/hooks/use-tracks";
import { useComments } from "@/hooks/use-comments";
import { usePlayerStore } from "@/stores/playerStore";
import { CommentThread } from "@/components/features/comments/comment-thread";
import { CommentForm } from "@/components/features/comments/comment-form";
import { Waveform } from "@/components/features/tracks/waveform";
import { TrackEditDialog } from "@/components/features/tracks/track-edit-dialog";
import { VersionUploadDialog } from "@/components/features/tracks/version-upload-dialog";
import { VersionEditDialog } from "@/components/features/tracks/version-edit-dialog";
import { LoadingSpinner } from "@/components/common/loading-spinner";

export default function TrackDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const trackId = params.trackId as string;
  const projectId = params.id as string;

  const { data: track, isLoading: trackLoading } = useTrack(trackId);
  const { data: versions, isLoading: versionsLoading } = useVersions(trackId);
  const deleteTrack = useDeleteTrack();
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
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState<{
    versionId: string;
    notes: string;
  } | null>(null);
  const [isEditVersionDialogOpen, setIsEditVersionDialogOpen] = useState(false);
  const [commentTimestamp, setCommentTimestamp] = useState<number | undefined>(
    0
  );

  const handleDeleteTrack = async () => {
    if (!track) return;
    await deleteTrack.mutateAsync(track.id);
    router.push(`/projects/${projectId}`);
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
      // If clicking the same comment, clear first to force re-scroll
      if (commentIdParam === commentId) {
        setCommentIdParam(null);
        // Use setTimeout to ensure the state update completes before setting again
        setTimeout(() => setCommentIdParam(commentId), 0);
      } else {
        setCommentIdParam(commentId);
      }
    },
    [setCommentIdParam, commentIdParam]
  );

  if (trackLoading) {
    return <LoadingSpinner />;
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
    return <LoadingSpinner />;
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
            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
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
                  <AlertDialogAction
                    onClick={handleDeleteTrack}
                    className="bg-destructive text-white border-destructive hover:bg-white hover:text-destructive hover:border-destructive"
                  >
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
                      className="bg-destructive text-white border-destructive hover:bg-white hover:text-destructive hover:border-destructive"
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

      {/* Dialogs */}
      <TrackEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        trackId={trackId}
        currentName={track?.name || ""}
      />

      <VersionUploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        trackId={trackId}
        projectId={projectId}
      />

      <VersionEditDialog
        open={isEditVersionDialogOpen}
        onOpenChange={setIsEditVersionDialogOpen}
        trackId={trackId}
        versionId={editingVersion?.versionId || null}
        currentNotes={editingVersion?.notes || null}
      />
    </div>
  );
}
