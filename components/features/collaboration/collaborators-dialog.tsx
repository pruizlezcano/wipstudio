"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  useCollaborators,
  useRemoveCollaborator,
} from "@/hooks/use-collaborators";
import { CollaboratorItem } from "./collaborator-item";
import { toast } from "sonner";

interface CollaboratorsDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CollaboratorsDialog({
  projectId,
  open,
  onOpenChange,
}: CollaboratorsDialogProps) {
  const { data: collaborators } = useCollaborators(projectId);
  const removeCollaborator = useRemoveCollaborator();
  const [collaboratorToRemove, setCollaboratorToRemove] = useState<
    string | null
  >(null);

  const handleRemoveCollaborator = async () => {
    if (!collaboratorToRemove) return;
    try {
      await removeCollaborator.mutateAsync({
        projectId,
        userId: collaboratorToRemove,
      });
      toast.success("Collaborator removed");
      setCollaboratorToRemove(null);
    } catch (error) {
      toast.error("Failed to remove collaborator");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Collaborators</DialogTitle>
            <DialogDescription>Manage project collaborators</DialogDescription>
          </DialogHeader>

          {collaborators && collaborators.length > 0 ? (
            <div className="space-y-2">
              {collaborators.map((collab) => (
                <CollaboratorItem
                  key={collab.userId}
                  collaborator={collab}
                  onRemove={setCollaboratorToRemove}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No collaborators yet. Create an invitation to add collaborators.
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Remove Collaborator Confirmation */}
      <AlertDialog
        open={!!collaboratorToRemove}
        onOpenChange={() => setCollaboratorToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Collaborator</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this collaborator from the
              project?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveCollaborator}
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
