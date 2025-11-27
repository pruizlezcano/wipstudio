export interface Invitation {
  id: string;
  projectId: string;
  token: string;
  createdById: string;
  email: string | null;
  maxUses: number | null;
  currentUses: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// No email exposed
export interface PublicInvitation {
  id: string;
  projectId: string;
  projectName: string;
  expiresAt: string | null;
  maxUses: number | null;
  currentUses: number;
}
