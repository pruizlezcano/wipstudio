import { Section, Text } from "@react-email/components";
import { EmailLayout } from "./_components/layout";
import { EmailButton } from "./_components/button";

interface NewCommentEmailProps {
  commenterName: string;
  trackName: string;
  commentContent: string;
  commentTimestamp?: number | null;
  commentUrl: string;
  isLyric?: boolean;
  lyricContext?: string | null;
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
  isLyric,
  lyricContext,
}: NewCommentEmailProps) {
  const previewText = isLyric 
    ? `${commenterName} commented on lyrics of ${trackName}`
    : `${commenterName} commented on ${trackName}`;

  return (
    <EmailLayout preview={previewText}>
      <Section style={content}>
        <Text style={label}>{isLyric ? "NEW LYRIC COMMENT" : "NEW COMMENT"}</Text>
        <Text style={heading}>{trackName}</Text>
        <Section style={actorSection}>
          <Text style={paragraph}>
            <strong>{commenterName}</strong> left a comment
            {!isLyric && commentTimestamp !== null && commentTimestamp !== undefined
              ? ` at ${formatTimestamp(commentTimestamp)}`
              : isLyric ? " on lyrics" : ""}
            :
          </Text>
        </Section>
        {isLyric && lyricContext && (
          <Section style={contextBox}>
            <Text style={boxLabel}>CONTEXT</Text>
            <Text style={contextText}>&ldquo;{lyricContext}&rdquo;</Text>
          </Section>
        )}
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

const contextBox = {
  backgroundColor: "#f5f5f5",
  padding: "12px 16px",
  marginBottom: "16px",
  borderRadius: "4px",
  borderLeft: "2px solid #e5e5e5",
};

const boxLabel = {
  fontSize: "9px",
  fontWeight: "600",
  color: "#737373",
  margin: "0 0 4px 0",
  textTransform: "uppercase" as const,
};

const contextText = {
  fontSize: "13px",
  fontStyle: "italic",
  color: "#404040",
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
