"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRealDeliverableEmail = isRealDeliverableEmail;
exports.getLegalUrls = getLegalUrls;
exports.renderEmailTemplates = renderEmailTemplates;
exports.sendTransactionalEmail = sendTransactionalEmail;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const nodemailer = __importStar(require("nodemailer"));
const firebase_functions_1 = require("firebase-functions");
const DEFAULT_APP_URL = 'https://whisk.travel';
const SYNTHETIC_EMAIL_DOMAIN = '@users.whisk.app';
function isRealDeliverableEmail(email) {
    if (typeof email !== 'string')
        return false;
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes('@') || trimmed.length < 5)
        return false;
    if (trimmed.endsWith(SYNTHETIC_EMAIL_DOMAIN) || trimmed.endsWith('@whisk.local') || trimmed.endsWith('@users.local')) {
        return false;
    }
    return true;
}
function getLegalUrls() {
    const appUrl = (process.env.APP_URL || DEFAULT_APP_URL).replace(/\/+$/, '');
    return {
        appUrl,
        termsUrl: `${appUrl}/legal/terms`,
        privacyUrl: `${appUrl}/legal/privacy`,
        refundsUrl: `${appUrl}/legal/refunds`,
    };
}
function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function sanitizeHref(raw) {
    const trimmed = raw.trim();
    if (trimmed.startsWith('https://') ||
        trimmed.startsWith('http://') ||
        trimmed.startsWith('mailto:')) {
        return escapeHtml(trimmed);
    }
    return '#';
}
function resolveTemplatePath(fileName) {
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
function renderEmailTemplates(templateName, variables) {
    const legal = getLegalUrls();
    const merged = {
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
    const html = rawHtml.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_match, key) => {
        const val = merged[key] || '';
        if (key.endsWith('Url') || key.endsWith('Link')) {
            return sanitizeHref(val);
        }
        return escapeHtml(val);
    });
    const text = rawTxt.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_match, key) => merged[key] || '');
    return { html, text };
}
function createTransporter() {
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
async function sendTransactionalEmail(params) {
    if (!isRealDeliverableEmail(params.to)) {
        firebase_functions_1.logger.info('Skipping transactional email for non-deliverable address', {
            template: params.template,
        });
        return { delivered: false, skippedReason: 'NON_DELIVERABLE_EMAIL' };
    }
    const { html, text } = renderEmailTemplates(params.template, params.variables);
    const transporter = createTransporter();
    if (!transporter) {
        firebase_functions_1.logger.warn('SMTP credentials are not configured; email rendered but not dispatched.', {
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
//# sourceMappingURL=emailService.js.map