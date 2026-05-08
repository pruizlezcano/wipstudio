"use client";

import { Button } from "@/components/ui/button";
import { Collaborator } from "@/types";
import { UserAvatar } from "@daveyplate/better-auth-ui";

interface CollaboratorItemProps {
  collaborator: Collaborator;
  isCurrentUserOwner: boolean;
  onRemove: (userId: string) => void;
}

export function CollaboratorItem({
  collaborator,
  isCurrentUserOwner,
  onRemove,
}: CollaboratorItemProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <UserAvatar user={collaborator} className="shrink-0" />
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-medium text-sm sm:text-base truncate">
            {collaborator.name}
          </h3>
          {collaborator.isOwner && (
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
              Owner
            </span>
          )}
        </div>
      </div>
      {isCurrentUserOwner && !collaborator.isOwner && (
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onRemove(collaborator.userId)}
          className="w-full sm:w-auto text-xs"
        >
          Remove
        </Button>
      )}
    </div>
  );
}
