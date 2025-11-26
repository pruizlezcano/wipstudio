export interface Comment {
  id: string;
  versionId: string;
  userId: string | null;
  content: string;
  timestamp: number | null;
  parentId: string | null;
  resolvedAt: string | null;
  resolvedById: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  } | null;
  replies?: Comment[];
}
