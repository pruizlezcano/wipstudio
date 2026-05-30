"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryState, parseAsInteger } from "nuqs";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useTrack,
  useDeleteTrack,
  useVersions,
  useDeleteVersion,
  useSetMasterVersion,
  trackKeys,
} from "@/hooks/use-tracks";
import { useProject } from "@/hooks/use-projects";
import { useComments } from "@/hooks/use-comments";
import { usePlayerStore } from "@/stores/playerStore";
import { CommentThread } from "@/components/features/comments/comment-thread";
import { CommentForm } from "@/components/features/comments/comment-form";
import { Waveform } from "@/components/features/tracks/waveform";
import { TrackEditDialog } from "@/components/features/tracks/track-edit-dialog";
import { VersionUploadDialog } from "@/components/features/tracks/version-upload-dialog";
import { VersionEditDialog } from "@/components/features/tracks/version-edit-dialog";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { ErrorState } from "@/components/common/error-state";
import {
  FullScreenDropzone,
  FullScreenDropzoneRef,
} from "@/components/common/full-screen-dropzone";
import { BackButton } from "@/components/common/back-button";
import { useUIStore } from "@/stores/uiStore";
import type { TrackVersion } from "@/types";
import WaveSurfer from "wavesurfer.js";

export default function TrackDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const trackId = params.trackId as string;
  const projectId = params.id as string;
  const dropzoneRef = useRef<FullScreenDropzoneRef>(null);

  const { data: project } = useProject(projectId);

  const projectOwnerId = useMemo(
    () => project?.members?.find((m) => m.isOwner)?.userId,
    [project?.members]
  );
  const {
    data: track,
    isLoading: trackLoading,
    error: trackError,
  } = useTrack(trackId);
  const {
    data: versions,
    isLoading: versionsLoading,
    error: versionsError,
  } = useVersions(trackId);
  const deleteTrack = useDeleteTrack();
  const deleteVersion = useDeleteVersion();
  const setMasterVersion = useSetMasterVersion();
  const {
    track: playerTrack,
    waveSurfer: playerWaveSurfer,
    version: playerVersion,
    currentTime: playerCurrentTime,
    isPlaying: playerIsPlaying,
    usesExternalWaveSurfer,
    activateExternalWaveSurfer,
    loadVersion,
    setIsPlaying,
    clearPlayer,
    setPeaks,
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

  const playingTrackVersion =
    playerTrack?.id === trackId
      ? versions?.find((version) => version.id === playerVersion?.id)
      : undefined;

  // Get the currently selected version object based on URL param
  // If no param, prefer the currently playing version for this track, then fall back to master
  const selectedVersion =
    versionNumberParam !== null
      ? versions?.find((v) => v.versionNumber === versionNumberParam)
      : playingTrackVersion || defaultVersion;
  const waveformInstancesRef = useRef<Record<string, WaveSurfer>>({});
  const [loadedWaveformIds, setLoadedWaveformIds] = useState<string[]>([]);

  // Track the previous master version ID to detect new uploads
  const previousMasterIdRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);

  // State for showing resolved comments
  const [showResolvedComments, setShowResolvedComments] = useState(false);

  // State for sorting comments
  const [commentSortBy, setCommentSortBy] = useState<"createdAt" | "timestamp">(
    "createdAt"
  );
  const [areVersionNotesExpanded, setAreVersionNotesExpanded] = useState(false);
  const [doVersionNotesOverflow, setDoVersionNotesOverflow] = useState(false);
  const versionNotesContainerRef = useRef<HTMLDivElement | null>(null);
  const versionNotesMeasureRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    setAreVersionNotesExpanded(false);
  }, [selectedVersion?.id]);

  useEffect(() => {
    const container = versionNotesContainerRef.current;
    const measure = versionNotesMeasureRef.current;

    if (!container || !measure) {
      setDoVersionNotesOverflow(false);
      return;
    }

    if (areVersionNotesExpanded) {
      setDoVersionNotesOverflow(true);
      return;
    }

    const updateOverflow = () => {
      setDoVersionNotesOverflow(
        measure.getBoundingClientRect().width >
          container.getBoundingClientRect().width + 1
      );
    };

    updateOverflow();

    const resizeObserver = new ResizeObserver(updateOverflow);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [selectedVersion?.id, selectedVersion?.notes, areVersionNotesExpanded]);

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

  // Fetch ALL comments for the selected version (including resolved)
  const { data: allComments = [], isLoading: commentsLoading } = useComments(
    trackId,
    selectedVersion?.id || "",
    true
  );

  // Filter and sort comments based on showResolvedComments and commentSortBy state
  const comments = useMemo(() => {
    let filtered = allComments;

    if (!showResolvedComments) {
      // Filter out resolved top-level comments and their replies
      filtered = allComments.filter((comment) => !comment.resolvedAt);
    }

    // Helper function to sort comments
    const sortComments = (commentsToSort: typeof allComments) => {
      return [...commentsToSort].sort((a, b) => {
        if (commentSortBy === "timestamp") {
          // Sort by timestamp (audio position)
          // Comments without timestamp go to the end
          if (a.timestamp === null && b.timestamp === null) return 0;
          if (a.timestamp === null) return 1;
          if (b.timestamp === null) return -1;
          return a.timestamp - b.timestamp;
        } else {
          // Sort by createdAt (newest first)
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
      });
    };

    // Recursive function to sort replies within each comment
    const sortRepliesRecursively = (
      comment: (typeof allComments)[0]
    ): (typeof allComments)[0] => {
      if (!comment.replies || comment.replies.length === 0) {
        return comment;
      }

      return {
        ...comment,
        replies: sortComments(comment.replies).map(sortRepliesRecursively),
      };
    };

    // Sort top-level comments and their replies
    const sorted = sortComments(filtered).map(sortRepliesRecursively);

    return sorted;
  }, [allComments, showResolvedComments, commentSortBy]);

  // Function to scroll to and highlight a comment
  const scrollToComment = useCallback((commentId: string) => {
    // Add a small delay to ensure DOM is ready and comments are rendered
    setTimeout(() => {
      const commentElement = document.getElementById(`comment-${commentId}`);
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
  }, []);

  // Auto-scroll to comment when commentId is in URL (from notifications/deep links)
  useEffect(() => {
    if (commentIdParam && selectedVersion && comments.length > 0) {
      scrollToComment(commentIdParam);
      // Clear the URL parameter after scrolling completes
      const timer = setTimeout(() => {
        setCommentIdParam(null);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [
    scrollToComment,
    setCommentIdParam,
    commentIdParam,
    selectedVersion,
    comments.length,
  ]);

  const {
    triggerPlayback,
    setTriggerPlayback,
    isVersionUploadDialogOpen,
    setVersionUploadDialogOpen,
  } = useUIStore();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState<{
    versionId: string;
    notes: string;
  } | null>(null);
  const [isEditVersionDialogOpen, setIsEditVersionDialogOpen] = useState(false);
  const [commentTimestamp, setCommentTimestamp] = useState<number | undefined>(
    0
  );

  const activateVersionWaveSurfer = useCallback(
    async (
      version: TrackVersion,
      targetWaveSurfer: WaveSurfer,
      startTime: number,
      autoPlay: boolean
    ) => {
      if (!track || !project) return;

      const safeStartTime = Math.min(startTime, targetWaveSurfer.getDuration());
      const previousWaveSurfer =
        playerWaveSurfer && playerWaveSurfer !== targetWaveSurfer
          ? playerWaveSurfer
          : null;

      targetWaveSurfer.setTime(safeStartTime);
      activateExternalWaveSurfer(
        track,
        version,
        project.name,
        targetWaveSurfer,
        safeStartTime
      );

      if (autoPlay) {
        try {
          targetWaveSurfer.setMuted(true);
          targetWaveSurfer.setVolume(0);
          await targetWaveSurfer.play();
          Object.entries(waveformInstancesRef.current).forEach(
            ([id, waveSurfer]) => {
              const isActive = id === version.id;
              waveSurfer.setMuted(!isActive);
              waveSurfer.setVolume(isActive ? 1 : 0);
            }
          );
          previousWaveSurfer?.pause();
          setIsPlaying(true);
        } catch (error) {
          console.error("Failed to switch playback between versions:", error);
          Object.entries(waveformInstancesRef.current).forEach(
            ([id, waveSurfer]) => {
              const isActive = id === version.id;
              waveSurfer.setMuted(!isActive);
              waveSurfer.setVolume(isActive ? 1 : 0);
            }
          );
          previousWaveSurfer?.pause();
          setIsPlaying(false);
        }
      } else {
        previousWaveSurfer?.pause();
        Object.entries(waveformInstancesRef.current).forEach(
          ([id, waveSurfer]) => {
            const isActive = id === version.id;
            waveSurfer.setMuted(!isActive);
            waveSurfer.setVolume(isActive ? 1 : 0);
          }
        );
        targetWaveSurfer.pause();
        setIsPlaying(false);
      }
    },
    [activateExternalWaveSurfer, playerWaveSurfer, project, setIsPlaying, track]
  );

  const handoffPlaybackToInternal = useCallback(() => {
    const state = usePlayerStore.getState();
    const activeExternalWaveSurfer =
      state.usesExternalWaveSurfer &&
      state.track?.id === trackId &&
      state.waveSurfer
        ? state.waveSurfer
        : null;

    Object.values(waveformInstancesRef.current).forEach((waveSurfer) => {
      if (waveSurfer === activeExternalWaveSurfer) return;
      waveSurfer.setMuted(true);
      waveSurfer.setVolume(0);
    });

    if (!track || !project || !activeExternalWaveSurfer || !state.version) {
      return;
    }

    const currentTime =
      activeExternalWaveSurfer.getCurrentTime() ?? state.currentTime;

    state.handoffToInternalPlayer(
      track,
      state.version,
      project.name,
      state.isPlaying,
      currentTime
    );
  }, [project, track, trackId]);

  useEffect(() => {
    const handlePopState = () => {
      handoffPlaybackToInternal();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      handoffPlaybackToInternal();
    };
  }, [handoffPlaybackToInternal]);

  const registerWaveformInstance = useCallback(
    (versionId: string, waveSurfer: WaveSurfer) => {
      waveformInstancesRef.current[versionId] = waveSurfer;
      setLoadedWaveformIds((current) =>
        current.includes(versionId) ? current : [...current, versionId]
      );

      if (usesExternalWaveSurfer && playerVersion?.id === versionId) {
        waveSurfer.setMuted(false);
        waveSurfer.setVolume(1);
      } else {
        waveSurfer.setMuted(true);
        waveSurfer.setVolume(0);
      }
    },
    [playerVersion?.id, usesExternalWaveSurfer]
  );

  useEffect(() => {
    if (!versions) return;

    setLoadedWaveformIds((current) =>
      current.filter((versionId) => versions.some((v) => v.id === versionId))
    );
  }, [versions]);

  useEffect(() => {
    if (!versions) return;

    versions.forEach((version) => {
      if (version.peaks?.length) {
        setPeaks(version.id, version.peaks);
      }
    });
  }, [setPeaks, versions]);

  const areAllWaveformsLoaded =
    !!versions &&
    versions.length > 0 &&
    versions.every((version) => loadedWaveformIds.includes(version.id));

  // Handle shortcut triggers
  useEffect(() => {
    if (triggerPlayback && defaultVersion && track && project) {
      const targetWaveSurfer = waveformInstancesRef.current[defaultVersion.id];

      if (targetWaveSurfer) {
        activateVersionWaveSurfer(defaultVersion, targetWaveSurfer, 0, true);
      } else {
        loadVersion(track, defaultVersion, project.name, true);
      }

      setTriggerPlayback(false);
    }
  }, [
    activateVersionWaveSurfer,
    triggerPlayback,
    defaultVersion,
    track,
    project,
    loadVersion,
    setTriggerPlayback,
  ]);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);

  const handleFileDrop = (file: File) => {
    setDroppedFile(file);
    setVersionUploadDialogOpen(true);
  };

  const handleUploadDialogChange = (open: boolean) => {
    setVersionUploadDialogOpen(open);
    if (!open) {
      setDroppedFile(null);
    }
  };

  const handleUploadClick = () => {
    setVersionUploadDialogOpen(true);
  };

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

  const handleVersionEditDialogChange = (open: boolean) => {
    setIsEditVersionDialogOpen(open);
    if (!open) {
      setEditingVersion(null);
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    // If deleting the version that's currently playing in the global player, clear it
    if (versionId === playerVersion?.id) {
      clearPlayer();
    }

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

  const handleSelectVersion = async (versionNumber: number) => {
    if (!areAllWaveformsLoaded) return;

    const nextVersion = versions?.find(
      (v) => v.versionNumber === versionNumber
    );

    if (
      nextVersion &&
      track &&
      project &&
      playerTrack?.id === track.id &&
      playerVersion?.id !== nextVersion.id
    ) {
      const currentPlaybackTime =
        playerWaveSurfer?.getCurrentTime() ?? playerCurrentTime;
      const targetWaveSurfer = waveformInstancesRef.current[nextVersion.id];

      if (targetWaveSurfer) {
        void activateVersionWaveSurfer(
          nextVersion,
          targetWaveSurfer,
          currentPlaybackTime,
          playerIsPlaying
        );
      } else {
        loadVersion(
          track,
          nextVersion,
          project.name,
          playerIsPlaying,
          currentPlaybackTime
        );
      }
    }

    setVersionNumberParam(versionNumber);
    setCommentTimestamp(0);
  };

  const handleWaveformClick = useCallback((time: number) => {
    setCommentTimestamp(time);
  }, []);

  const handleSeekToTime = useCallback(
    (time: number) => {
      window.scrollTo({ top: 0, behavior: "smooth" });

      // If no player or wrong version loaded, load the correct version first
      if (!playerWaveSurfer || playerVersion?.id !== selectedVersion?.id) {
        if (selectedVersion && track && project) {
          const targetWaveSurfer =
            waveformInstancesRef.current[selectedVersion.id];

          if (targetWaveSurfer) {
            void activateVersionWaveSurfer(
              selectedVersion,
              targetWaveSurfer,
              time,
              true
            );
          } else {
            loadVersion(track, selectedVersion, project.name, true, time);
          }
        }
      } else {
        // Player is already loaded with the correct version
        playerWaveSurfer.setTime(time);
        playerWaveSurfer.play();
        setIsPlaying(true);
      }
    },
    [
      playerWaveSurfer,
      playerVersion?.id,
      selectedVersion,
      track,
      project,
      activateVersionWaveSurfer,
      loadVersion,
      setIsPlaying,
    ]
  );

  const handleCommentClick = (commentId: string) => {
    scrollToComment(commentId);
  };

  if (trackLoading) {
    return <LoadingSpinner />;
  }

  if (trackError || !track) {
    return (
      <ErrorState
        title={trackError ? "Error loading track" : "Track not found"}
        message={
          trackError?.message ||
          "The track you are looking for doesn't exist or has been moved."
        }
        actionLabel="Back to Project"
        href={`/projects/${projectId}`}
      />
    );
  }

  if (versionsLoading) {
    return <LoadingSpinner />;
  }

  if (versionsError) {
    return (
      <div className="container mx-auto py-6 sm:py-12 max-w-6xl px-4 sm:px-6">
        <ErrorState
          variant="inline"
          title="Error loading versions"
          message={versionsError.message}
          actionLabel="Try again"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <FullScreenDropzone
      ref={dropzoneRef}
      onFileDrop={handleFileDrop}
      message="Drop audio file to create a new version"
    >
      <div className="container mx-auto py-6 sm:py-12 max-w-6xl px-4 sm:px-6 min-h-screen">
        <div className="mb-6">
          <BackButton
            href={`/projects/${projectId}`}
            label="Back to Project"
            onClick={handoffPlaybackToInternal}
          />

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-3 sm:gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 uppercase tracking-tighter">
                {track.name}
              </h1>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-tight">
                Created {new Date(track.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" asChild className="text-xs sm:text-sm">
                <Link href={`/projects/${projectId}/tracks/${trackId}/lyrics`}>
                  Lyrics
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(true)}
                className="text-xs sm:text-sm"
              >
                Rename
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="text-xs sm:text-sm">
                    Delete Track
                  </Button>
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
            <div className="mb-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2 sm:flex-wrap">
              <Select
                value={selectedVersion?.versionNumber.toString() || ""}
                onValueChange={(value) => handleSelectVersion(parseInt(value))}
              >
                <SelectTrigger
                  className="border-foreground w-full sm:w-auto"
                  size="sm"
                  disabled={!areAllWaveformsLoaded}
                >
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
              <div className="flex flex-wrap gap-2">
                {selectedVersion && !selectedVersion.isMaster && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetMasterVersion(selectedVersion.id)}
                    disabled={setMasterVersion.isPending}
                    className="text-xs"
                  >
                    Set as Master
                  </Button>
                )}
                {selectedVersion && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="text-xs"
                  >
                    <a href={selectedVersion.audioUrl}>Download</a>
                  </Button>
                )}
                {selectedVersion && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleEditVersion(
                        selectedVersion.id,
                        selectedVersion.notes
                      )
                    }
                    className="text-xs"
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
                        className="text-xs"
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
                          onClick={() =>
                            handleDeleteVersion(selectedVersion.id)
                          }
                          className="bg-destructive text-white border-destructive hover:bg-white hover:text-destructive hover:border-destructive"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
              <div className="sm:ml-auto w-full sm:w-auto">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleUploadClick}
                  className="w-full sm:w-auto text-xs"
                >
                  + New Version
                </Button>
              </div>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <div className="flex min-h-6 min-w-0 items-start align-baseline gap-2">
                  <CardTitle>
                    {selectedVersion
                      ? `v${selectedVersion.versionNumber}`
                      : "Select a version"}
                  </CardTitle>
                  {selectedVersion?.isMaster && (
                    <Badge className="shrink-0 self-start text-xs leading-none">
                      MASTER
                    </Badge>
                  )}
                  {selectedVersion?.notes && (
                    <div className="flex min-w-0 flex-1 items-start -mt-0.5">
                      <div
                        ref={versionNotesContainerRef}
                        className="relative min-w-0 flex-1 pt-0.5"
                      >
                        <span
                          ref={versionNotesMeasureRef}
                          className="pointer-events-none invisible absolute whitespace-nowrap text-sm"
                          aria-hidden="true"
                        >
                          {selectedVersion.notes}
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <CardDescription
                              className={`mt-0 min-w-0 text-sm ${
                                areVersionNotesExpanded
                                  ? "wrap-break-word whitespace-normal"
                                  : "line-clamp-1"
                              } ${
                                doVersionNotesOverflow ? "cursor-pointer" : ""
                              }`}
                              onClick={() => {
                                if (doVersionNotesOverflow) {
                                  setAreVersionNotesExpanded(
                                    (current) => !current
                                  );
                                }
                              }}
                            >
                              {selectedVersion.notes}
                            </CardDescription>
                          </TooltipTrigger>
                          {doVersionNotesOverflow &&
                            !areVersionNotesExpanded && (
                              <TooltipContent>
                                <p>Click to expand</p>
                              </TooltipContent>
                            )}
                        </Tooltip>
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {versions && project && (
                  <div className="relative">
                    {versions.map((version) => (
                      <div
                        key={version.id}
                        aria-hidden={version.id !== selectedVersion?.id}
                        className={
                          version.id === selectedVersion?.id
                            ? "relative opacity-100 pointer-events-auto"
                            : "absolute inset-0 opacity-0 pointer-events-none"
                        }
                      >
                        <Waveform
                          track={track}
                          version={version}
                          projectName={project.name}
                          comments={
                            version.id === selectedVersion?.id ? comments : []
                          }
                          onTimeClick={handleWaveformClick}
                          onCommentClick={handleCommentClick}
                          onWaveSurferReady={registerWaveformInstance}
                          onActivateVersion={(
                            targetVersion,
                            targetWaveSurfer,
                            startTime,
                            autoPlay
                          ) => {
                            void activateVersionWaveSurfer(
                              targetVersion,
                              targetWaveSurfer,
                              startTime,
                              autoPlay
                            );
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle>Comments ({comments.length})</CardTitle>
                    <CardDescription className="text-xs">
                      Click on the waveform to add a comment at a specific time
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Checkbox
                      id="show-resolved"
                      checked={showResolvedComments}
                      onCheckedChange={(checked) =>
                        setShowResolvedComments(checked as boolean)
                      }
                    />
                    <Label
                      htmlFor="show-resolved"
                      className="mb-0 text-xs sm:text-sm"
                    >
                      Show resolved
                    </Label>
                    <div className="h-4 w-px bg-border" />
                    <Select
                      value={commentSortBy}
                      onValueChange={(value) =>
                        setCommentSortBy(value as "createdAt" | "timestamp")
                      }
                    >
                      <SelectTrigger className="w-36 h-8 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt">Sort by Date</SelectItem>
                        <SelectItem value="timestamp">Sort by Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedVersion && (
                  <CommentForm
                    trackId={trackId}
                    versionId={selectedVersion.id}
                    timestamp={commentTimestamp}
                    onSeek={handleSeekToTime}
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
                        projectOwnerId={projectOwnerId}
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
          open={isVersionUploadDialogOpen}
          onOpenChange={handleUploadDialogChange}
          trackId={trackId}
          projectId={projectId}
          preSelectedFile={droppedFile}
        />

        <VersionEditDialog
          open={isEditVersionDialogOpen}
          onOpenChange={handleVersionEditDialogChange}
          trackId={trackId}
          versionId={editingVersion?.versionId || null}
          currentNotes={editingVersion?.notes || null}
        />
      </div>
    </FullScreenDropzone>
  );
}
