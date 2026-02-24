"use client";

import { BackButton } from "@/components/common/back-button";
import { Button } from "@/components/ui/button";

interface ProjectHeaderProps {
  project: {
    name: string;
    description?: string | null;
  };
  collaboratorsCount: number;
  onInvite: () => void;
  onShowCollaborators: () => void;
}

export function ProjectHeader({
  project,
  collaboratorsCount,
  onInvite,
  onShowCollaborators,
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
          <Button onClick={onInvite} className="text-xs sm:text-sm">
            Invite
          </Button>
        </div>
      </div>
    </div>
  );
}
