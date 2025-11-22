import { Section, Text } from "@react-email/components";
import { EmailLayout } from "./_components/layout";
import { EmailButton } from "./_components/button";

interface NewVersionEmailProps {
  uploaderName: string;
  trackName: string;
  versionNumber: number;
  notes?: string;
  versionUrl: string;
}

export function NewVersionEmail({
  uploaderName,
  trackName,
  versionNumber,
  notes,
  versionUrl,
}: NewVersionEmailProps) {
  return (
    <EmailLayout
      preview={`${uploaderName} uploaded version ${versionNumber} of ${trackName}`}
    >
      <Section style={content}>
        <Text style={label}>NEW VERSION</Text>
        <Text style={heading}>
          {trackName} — v{versionNumber}
        </Text>
        <Section style={actorSection}>
          <Text style={actorText}>
            <strong>{uploaderName}</strong> uploaded a new version.
          </Text>
        </Section>
        {notes && (
          <Section style={notesBox}>
            <Text style={notesLabel}>NOTES</Text>
            <Text style={notesText}>{notes}</Text>
          </Section>
        )}
        <Section style={buttonContainer}>
          <EmailButton href={versionUrl}>Listen to Version</EmailButton>
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

const notesBox = {
  backgroundColor: "#fafafa",
  border: "1px solid #e5e5e5",
  padding: "16px",
  margin: "16px 0",
};

const notesLabel = {
  fontSize: "10px",
  fontWeight: "500",
  color: "#737373",
  margin: "0 0 8px 0",
  letterSpacing: "0.05em",
};

const notesText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#0a0a0a",
  margin: "0",
};

const buttonContainer = {
  margin: "24px 0 0 0",
};
