"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProject } from "@/lib/hooks/use-projects";
import { useTracks, useUploadTrack, type Track } from "@/lib/hooks/use-tracks";
import {
  useInvitations,
  useCreateInvitation,
  useDeleteInvitation,
} from "@/lib/hooks/use-invitations";
import {
  useCollaborators,
  useRemoveCollaborator,
} from "@/lib/hooks/use-collaborators";
import { toast } from "sonner";

// Track list item component with TE aesthetic
function TrackListItem({
  track,
  projectId,
}: {
  track: Track;
  projectId: string;
}) {
  const router = useRouter();

  return (
    <div
      className="border border-border bg-card hover:border-foreground transition-colors cursor-pointer flex items-center justify-between p-4 gap-4"
      onClick={() => router.push(`/projects/${projectId}/tracks/${track.id}`)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3">
          <h3 className="text-sm font-bold uppercase tracking-tight truncate">
            {track.name}
          </h3>
          <span className="text-xs font-mono text-muted-foreground shrink-0">
            {track.versionCount} versions
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <span className="text-xs font-mono text-muted-foreground">
          {new Date(track.createdAt)
            .toLocaleDateString("en-US", {
              year: "2-digit",
              month: "2-digit",
              day: "2-digit",
            })
            .replace(/\//g, ".")}
        </span>
        <div className="text-xs font-bold uppercase tracking-tight">VIEW →</div>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: tracks, isLoading: tracksLoading } = useTracks(projectId);
  const uploadTrack = useUploadTrack();

  const { data: invitations } = useInvitations(projectId);
  const createInvitation = useCreateInvitation();
  const deleteInvitation = useDeleteInvitation();

  const { data: collaborators } = useCollaborators(projectId);
  const removeCollaborator = useRemoveCollaborator();

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [trackName, setTrackName] = useState("");
  const [trackNotes, setTrackNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Invitation dialog state
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMaxUses, setInviteMaxUses] = useState("");
  const [inviteExpiration, setInviteExpiration] = useState("");

  // Collaborators dialog state
  const [isCollaboratorsDialogOpen, setIsCollaboratorsDialogOpen] =
    useState(false);

  // Delete confirmation state
  const [invitationToDelete, setInvitationToDelete] = useState<string | null>(
    null
  );
  const [collaboratorToRemove, setCollaboratorToRemove] = useState<
    string | null
  >(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill track name from file name
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setTrackName(nameWithoutExt);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !trackName) return;

    setIsUploading(true);
    try {
      await uploadTrack.mutateAsync({
        file: selectedFile,
        trackName,
        projectId,
        notes: trackNotes || undefined,
      });
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setTrackName("");
      setTrackNotes("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setIsUploading(false);
    }
  };

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

      setIsInviteDialogOpen(false);
      setInviteEmail("");
      setInviteMaxUses("");
      setInviteExpiration("");
    } catch (error) {
      toast.error("Failed to create invitation");
    }
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

  const copyInviteLink = async (token: string) => {
    const inviteUrl = `${window.location.origin}/invitations/${token}`;
    await navigator.clipboard.writeText(inviteUrl);
    toast.success("Invitation link copied to clipboard!");
  };

  if (projectLoading) {
    return (
      <div className="container mx-auto py-12 flex flex-col items-center justify-center gap-4 min-h-screen">
        <div className="size-12 border border-foreground/50 animate-spin" />
        <h1 className="text-2xl font-bold uppercase tracking-tighter mb-2">
          BACKSTAGE
        </h1>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Project not found</p>
        <Button onClick={() => router.push("/projects")} className="mt-4">
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 max-w-6xl px-6 min-h-screen">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push("/projects")}
          className="mb-4"
        >
          ← Back to Projects
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground">{project.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCollaboratorsDialogOpen(true)}
            >
              Collaborators ({collaborators?.length || 0})
            </Button>
            <Button onClick={() => setIsInviteDialogOpen(true)}>Invite</Button>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Tracks</h2>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>Upload Track</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New Track</DialogTitle>
              <DialogDescription>
                Upload an audio file to add to this project
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <Label htmlFor="file">Audio File</Label>
                <Input
                  id="file"
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  required
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Selected: {selectedFile.name} (
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="trackName">Track Name</Label>
                <Input
                  id="trackName"
                  value={trackName}
                  onChange={(e) => setTrackName(e.target.value)}
                  placeholder="Enter track name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="trackNotes">Notes (Optional)</Label>
                <Textarea
                  id="trackNotes"
                  value={trackNotes}
                  onChange={(e) => setTrackNotes(e.target.value)}
                  placeholder="Add notes about this initial version..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUploadDialogOpen(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUploading || !selectedFile}>
                  {isUploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {tracksLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="size-12 border border-foreground/50 animate-spin" />
        </div>
      ) : tracks && tracks.length > 0 ? (
        <div className="flex flex-col gap-2">
          {tracks.map((track) => (
            <TrackListItem key={track.id} track={track} projectId={projectId} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4 uppercase text-xs font-bold tracking-tight">
              No tracks yet. Upload your first track to get started.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Invitation Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
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
                onClick={() => setIsInviteDialogOpen(false)}
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
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        {inv.email && (
                          <span className="font-medium">{inv.email}</span>
                        )}
                        {!inv.email && (
                          <span className="font-medium text-muted-foreground">
                            Anyone with link
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {inv.currentUses}/{inv.maxUses || "∞"} uses
                        {inv.expiresAt && (
                          <span>
                            {" "}
                            • Expires{" "}
                            {new Date(inv.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyInviteLink(inv.token)}
                      >
                        Copy Link
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setInvitationToDelete(inv.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Collaborators Dialog */}
      <Dialog
        open={isCollaboratorsDialogOpen}
        onOpenChange={setIsCollaboratorsDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Collaborators</DialogTitle>
            <DialogDescription>Manage project collaborators</DialogDescription>
          </DialogHeader>

          {collaborators && collaborators.length > 0 ? (
            <div className="space-y-2">
              {collaborators.map((collab) => (
                <div
                  key={collab.userId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{collab.userName}</div>
                    <div className="text-sm text-muted-foreground">
                      {collab.userEmail}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setCollaboratorToRemove(collab.userId)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No collaborators yet. Create an invitation to add collaborators.
            </p>
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
            <AlertDialogAction onClick={handleDeleteInvitation}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            <AlertDialogAction onClick={handleRemoveCollaborator}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
