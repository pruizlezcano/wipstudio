"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProject } from "@/hooks/use-projects";
import {
  useTracks,
  type TrackSortBy,
  type SortOrder,
} from "@/hooks/use-tracks";
import { useCollaborators, useLeaveProject } from "@/hooks/use-collaborators";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { ErrorState } from "@/components/common/error-state";
import { ProjectHeader } from "@/components/features/projects/project-header";
import { TrackList } from "@/components/features/tracks/track-list";
import { TrackUploadDialog } from "@/components/features/tracks/track-upload-dialog";
import { TrackEmptyState } from "@/components/features/tracks/track-empty-state";
import { InvitationDialog } from "@/components/features/collaboration/invitation-dialog";
import { CollaboratorsDialog } from "@/components/features/collaboration/collaborators-dialog";
import {
  FullScreenDropzone,
  FullScreenDropzoneRef,
} from "@/components/common/full-screen-dropzone";
import { useUIStore } from "@/stores/uiStore";

const SORT_OPTIONS = [
  { value: "lastVersionAt:desc", label: "Recently updated" },
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "name:asc", label: "Name (A-Z)" },
  { value: "name:desc", label: "Name (Z-A)" },
] as const;

const TRACKS_PER_PAGE = 20;

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const dropzoneRef = useRef<FullScreenDropzoneRef>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const [sortValue, setSortValue] = useState("lastVersionAt:desc");
  const [sortBy, sortOrder] = sortValue.split(":") as [TrackSortBy, SortOrder];

  const {
    data: project,
    isLoading: projectLoading,
    error: projectError,
  } = useProject(projectId);
  const {
    data: tracksData,
    isLoading: tracksLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useTracks(projectId, {
    sortBy,
    sortOrder,
    limit: TRACKS_PER_PAGE,
  });
  const { data: collaborators } = useCollaborators(projectId);
  const leaveProjectMutation = useLeaveProject();

  // Flatten all pages into a single array of tracks
  const tracks = tracksData?.pages.flatMap((page) => page.data) ?? [];

  // Intersection Observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: "100px",
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isCollaboratorsDialogOpen, setIsCollaboratorsDialogOpen] =
    useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const { isTrackUploadDialogOpen, setTrackUploadDialogOpen } = useUIStore();
  const [droppedFile, setDroppedFile] = useState<File | null>(null);

  const handleFileDrop = (file: File) => {
    setDroppedFile(file);
    setTrackUploadDialogOpen(true);
  };

  const handleUploadDialogChange = (open: boolean) => {
    setTrackUploadDialogOpen(open);
    if (!open) {
      setDroppedFile(null);
    }
  };

  const handleUploadClick = () => {
    setTrackUploadDialogOpen(true);
  };

  const handleLeaveProject = async () => {
    try {
      await leaveProjectMutation.mutateAsync(projectId);
      router.push("/projects");
    } catch (error) {
      // Error handled by mutation toast
    }
  };

  if (projectLoading) {
    return <LoadingSpinner />;
  }

  if (projectError || !project) {
    return (
      <ErrorState
        title={projectError ? "Error loading project" : "Project not found"}
        message={
          projectError?.message ||
          "The project you are looking for doesn't exist or has been moved."
        }
        actionLabel="Back to Projects"
        href="/projects"
      />
    );
  }

  return (
    <FullScreenDropzone
      ref={dropzoneRef}
      onFileDrop={handleFileDrop}
      message="Drop audio file to create a new track"
    >
      <div className="container mx-auto py-6 sm:py-12 max-w-6xl px-4 sm:px-6 min-h-screen">
        <ProjectHeader
          project={project}
          collaboratorsCount={collaborators?.length || 0}
          isOwner={project.isOwner}
          onInvite={() => setIsInviteDialogOpen(true)}
          onShowCollaborators={() => setIsCollaboratorsDialogOpen(true)}
          onLeaveProject={() => setIsLeaveDialogOpen(true)}
        />

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3">
          <h2 className="text-xl sm:text-2xl font-semibold">Tracks</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <Select value={sortValue} onValueChange={setSortValue}>
              <SelectTrigger
                size="sm"
                className="w-full sm:w-45 py-5 border-foreground"
              >
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleUploadClick} className="w-full sm:w-auto">
              Upload Track
            </Button>
          </div>
        </div>

        {tracksLoading ? (
          <LoadingSpinner />
        ) : tracks && tracks.length > 0 ? (
          <>
            <TrackList
              tracks={tracks}
              projectId={projectId}
              projectName={project?.name || ""}
            />
            {/* Infinite scroll trigger */}
            <div ref={loadMoreRef} className="py-4 flex justify-center">
              {isFetchingNextPage && <LoadingSpinner />}
            </div>
          </>
        ) : (
          <TrackEmptyState />
        )}

        <TrackUploadDialog
          projectId={projectId}
          open={isTrackUploadDialogOpen}
          onOpenChange={handleUploadDialogChange}
          preSelectedFile={droppedFile}
        />

        <InvitationDialog
          projectId={projectId}
          open={isInviteDialogOpen}
          onOpenChange={setIsInviteDialogOpen}
        />

        <CollaboratorsDialog
          projectId={projectId}
          open={isCollaboratorsDialogOpen}
          onOpenChange={setIsCollaboratorsDialogOpen}
        />

        <AlertDialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will remove you as a collaborator from the project
                &quot;{project.name}&quot;. You will lose access to all tracks and
                versions unless you are invited back.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={leaveProjectMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleLeaveProject();
                }}
                disabled={leaveProjectMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {leaveProjectMutation.isPending ? "Leaving..." : "Leave Project"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </FullScreenDropzone>
  );
}
