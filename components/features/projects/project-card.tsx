import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Project } from "@/types";
import { UserAvatar } from "@daveyplate/better-auth-ui";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const owner = project.members.find((member) => member.isOwner);

  return (
    <Link
      href={`/projects/${project.id}`}
      className="no-underline text-foreground block group"
    >
      <Card className="overflow-hidden py-0 transition-[border-color] duration-150 hover:border-foreground gap-0">
        <CardHeader className="p-0 relative aspect-square overflow-hidden">
          <Image
            src={project.artwork}
            alt={`${project.name} artwork`}
            fill
            className="object-cover"
          />
        </CardHeader>
        <CardContent className="p-4">
          <CardTitle className="line-clamp-1 text-base sm:text-lg">
            {project.name}
          </CardTitle>
          <div className="flex items-center justify-between h-6">
            <h3 className="font-semibold text-muted-foreground text-sm">
              {owner?.name}
            </h3>
            {project.members.length > 1 && (
              <div className="flex -space-x-2">
                {project.members.slice(0, 3).map((member) => (
                  <div key={member.userId} title={member.name}>
                    <Tooltip>
                      <TooltipTrigger>
                        <UserAvatar
                          user={member}
                          className="size-6 rounded-full"
                        />
                        <TooltipContent>
                          <p>{member.name}</p>
                        </TooltipContent>
                      </TooltipTrigger>
                    </Tooltip>
                  </div>
                ))}
                {project.members.length > 3 && (
                  <div className="size-6 bg-muted rounded-full flex items-center justify-center text-[10px] font-medium z-10">
                    +{project.members.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
