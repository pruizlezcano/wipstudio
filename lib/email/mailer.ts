import nodemailer from "nodemailer";
import { render } from "@react-email/components";
import type { ReactElement } from "react";
import { getEmailConfig } from "@/lib/config";

// Lazy initialization of email transporter
let transporterInstance: nodemailer.Transporter | null = null;
let isEmailEnabled: boolean | null = null;

function initTransporter(): nodemailer.Transporter | null {
  if (isEmailEnabled !== null) {
    return transporterInstance;
  }

  const config = getEmailConfig();
  isEmailEnabled = config.enabled;

  if (!config.enabled || !config.smtp) {
    transporterInstance = null;
    return null;
  }

  transporterInstance = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465, // true for 465, false for other ports
    auth: {
      user: config.smtp.user,
      pass: config.smtp.password,
    },
  });

  return transporterInstance;
}

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
  const transporter = initTransporter();
  
  if (!transporter) {
    return;
  }

  try {
    const config = getEmailConfig();
    const html = await render(template);

    await transporter.sendMail({
      from: config.from,
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
