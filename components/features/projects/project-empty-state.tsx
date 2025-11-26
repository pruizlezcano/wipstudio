import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Music } from "lucide-react";

interface ProjectEmptyStateProps {
  onCreate: () => void;
}

export function ProjectEmptyState({ onCreate }: ProjectEmptyStateProps) {
  return (
    <Card className="py-16">
      <CardContent className="flex flex-col items-center justify-center">
        <div className="w-16 h-16 border border-border flex items-center justify-center mb-6">
          <Music className="h-8 w-8 text-foreground" />
        </div>
        <p className="text-muted-foreground text-xs text-center mb-6 font-medium uppercase tracking-tight">
          No projects yet
        </p>
        <Button onClick={onCreate} variant="accent">
          <Plus className="h-4 w-4" />
          Create Project
        </Button>
      </CardContent>
    </Card>
  );
}
