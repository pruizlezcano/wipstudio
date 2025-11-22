import nodemailer from "nodemailer";
import { render } from "@react-email/components";
import type { ReactElement } from "react";

const EMAIL_ENABLED = process.env.EMAIL_ENABLED !== "false";
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT
  ? parseInt(process.env.SMTP_PORT)
  : undefined;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;

// Only require SMTP configuration if emails are enabled
if (
  EMAIL_ENABLED &&
  (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD)
) {
  throw new Error(
    "SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD environment variables must be set when EMAIL_ENABLED is true"
  );
}

const transporter = EMAIL_ENABLED
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
    })
  : null;

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  template: ReactElement;
}

export async function sendEmail({
  to,
  subject,
  template,
}: SendEmailParams): Promise<void> {
  if (!EMAIL_ENABLED) {
    return;
  }

  try {
    const html = await render(template);

    await transporter!.sendMail({
      from: process.env.EMAIL_FROM || "Backstage <noreply@backstage.app>",
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html,
    });

    console.log(`Email sent successfully to: ${to}`);
  } catch (error) {
    console.error("Failed to send email:", error);
    // Don't throw - we don't want email failures to break the API
  }
}
