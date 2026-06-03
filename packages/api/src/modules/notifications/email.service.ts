/**
 * Phase 10 — Email service.
 *
 * Uses nodemailer with SendGrid (if SENDGRID_API_KEY is set) or
 * local SMTP for development. Also provides HTML email templates.
 */
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "../../config/env.js";

let emailTransporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!emailTransporter) {
    if (env.SENDGRID_API_KEY) {
      emailTransporter = nodemailer.createTransport({
        host: "smtp.sendgrid.net",
        port: 587,
        secure: false,
        auth: {
          user: "apikey",
          pass: env.SENDGRID_API_KEY,
        },
      });
    } else if (env.SMTP_HOST) {
      emailTransporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: parseInt(env.SMTP_PORT ?? "1025"),
        secure: false,
      });
    } else {
      // Development: use Resend's SMTP endpoint
      emailTransporter = nodemailer.createTransport({
        host: "smtp.resend.com",
        port: 465,
        secure: true,
        auth: {
          user: "resend",
          pass: env.RESEND_API_KEY,
        },
      });
    }
  }
  return emailTransporter;
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: Buffer }>;
}

export async function sendEmail(
  payload: EmailPayload,
): Promise<{ messageId: string }> {
  const transporter = getTransporter();

  const info = await transporter.sendMail({
    from: payload.from ?? env.EMAIL_FROM,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    replyTo: payload.replyTo,
    attachments: payload.attachments,
  });

  return { messageId: info.messageId };
}

export function notificationEmailTemplate(params: {
  userName: string;
  title: string;
  body: string;
  actionUrl?: string;
  actionText?: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { color: #2563eb; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
          .content { color: #374151; line-height: 1.6; margin-bottom: 20px; }
          .action {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            text-decoration: none;
            margin-top: 16px;
          }
          .footer { color: #9ca3af; font-size: 12px; margin-top: 40px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">Sentient</div>
          <p>Hi ${params.userName},</p>
          <div class="content">
            <h2>${params.title}</h2>
            <p>${params.body}</p>
          </div>
          ${params.actionUrl ? `<a href="${params.actionUrl}" class="action">${params.actionText ?? "View"}</a>` : ""}
          <div class="footer">
            <p>© Sentient. You received this email because you have notifications enabled.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
