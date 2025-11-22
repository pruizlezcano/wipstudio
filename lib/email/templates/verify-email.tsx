import { Section, Text } from "@react-email/components";
import { EmailLayout } from "./_components/layout";
import { EmailButton } from "./_components/button";

interface VerifyEmailProps {
  verifyUrl: string;
}

export function VerifyEmail({ verifyUrl }: VerifyEmailProps) {
  return (
    <EmailLayout preview="Verify your email address">
      <Section style={content}>
        <Text style={label}>EMAIL VERIFICATION</Text>
        <Text style={heading}>Verify your email address</Text>
        <Text style={paragraph}>
          Thanks for signing up for Backstage! Please verify your email address
          by clicking the button below.
        </Text>
        <Section style={buttonContainer}>
          <EmailButton href={verifyUrl}>Verify Email</EmailButton>
        </Section>
        <Text style={note}>
          If you did not create an account, please ignore this email.
        </Text>
        <Text style={expiry}>
          This verification link will expire in 24 hours.
        </Text>
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

const paragraph = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#525252",
  margin: "0 0 16px 0",
};

const buttonContainer = {
  margin: "24px 0 0 0",
};

const note = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#737373",
  margin: "20px 0 8px 0",
};

const expiry = {
  fontSize: "12px",
  lineHeight: "18px",
  color: "#a3a3a3",
  margin: "0",
};
