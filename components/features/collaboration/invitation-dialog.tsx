"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useInvitations,
  useCreateInvitation,
  useDeleteInvitation,
} from "@/hooks/use-invitations";
import { InvitationListItem } from "./invitation-list-item";
import { toast } from "sonner";
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

interface InvitationDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvitationDialog({
  projectId,
  open,
  onOpenChange,
}: InvitationDialogProps) {
  const { data: invitations } = useInvitations(projectId);
  const createInvitation = useCreateInvitation();
  const deleteInvitation = useDeleteInvitation();

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMaxUses, setInviteMaxUses] = useState("");
  const [inviteExpiration, setInviteExpiration] = useState("");
  const [invitationToDelete, setInvitationToDelete] = useState<string | null>(
    null
  );

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const invitation = await createInvitation.mutateAsync({
        projectId,
        data: {
          email: inviteEmail || undefined,
          maxUses: inviteMaxUses ? parseInt(inviteMaxUses) : undefined,
          expiresAt: inviteExpiration ? new Date(inviteExpiration) : undefined,
        },
      });

      const inviteUrl = `${window.location.origin}/invitations/${invitation.token}`;
      await navigator.clipboard.writeText(inviteUrl);
      toast.success("Invitation created and link copied to clipboard!");

      setInviteEmail("");
      setInviteMaxUses("");
      setInviteExpiration("");
    } catch (error) {
      toast.error("Failed to create invitation");
    }
  };

  const copyInviteLink = async (token: string) => {
    const inviteUrl = `${window.location.origin}/invitations/${token}`;
    await navigator.clipboard.writeText(inviteUrl);
    toast.success("Invitation link copied to clipboard!");
  };

  const handleDeleteInvitation = async () => {
    if (!invitationToDelete) return;
    try {
      await deleteInvitation.mutateAsync({
        projectId,
        invitationId: invitationToDelete,
      });
      toast.success("Invitation deleted");
      setInvitationToDelete(null);
    } catch (error) {
      toast.error("Failed to delete invitation");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invite Collaborators</DialogTitle>
            <DialogDescription>
              Create an invitation link to share with collaborators
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateInvitation} className="space-y-4">
            <div>
              <Label htmlFor="inviteEmail">Email (Optional)</Label>
              <Input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Leave empty for anyone with the link"
              />
              <p className="text-xs text-muted-foreground mt-1">
                If specified, only this email can accept the invitation
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="inviteMaxUses">Max Uses (Optional)</Label>
                <Input
                  id="inviteMaxUses"
                  type="number"
                  min="1"
                  value={inviteMaxUses}
                  onChange={(e) => setInviteMaxUses(e.target.value)}
                  placeholder="Unlimited"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty for unlimited uses
                </p>
              </div>

              <div>
                <Label htmlFor="inviteExpiration">Expires At (Optional)</Label>
                <Input
                  id="inviteExpiration"
                  type="datetime-local"
                  value={inviteExpiration}
                  onChange={(e) => setInviteExpiration(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty for no expiration
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Invitation</Button>
            </div>
          </form>

          {invitations && invitations.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h3 className="font-semibold mb-3">Active Invitations</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {invitations.map((inv) => (
                  <InvitationListItem
                    key={inv.id}
                    invitation={inv}
                    onCopy={copyInviteLink}
                    onDelete={setInvitationToDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Invitation Confirmation */}
      <AlertDialog
        open={!!invitationToDelete}
        onOpenChange={() => setInvitationToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invitation? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteInvitation}
              className="bg-destructive text-white border-destructive hover:bg-white hover:text-destructive hover:border-destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
