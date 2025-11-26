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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onShowCollaborators}>
            Collaborators ({collaboratorsCount})
          </Button>
          <Button onClick={onInvite}>Invite</Button>
        </div>
      </div>
    </div>
  );
}
