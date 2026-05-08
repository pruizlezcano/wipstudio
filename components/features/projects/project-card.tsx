import Link from "next/link";
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
  const allParticipants = project.collaborators || [];

  return (
    <Link
      href={`/projects/${project.id}`}
      className="no-underline text-foreground block group"
    >
      <Card className="hover:border-foreground transition-[border-color] duration-0 py-6">
        <CardHeader className="border-b">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="flex-1 line-clamp-1 text-base sm:text-lg">
              {project.name}
            </CardTitle>
            <div
              className="flex gap-1 shrink-0 relative z-10"
              onClick={(e) => e.preventDefault()}
            >
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(e) => {
                  e.preventDefault();
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
                  e.preventDefault();
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
        <CardContent>
          <div className="flex flex-row items-center justify-between gap-3">
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
            <div className="text-xs sm:text-sm font-bold uppercase tracking-tight">
              VIEW →
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
