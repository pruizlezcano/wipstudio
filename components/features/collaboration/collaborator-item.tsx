"use client";

import { Button } from "@/components/ui/button";

interface CollaboratorItemProps {
  collaborator: {
    userId: string;
    userName: string | null;
    userEmail: string | null;
  };
  onRemove: (userId: string) => void;
}

export function CollaboratorItem({
  collaborator,
  onRemove,
}: CollaboratorItemProps) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div>
        <div className="font-medium">{collaborator.userName || "Unknown User"}</div>
        <div className="text-sm text-muted-foreground">
          {collaborator.userEmail || "No email"}
        </div>
      </div>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => onRemove(collaborator.userId)}
      >
        Remove
      </Button>
    </div>
  );
}
