export type NotificationType =
  | "invitation"
  | "new_track"
  | "new_version"
  | "new_comment"
  | "comment_reply";

export interface NotificationMetadata {
  projectId: string;
  projectName: string;
  trackId?: string;
  trackName?: string;
  versionId?: string;
  versionNumber?: number;
  versionNotes?: string;
  commentId?: string;
  commentContent?: string; // The comment text
  commentTimestamp?: number | null; // Audio timestamp in seconds
  replyContent?: string; // The reply text (for reply notifications)
  parentCommentContent?: string; // Original comment being replied to
  invitationToken?: string;
  actorId: string;
  actorName: string;
  url: string; // Direct link to the resource
}

export interface CreateNotificationParams {
  type: NotificationType;
  recipientUserIds: string[];
  recipientEmails?: string[]; // For users not yet in the system (invitations)
  title: string;
  message: string;
  metadata: NotificationMetadata;
}
