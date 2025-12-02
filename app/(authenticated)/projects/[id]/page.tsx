"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useProject } from "@/hooks/use-projects";
import { useTracks } from "@/hooks/use-tracks";
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

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const dropzoneRef = useRef<FullScreenDropzoneRef>(null);

  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: tracks, isLoading: tracksLoading } = useTracks(projectId);
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
          <Button onClick={handleUploadClick}>Upload Track</Button>
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
