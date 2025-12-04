import { Section, Text } from "@react-email/components";
import { EmailLayout } from "./_components/layout";
import { EmailButton } from "./_components/button";

interface ResetPasswordEmailProps {
  resetUrl: string;
}

export function ResetPasswordEmail({ resetUrl }: ResetPasswordEmailProps) {
  return (
    <EmailLayout preview="Reset your password">
      <Section style={content}>
        <Text style={label}>PASSWORD RESET</Text>
        <Text style={heading}>Reset your password</Text>
        <Text style={paragraph}>
          You recently requested to reset your password for your WIPStudio
          account. Click the button below to reset it.
        </Text>
        <Section style={buttonContainer}>
          <EmailButton href={resetUrl}>Reset Password</EmailButton>
        </Section>
        <Text style={note}>
          If you did not request a password reset, please ignore this email or
          contact support if you have concerns.
        </Text>
        <Text style={expiry}>
          This password reset link will expire in 1 hour.
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
