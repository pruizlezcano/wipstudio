// Domain term: a user who belongs to a project.
// Persistence still uses "collaborator" naming in the DB schema.
export interface Member {
  userId: string;
  name: string;
  image: string | null;
  isOwner?: boolean;
}
