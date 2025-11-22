import { db } from "@/lib/db/db";
import { notification, user } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email/mailer";
import type { CreateNotificationParams, NotificationMetadata } from "./types";
import { InvitationEmail } from "@/lib/email/templates/invitation";
import { NewTrackEmail } from "@/lib/email/templates/new-track";
import { NewVersionEmail } from "@/lib/email/templates/new-version";
import { NewCommentEmail } from "@/lib/email/templates/new-comment";
import { CommentReplyEmail } from "@/lib/email/templates/comment-reply";
import { inArray } from "drizzle-orm";

/**
 * Unified notification service that handles both in-app and email notifications
 * Emails are ALWAYS sent regardless of in-app notification status
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<void> {
  const {
    type,
    recipientUserIds,
    recipientEmails = [],
    title,
    message,
    metadata,
  } = params;

  try {
    // 1. Create in-app notifications for users in the database
    if (recipientUserIds.length > 0) {
      const notificationRecords = recipientUserIds.map((userId) => ({
        id: crypto.randomUUID(),
        userId,
        type,
        title,
        message,
        metadata: JSON.stringify(metadata),
        readAt: null,
      }));

      await db.insert(notification).values(notificationRecords);
      console.log(`Created ${notificationRecords.length} in-app notifications`);
    }

    // 2. Fetch user emails for in-app notifications
    let userEmails: string[] = [];
    if (recipientUserIds.length > 0) {
      const users = await db
        .select({ email: user.email })
        .from(user)
        .where(inArray(user.id, recipientUserIds));

      userEmails = users.map((u) => u.email);
    }

    // 3. Combine with additional recipient emails (for invitations)
    const allEmails = [...userEmails, ...recipientEmails];

    if (allEmails.length === 0) {
      console.log("No email recipients found");
      return;
    }

    // 4. Generate the appropriate email template based on type
    const template = getEmailTemplate(type, metadata);
    const subject = getEmailSubject(type, metadata);

    // 5. Send emails to all recipients
    await sendEmail({
      to: allEmails,
      subject,
      template,
    });

    console.log(
      `Sent ${type} notification emails to ${allEmails.length} recipients`
    );
  } catch (error) {
    console.error("Failed to create notification:", error);
    // Don't throw - we don't want notification failures to break the API
  }
}

function getEmailTemplate(type: string, metadata: NotificationMetadata) {
  switch (type) {
    case "invitation":
      return InvitationEmail({
        inviterName: metadata.actorName,
        projectName: metadata.projectName,
        invitationUrl: metadata.url,
      });

    case "new_track":
      return NewTrackEmail({
        uploaderName: metadata.actorName,
        trackName: metadata.trackName!,
        projectName: metadata.projectName,
        trackUrl: metadata.url,
      });

    case "new_version":
      return NewVersionEmail({
        uploaderName: metadata.actorName,
        trackName: metadata.trackName!,
        versionNumber: metadata.versionNumber!,
        notes: metadata.versionNotes!,
        versionUrl: metadata.url,
      });

    case "new_comment":
      return NewCommentEmail({
        commenterName: metadata.actorName,
        trackName: metadata.trackName!,
        commentContent: metadata.commentContent || "Check out the new comment",
        commentTimestamp: metadata.commentTimestamp,
        commentUrl: metadata.url,
      });

    case "comment_reply":
      return CommentReplyEmail({
        replierName: metadata.actorName,
        trackName: metadata.trackName!,
        originalComment: metadata.parentCommentContent || "Your comment",
        replyContent: metadata.replyContent || "Check out the reply",
        commentTimestamp: metadata.commentTimestamp,
        replyUrl: metadata.url,
      });

    default:
      throw new Error(`Unknown notification type: ${type}`);
  }
}

function getEmailSubject(type: string, metadata: NotificationMetadata): string {
  switch (type) {
    case "invitation":
      return `You've been invited to ${metadata.projectName}`;

    case "new_track":
      return `New track: ${metadata.trackName}`;

    case "new_version":
      return `New version of ${metadata.trackName}`;

    case "new_comment":
      return `New comment on ${metadata.trackName}`;

    case "comment_reply":
      return `${metadata.actorName} replied to your comment`;

    default:
      return "New notification from Backstage";
  }
}
