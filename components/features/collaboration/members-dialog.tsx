"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useProject } from "@/hooks/use-projects";
import {
  useMembers,
  useRemoveMember,
} from "@/hooks/use-members";
import { MemberItem } from "./member-item";

interface MembersDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MembersDialog({
  projectId,
  open,
  onOpenChange,
}: MembersDialogProps) {
  const { data: project } = useProject(projectId);
  const { data: members } = useMembers(projectId);
  const removeMember = useRemoveMember();
  const [memberToRemove, setMemberToRemove] = useState<
    string | null
  >(null);

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    await removeMember.mutateAsync({
      projectId,
      userId: memberToRemove,
    });
    setMemberToRemove(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Project Members</DialogTitle>
          </DialogHeader>

          {members && members.length > 0 ? (
            <div className="space-y-2">
              {members.map((member) => (
                <MemberItem
                  key={member.userId}
                  member={member}
                  isCurrentUserOwner={!!project?.isOwner}
                  onRemove={setMemberToRemove}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No members yet. Create an invitation to add members.
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation */}
      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={() => setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member from the project?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-white border-destructive hover:bg-white hover:text-destructive hover:border-destructive"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
