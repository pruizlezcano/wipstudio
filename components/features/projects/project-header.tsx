"use client";

import { BackButton } from "@/components/common/back-button";
import { Button } from "@/components/ui/button";

interface ProjectHeaderProps {
  project: {
    name: string;
    description?: string | null;
  };
  collaboratorsCount: number;
  isOwner?: boolean;
  onInvite: () => void;
  onShowCollaborators: () => void;
  onLeaveProject?: () => void;
}

export function ProjectHeader({
  project,
  collaboratorsCount,
  isOwner,
  onInvite,
  onShowCollaborators,
  onLeaveProject,
}: ProjectHeaderProps) {
  return (
    <div className="mb-6">
      <BackButton href="/projects" label="Back to Projects" />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            {project.name}
          </h1>
          {project.description && (
            <p className="text-sm sm:text-base text-muted-foreground">
              {project.description}
            </p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={onShowCollaborators}
            className="text-xs sm:text-sm"
          >
            Collaborators ({collaboratorsCount})
          </Button>
          {!isOwner && onLeaveProject && (
            <Button
              variant="outline"
              onClick={onLeaveProject}
              className="text-xs sm:text-sm text-destructive hover:text-destructive"
            >
              Leave Project
            </Button>
          )}
          {isOwner && (
            <Button onClick={onInvite} className="text-xs sm:text-sm">
              Invite
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
