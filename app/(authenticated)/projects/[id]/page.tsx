"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
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
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "name:asc", label: "Name (A-Z)" },
  { value: "name:desc", label: "Name (Z-A)" },
  { value: "updatedAt:desc", label: "Recently updated" },
] as const;

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const dropzoneRef = useRef<FullScreenDropzoneRef>(null);

  const [sortValue, setSortValue] = useState("createdAt:desc");
  const [sortBy, sortOrder] = sortValue.split(":") as [TrackSortBy, SortOrder];

  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: tracks, isLoading: tracksLoading } = useTracks(projectId, {
    sortBy,
    sortOrder,
  });
  const { data: collaborators } = useCollaborators(projectId);

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

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Project not found</p>
        <Button onClick={() => router.push("/projects")} className="mt-4">
          Back to Projects
        </Button>
      </div>
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
          <TrackList tracks={tracks} projectId={projectId} />
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
