import { Section, Text } from "@react-email/components";
import { EmailLayout } from "./_components/layout";
import { EmailButton } from "./_components/button";

interface NewCommentEmailProps {
  commenterName: string;
  trackName: string;
  commentContent: string;
  commentTimestamp?: number | null;
  commentUrl: string;
}

function formatTimestamp(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "";

  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function NewCommentEmail({
  commenterName,
  trackName,
  commentContent,
  commentTimestamp,
  commentUrl,
}: NewCommentEmailProps) {
  return (
    <EmailLayout preview={`${commenterName} commented on ${trackName}`}>
      <Section style={content}>
        <Text style={label}>NEW COMMENT</Text>
        <Text style={heading}>{trackName}</Text>
        <Section style={actorSection}>
          <Text style={paragraph}>
            <strong>{commenterName}</strong> left a comment
            {commentTimestamp !== null && commentTimestamp !== undefined
              ? ` at ${formatTimestamp(commentTimestamp)}`
              : ""}
            :
          </Text>
        </Section>
        <Section style={commentBox}>
          <Text style={commentText}>{commentContent}</Text>
        </Section>
        <Section style={buttonContainer}>
          <EmailButton href={commentUrl}>View Comment</EmailButton>
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
  margin: "0 0 16px 0",
  letterSpacing: "-0.025em",
  lineHeight: "28px",
};

const actorSection = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  marginBottom: "16px",
};

const paragraph = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#525252",
  margin: "0",
};

const commentBox = {
  backgroundColor: "#fafafa",
  borderLeft: "2px solid #0a0a0a",
  padding: "16px",
  margin: "16px 0",
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
