import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
} from "@react-email/components";
import type { ReactNode } from "react";

interface EmailLayoutProps {
  preview: string;
  children: ReactNode;
}

export function EmailLayout({ children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerText}>BACKSTAGE</Text>
          </Section>
          <Hr style={headerBorder} />
          {children}
          <Hr style={footerBorder} />
          <Section style={footer}>
            <Text style={footerText}>AUDIO COLLABORATION WORKSPACE</Text>
            <Text style={footerSubtext}>
              You&apos;re receiving this email because you&apos;re a member of a
              Backstage project.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  padding: "40px 20px",
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e5e5",
  margin: "0 auto",
  maxWidth: "600px",
};

const header = {
  padding: "32px 40px 0",
};

const headerText = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#0a0a0a",
  margin: "0",
  letterSpacing: "-0.025em",
};

const headerBorder = {
  borderColor: "#e5e5e5",
  margin: "20px 0 0 0",
  borderWidth: "1px 0 0 0",
};

const footerBorder = {
  borderColor: "#e5e5e5",
  margin: "32px 0 0 0",
  borderWidth: "1px 0 0 0",
};

const footer = {
  padding: "24px 40px 32px",
};

const footerText = {
  color: "#737373",
  fontSize: "10px",
  lineHeight: "14px",
  margin: "0 0 8px 0",
  fontWeight: "500",
  letterSpacing: "0.05em",
};

const footerSubtext = {
  color: "#a3a3a3",
  fontSize: "11px",
  lineHeight: "16px",
  margin: "0",
};
