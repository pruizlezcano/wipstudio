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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { XIcon } from "lucide-react";
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
import { DatePicker } from "@/components/ui/date-picker";

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
  const [emails, setEmails] = useState<string[]>([]);
  const [restrictToEmails, setRestrictToEmails] = useState(false);
  const [inviteMaxUses, setInviteMaxUses] = useState("");
  const [inviteExpiration, setInviteExpiration] = useState("");
  const [invitationToDelete, setInvitationToDelete] = useState<string | null>(
    null
  );

  const addEmail = (email: string) => {
    const trimmed = email.trim();
    if (!trimmed) return;

    // Basic email validation
    if (!trimmed.includes("@")) return;

    if (!emails.includes(trimmed)) {
      setEmails([...emails, trimmed]);
    }
    setInviteEmail("");
  };

  const removeEmail = (emailToRemove: string) => {
    setEmails(emails.filter((e) => e !== emailToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      addEmail(inviteEmail);
    } else if (e.key === "Backspace" && !inviteEmail && emails.length > 0) {
      removeEmail(emails[emails.length - 1]);
    }
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();

    // Add current input if it's a valid email
    let finalEmails = [...emails];
    if (inviteEmail.trim() && inviteEmail.includes("@")) {
      finalEmails.push(inviteEmail.trim());
    }

    const invitation = await createInvitation.mutateAsync({
      projectId,
      data: {
        emails: finalEmails.length > 0 ? finalEmails : undefined,
        email:
          finalEmails.length === 0 && inviteEmail ? inviteEmail : undefined,
        restrictToEmails,
        maxUses: inviteMaxUses ? parseInt(inviteMaxUses) : undefined,
        expiresAt: inviteExpiration ? new Date(inviteExpiration) : undefined,
      },
    });

    const inviteUrl = `${window.location.origin}/invitations/${invitation.token}`;
    await navigator.clipboard.writeText(inviteUrl);

    if (finalEmails.length <= 1) {
      toast.success(
        finalEmails.length === 1
          ? "Invitation sent and link copied!"
          : "Invitation created and link copied!"
      );
    } else {
      toast.success(`${finalEmails.length} invitations sent and link copied!`);
    }

    setInviteEmail("");
    setEmails([]);
    setRestrictToEmails(false);
    setInviteMaxUses("");
    setInviteExpiration("");
  };

  const copyInviteLink = async (token: string) => {
    const inviteUrl = `${window.location.origin}/invitations/${token}`;
    await navigator.clipboard.writeText(inviteUrl);
    toast.success("Invitation link copied to clipboard!");
  };

  const handleDeleteInvitation = async () => {
    if (!invitationToDelete) return;
    await deleteInvitation.mutateAsync({
      projectId,
      invitationId: invitationToDelete,
    });
    setInvitationToDelete(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invite Collaborators</DialogTitle>
            <DialogDescription className="text-xs">
              Create an invitation link to share with members
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateInvitation} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteEmail" className="text-xs sm:text-sm">
                Collaborators
              </Label>
              <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                {emails.map((email) => (
                  <Badge
                    key={email}
                    className="flex items-center gap-1 py-0 px-1"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => removeEmail(email)}
                      className="p-0.5 cursor-pointer"
                    >
                      <XIcon className="size-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  id="inviteEmail"
                  type="text"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={() => addEmail(inviteEmail)}
                  placeholder={
                    emails.length === 0
                      ? "email1@example.com, email2@example.com..."
                      : ""
                  }
                  className="flex-1 min-w-30 bg-transparent border-none outline-none text-xs sm:text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {emails.length > 0
                  ? "Press Enter, comma, or space to add another email."
                  : "Press Enter, comma, or space to add an email."}
              </p>
            </div>

            {emails.length > 0 && (
              <div className="flex space-x-2 py-1">
                <Checkbox
                  id="restrictToEmails"
                  checked={restrictToEmails}
                  onCheckedChange={(checked) =>
                    setRestrictToEmails(checked as boolean)
                  }
                />
                <div className="grid leading-none">
                  <Label
                    htmlFor="restrictToEmails"
                    className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Restrict to these emails
                  </Label>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Only the specified email addresses will be able to accept
                    this invitation.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="inviteMaxUses" className="text-xs sm:text-sm">
                  Max Uses (Optional)
                </Label>
                <Input
                  id="inviteMaxUses"
                  type="number"
                  min="1"
                  value={inviteMaxUses}
                  onChange={(e) => setInviteMaxUses(e.target.value)}
                  placeholder="Unlimited"
                  className="text-xs sm:text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty for unlimited uses
                </p>
              </div>

              <div>
                <Label
                  htmlFor="inviteExpiration"
                  className="text-xs sm:text-sm"
                >
                  Expires At (Optional)
                </Label>
                <DatePicker />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty for no expiration
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                Create Invitation
              </Button>
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
