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
          <CardTitle className="flex-1 line-clamp-1">{project.name}</CardTitle>
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(project);
              }}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(project);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <CardDescription className="line-clamp-2">
          {project.description || "NO DESCRIPTION"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
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
          >
            View →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
