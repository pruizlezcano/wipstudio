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
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
}
