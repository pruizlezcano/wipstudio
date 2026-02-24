"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { Project } from "@/types";
import { UserAvatar } from "@daveyplate/better-auth-ui";

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const router = useRouter();

  const allParticipants = [project.owner, ...(project.collaborators || [])];

  return (
    <Card
      className="hover:border-foreground transition-[border-color] duration-0 cursor-pointer"
      onClick={() => router.push(`/projects/${project.id}`)}
    >
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex-1 line-clamp-1 text-base sm:text-lg">
            {project.name}
          </CardTitle>
          <div
            className="flex gap-1 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(project);
              }}
              className="h-8 w-8 sm:h-7 sm:w-7"
            >
              <Pencil className="h-4 w-4 sm:h-3 sm:w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(project);
              }}
              className="h-8 w-8 sm:h-7 sm:w-7"
            >
              <Trash2 className="h-4 w-4 sm:h-3 sm:w-3" />
            </Button>
          </div>
        </div>
        <CardDescription className="line-clamp-2 text-xs">
          {project.description || "NO DESCRIPTION"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <p className="text-xs text-muted-foreground font-mono">
              {new Date(
                project.lastVersionAt ?? project.createdAt
              ).toLocaleDateString()}
            </p>
            {allParticipants.length > 1 && (
              <div className="flex -space-x-2">
                {allParticipants.slice(0, 3).map((person) => (
                  <div key={person.userId} title={person.name}>
                    <UserAvatar
                      user={person}
                      className="size-6 ring-2 ring-background rounded-full"
                    />
                  </div>
                ))}
                {allParticipants.length > 3 && (
                  <div className="size-6 bg-muted rounded-full flex items-center justify-center text-[10px] font-medium ring-2 ring-background z-10">
                    +{allParticipants.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/projects/${project.id}`);
            }}
            className="text-xs sm:text-sm self-end sm:self-auto"
          >
            View →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
