import { Section, Text } from "@react-email/components";
import { EmailLayout } from "./_components/layout";
import { EmailButton } from "./_components/button";

interface NewTrackEmailProps {
  uploaderName: string;
  trackName: string;
  projectName: string;
  trackUrl: string;
}

export function NewTrackEmail({
  uploaderName,
  trackName,
  projectName,
  trackUrl,
}: NewTrackEmailProps) {
  return (
    <EmailLayout
      preview={`${uploaderName} added a new track to ${projectName}`}
    >
      <Section style={content}>
        <Text style={label}>NEW TRACK</Text>
        <Text style={heading}>{trackName}</Text>
        <Section style={actorSection}>
          <Text style={actorText}>
            <strong>{uploaderName}</strong> added a new track to{" "}
            <strong>{projectName}</strong>.
          </Text>
        </Section>
        <Text style={paragraph}>
          Listen to the track and share your feedback.
        </Text>
        <Section style={buttonContainer}>
          <EmailButton href={trackUrl}>Listen to Track</EmailButton>
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

const paragraph = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#525252",
  margin: "0 0 16px 0",
};

const buttonContainer = {
  margin: "24px 0 0 0",
};
