"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface InvitationDetails {
  id: string;
  projectId: string;
  projectName: string;
  email: string | null;
  expiresAt: string | null;
  maxUses: number | null;
  currentUses: number;
}

export default function InvitationAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const session = await authClient.getSession();
      setIsAuthenticated(!!session.data);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const response = await fetch(`/api/invitations/${token}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch invitation");
        }
        const data = await response.json();
        setInvitation(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load invitation"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  const handleAccept = async () => {
    if (!isAuthenticated) {
      // Redirect to sign in, then come back here
      router.push(`/auth/signin?redirect=/invitations/${token}`);
      return;
    }

    setAccepting(true);
    try {
      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to accept invitation");
      }

      const data = await response.json();
      toast.success("Invitation accepted! Redirecting to project...");

      setTimeout(() => {
        router.push(`/projects/${data.projectId}`);
      }, 1000);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to accept invitation"
      );
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <p>Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">
              Invalid Invitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.push("/projects")} variant="outline">
              Go to Projects
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invitation Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              This invitation does not exist or has been deleted.
            </p>
            <Button onClick={() => router.push("/projects")} variant="outline">
              Go to Projects
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired =
    invitation.expiresAt && new Date(invitation.expiresAt) < new Date();
  const isMaxUsesReached =
    invitation.maxUses !== null && invitation.currentUses >= invitation.maxUses;

  if (isExpired || isMaxUsesReached) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">
              Invitation Expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {isExpired
                ? "This invitation has expired."
                : "This invitation has reached its maximum number of uses."}
            </p>
            <Button onClick={() => router.push("/projects")} variant="outline">
              Go to Projects
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Project Invitation</CardTitle>
          <CardDescription>
            You have been invited to collaborate on a project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-l-4 border-primary pl-4 py-2">
            <h3 className="font-semibold text-lg">{invitation.projectName}</h3>
            <p className="text-sm text-muted-foreground">
              You will join as a collaborator
            </p>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            {invitation.expiresAt && (
              <p>
                Expires:{" "}
                {formatDistanceToNow(new Date(invitation.expiresAt), {
                  addSuffix: true,
                })}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-4">
            {!isAuthenticated && (
              <p className="text-sm text-muted-foreground mb-2">
                You need to sign in to accept this invitation
              </p>
            )}
            <Button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full"
            >
              {accepting
                ? "Accepting..."
                : isAuthenticated
                  ? "Accept Invitation"
                  : "Sign In to Accept"}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/projects")}
              disabled={accepting}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
