"use client";

import { Button } from "@/components/ui/button";
import { Collaborator } from "@/types";
import { UserAvatar } from "@daveyplate/better-auth-ui";

interface CollaboratorItemProps {
  collaborator: Collaborator;
  onRemove: (userId: string) => void;
}

export function CollaboratorItem({
  collaborator,
  onRemove,
}: CollaboratorItemProps) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        <UserAvatar user={collaborator} />
        <h3 className="font-medium">{collaborator.name}</h3>
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
