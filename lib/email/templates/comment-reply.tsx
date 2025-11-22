import { Section, Text } from "@react-email/components";
import { EmailLayout } from "./_components/layout";
import { EmailButton } from "./_components/button";

interface CommentReplyEmailProps {
  replierName: string;
  trackName: string;
  originalComment: string;
  replyContent: string;
  commentTimestamp?: number | null;
  replyUrl: string;
}

function formatTimestamp(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "";

  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function CommentReplyEmail({
  replierName,
  trackName,
  originalComment,
  replyContent,
  commentTimestamp,
  replyUrl,
}: CommentReplyEmailProps) {
  return (
    <EmailLayout
      preview={`${replierName} replied to your comment on ${trackName}`}
    >
      <Section style={content}>
        <Text style={label}>REPLY</Text>
        <Text style={heading}>{trackName}</Text>
        <Section style={actorSection}>
          <Text style={actorText}>
            <strong>{replierName}</strong> replied to your comment
            {commentTimestamp !== null && commentTimestamp !== undefined
              ? ` at ${formatTimestamp(commentTimestamp)}`
              : ""}
            :
          </Text>
        </Section>
        <Section style={originalCommentBox}>
          <Text style={boxLabel}>YOUR COMMENT</Text>
          {commentTimestamp !== null && commentTimestamp !== undefined && (
            <Text style={timestampBadge}>
              {formatTimestamp(commentTimestamp)}
            </Text>
          )}
          <Text style={commentText}>{originalComment}</Text>
        </Section>
        <Section style={replyBox}>
          <Text style={boxLabel}>REPLY</Text>
          <Text style={commentText}>{replyContent}</Text>
        </Section>
        <Section style={buttonContainer}>
          <EmailButton href={replyUrl}>View Reply</EmailButton>
        </Section>
      </Section>
    </EmailLayout>
  );
}

const content = {
  padding: "32px 40px",
};

const label = {
  fontSize: "10px",
  fontWeight: "500",
  color: "#737373",
  margin: "0 0 12px 0",
  letterSpacing: "0.05em",
};

const heading = {
  fontSize: "20px",
  fontWeight: "600",
  color: "#0a0a0a",
  margin: "0 0 20px 0",
  letterSpacing: "-0.025em",
  lineHeight: "28px",
};

const actorSection = {
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
  marginBottom: "16px",
};

const actorText = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#525252",
  margin: "6px 0 0 0",
  flex: "1",
};

const boxLabel = {
  fontSize: "10px",
  fontWeight: "500",
  color: "#737373",
  margin: "0 0 8px 0",
  letterSpacing: "0.05em",
};

const originalCommentBox = {
  backgroundColor: "#fafafa",
  border: "1px solid #e5e5e5",
  padding: "16px",
  margin: "16px 0 12px 0",
};

const replyBox = {
  backgroundColor: "#fafafa",
  borderLeft: "2px solid #0a0a0a",
  padding: "16px",
  margin: "0 0 16px 0",
};

const timestampBadge = {
  display: "inline-block",
  fontSize: "11px",
  fontWeight: "600",
  color: "#0a0a0a",
  backgroundColor: "#ffffff",
  border: "1px solid #e5e5e5",
  padding: "4px 8px",
  margin: "0 0 12px 0",
  fontFamily: "monospace",
};

const commentText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#0a0a0a",
  margin: "0",
};

const buttonContainer = {
  margin: "24px 0 0 0",
};
