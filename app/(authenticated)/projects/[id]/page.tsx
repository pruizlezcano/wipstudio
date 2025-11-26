"use client";

import { useState } from "react";
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

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: tracks, isLoading: tracksLoading } = useTracks(projectId);
  const { data: collaborators } = useCollaborators(projectId);

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isCollaboratorsDialogOpen, setIsCollaboratorsDialogOpen] =
    useState(false);

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
    <div className="container mx-auto py-12 max-w-6xl px-6 min-h-screen">
      <ProjectHeader
        project={project}
        collaboratorsCount={collaborators?.length || 0}
        onInvite={() => setIsInviteDialogOpen(true)}
        onShowCollaborators={() => setIsCollaboratorsDialogOpen(true)}
      />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Tracks</h2>
        <Button onClick={() => setIsUploadDialogOpen(true)}>
          Upload Track
        </Button>
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
        onOpenChange={setIsUploadDialogOpen}
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
  );
}
