"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { useCollaborators } from "@/hooks/use-collaborators";
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
  const projectId = params.id as string;
  const dropzoneRef = useRef<FullScreenDropzoneRef>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const [sortValue, setSortValue] = useState("lastVersionAt:desc");
  const [sortBy, sortOrder] = sortValue.split(":") as [TrackSortBy, SortOrder];

  const { data: project, isLoading: projectLoading, error: projectError } = useProject(projectId);
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

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isCollaboratorsDialogOpen, setIsCollaboratorsDialogOpen] =
    useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);

  const handleFileDrop = (file: File) => {
    setDroppedFile(file);
    setIsUploadDialogOpen(true);
  };

  const handleUploadDialogChange = (open: boolean) => {
    setIsUploadDialogOpen(open);
    if (!open) {
      setDroppedFile(null);
    }
  };

  const handleUploadClick = () => {
    dropzoneRef.current?.openFilePicker();
  };

  if (projectLoading) {
    return <LoadingSpinner />;
  }

  if (projectError || !project) {
    return (
      <ErrorState
        title={projectError ? "Error loading project" : "Project not found"}
        message={projectError?.message || "The project you are looking for doesn't exist or has been moved."}
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
      <div className="container mx-auto py-12 max-w-6xl px-6 min-h-screen">
        <ProjectHeader
          project={project}
          collaboratorsCount={collaborators?.length || 0}
          onInvite={() => setIsInviteDialogOpen(true)}
          onShowCollaborators={() => setIsCollaboratorsDialogOpen(true)}
        />

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Tracks</h2>
          <div className="flex items-center gap-3">
            <Select value={sortValue} onValueChange={setSortValue}>
              <SelectTrigger
                size="sm"
                className="w-[180px] py-5 border-foreground"
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
            <Button onClick={handleUploadClick}>Upload Track</Button>
          </div>
        </div>

        {tracksLoading ? (
          <LoadingSpinner />
        ) : tracks && tracks.length > 0 ? (
          <>
            <TrackList tracks={tracks} projectId={projectId} />
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
          open={isUploadDialogOpen}
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
      </div>
    </FullScreenDropzone>
  );
}
