"use client";

import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface InvitationListItemProps {
  invitation: {
    id: string;
    token: string;
    email?: string | null;
    currentUses: number;
    maxUses?: number | null;
    expiresAt?: Date | string | null;
  };
  onCopy: (token: string) => void;
  onDelete: (id: string) => void;
}

export function InvitationListItem({
  invitation,
  onCopy,
  onDelete,
}: InvitationListItemProps) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm">
          {invitation.email ? (
            <span className="font-medium">{invitation.email}</span>
          ) : (
            <span className="font-medium text-muted-foreground">
              Anyone with link
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {invitation.currentUses}/{invitation.maxUses || "∞"} uses
          {invitation.expiresAt && (
            <span>
              {" "}
              • Expires{" "}
              {formatDistanceToNow(new Date(invitation.expiresAt), {
                addSuffix: true,
              })}
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onCopy(invitation.token)}
        >
          Copy Link
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDelete(invitation.id)}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
