export interface LyricsComment {
  id: string;
  trackId: string;
  userId: string | null;
  content: string;
  parentId: string | null;
  rangeFrom: number | null; // Start position in document
  rangeTo: number | null; // End position in document
  rangeText: string | null; // The text that was commented
  resolvedAt: string | null;
  resolvedById: string | null;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    image: string | null;
  } | null;
  replies?: LyricsComment[];
}
