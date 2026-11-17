import * as fs from 'fs';
import * as path from 'path';
import * as nodemailer from 'nodemailer';
import { logger } from 'firebase-functions';

export type EmailTemplateName =
  | 'verifyEmail'
  | 'welcome'
  | 'bookingConfirmation'
  | 'paymentReceipt'
  | 'passwordReset';

const DEFAULT_APP_URL = 'https://whisk.travel';
const SYNTHETIC_EMAIL_DOMAIN = '@users.whisk.app';

export function isRealDeliverableEmail(email: unknown): email is string {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes('@') || trimmed.length < 5) return false;
  if (trimmed.endsWith(SYNTHETIC_EMAIL_DOMAIN) || trimmed.endsWith('@whisk.local') || trimmed.endsWith('@users.local')) {
    return false;
  }
  return true;
}

export function getLegalUrls() {
  const appUrl = (process.env.APP_URL || DEFAULT_APP_URL).replace(/\/+$/, '');
  return {
    appUrl,
    termsUrl: `${appUrl}/legal/terms`,
    privacyUrl: `${appUrl}/legal/privacy`,
    refundsUrl: `${appUrl}/legal/refunds`,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeHref(raw: string): string {
  const trimmed = raw.trim();
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('mailto:')
  ) {
    return escapeHtml(trimmed);
  }
  return '#';
}

function resolveTemplatePath(fileName: string): string {
  const candidates = [
    path.resolve(__dirname, '../templates/email', fileName),
    path.resolve(__dirname, '../../templates/email', fileName),
    path.resolve(process.cwd(), 'templates/email', fileName),
    path.resolve(process.cwd(), 'functions/templates/email', fileName),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error(`Email template file not found: ${fileName}`);
}

export function renderEmailTemplates(
  templateName: EmailTemplateName,
  variables: Record<string, string | undefined>
): { html: string; text: string } {
  const legal = getLegalUrls();
  const merged: Record<string, string> = {
    appUrl: legal.appUrl,
    termsUrl: legal.termsUrl,
    privacyUrl: legal.privacyUrl,
    refundsUrl: legal.refundsUrl,
  };
  for (const [key, val] of Object.entries(variables)) {
    if (typeof val === 'string') {
      merged[key] = val;
    }
  }

  const rawHtml = fs.readFileSync(resolveTemplatePath(`${templateName}.html`), 'utf-8');
  const rawTxt = fs.readFileSync(resolveTemplatePath(`${templateName}.txt`), 'utf-8');

  const html = rawHtml.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_match, key: string) => {
    const val = merged[key] || '';
    if (key.endsWith('Url') || key.endsWith('Link')) {
      return sanitizeHref(val);
    }
    return escapeHtml(val);
  });

  const text = rawTxt.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_match, key: string) => merged[key] || '');

  return { html, text };
}

function createTransporter(): nodemailer.Transporter | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || 587);

  if (!host || !user || !pass || /^SG\.X{8,}$/i.test(pass.trim())) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  template: EmailTemplateName;
  variables: Record<string, string | undefined>;
}): Promise<{ delivered: boolean; messageId?: string; skippedReason?: string }> {
  if (!isRealDeliverableEmail(params.to)) {
    logger.info('Skipping transactional email for non-deliverable address', {
      template: params.template,
    });
    return { delivered: false, skippedReason: 'NON_DELIVERABLE_EMAIL' };
  }

  const { html, text } = renderEmailTemplates(params.template, params.variables);
  const transporter = createTransporter();
  if (!transporter) {
    logger.warn('SMTP credentials are not configured; email rendered but not dispatched.', {
      template: params.template,
      to: params.to,
    });
    return { delivered: false, skippedReason: 'SMTP_NOT_CONFIGURED' };
  }

  const from = process.env.EMAIL_FROM || 'Whisk Travel <no-reply@whisk.travel>';
  const info = await transporter.sendMail({
    from,
    to: params.to,
    replyTo: 'privacy@whisk.travel',
    subject: params.subject,
    html,
    text,
  });

  return { delivered: true, messageId: info.messageId };
}
