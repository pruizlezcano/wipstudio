"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { createProjectTint } from "@/lib/project-artwork";

interface ProjectHeaderProps {
  project: {
    name: string;
    description?: string | null;
    artwork?: string | null;
    artworkDominantColor?: string | null;
  };
  membersCount: number;
  isOwner?: boolean;
  onInvite: () => void;
  onShowMembers: () => void;
  onLeaveProject?: () => void;
  onEditProject?: () => void;
  onDeleteProject?: () => void;
}

export function ProjectHeader({
  project,
  membersCount,
  isOwner,
  onInvite,
  onShowMembers,
  onLeaveProject,
  onEditProject,
  onDeleteProject,
}: ProjectHeaderProps) {
  return (
    <div className="overflow-hidden">
      <div className="flex flex-col gap-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:py-6">
        <div className="flex items-start gap-4">
          <Image
            src={project.artwork || ""}
            alt={`${project.name} artwork`}
            width={320}
            height={320}
            className="shrink-0 border border-border object-cover size-44"
          />
          <div>
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl">
              {project.name}
            </h1>
            {project.description && (
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                {project.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={onShowMembers}
            className="text-xs sm:text-sm"
          >
            Members ({membersCount})
          </Button>
          {isOwner && onEditProject && (
            <Button
              variant="outline"
              onClick={onEditProject}
              className="text-xs sm:text-sm"
            >
              Edit
            </Button>
          )}
          {isOwner && onDeleteProject && (
            <Button
              variant="outline"
              onClick={onDeleteProject}
              className="text-xs sm:text-sm text-destructive hover:text-destructive"
            >
              Delete
            </Button>
          )}
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
