// =============================================================================
// Messaging types — shared across all channels and providers.
// Mirrors the Prisma enums (NotificationChannel/NotificationProvider/
// NotificationStatus/PushPlatform) for the plain-TS shapes used in function
// signatures before touching Prisma.
// =============================================================================

export type NotificationChannelName = 'email' | 'sms' | 'push' | 'in_app';
export type NotificationProviderName = 'resend' | 'fcm' | 'in_app';
export type PushPlatformName = 'fcm' | 'apns' | 'web';

// ─── Rendered content per channel ────────────────────────────────────────────

export interface EmailContent {
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

// Kept for type-completeness (ChannelTemplates below) — no SmsChannel exists
// yet, nothing constructs one. Add real SMS support when a real need shows up.
export interface SmsContent {
  text: string;
  from?: string;
}

export interface PushContent {
  title: string;
  body: string;
  imageUrl?: string;
  actionUrl?: string;
  /** String key/value pairs forwarded to the app payload */
  data?: Record<string, string>;
}

export interface InAppContent {
  title: string;
  body: string;
  actionUrl?: string;
  icon?: string;
}

export type RenderedContent = EmailContent | SmsContent | PushContent | InAppContent;

// ─── Template source (Handlebars strings, not yet rendered) ──────────────────

export interface ChannelTemplates {
  email?: Omit<EmailContent, 'from'>;
  sms?: Omit<SmsContent, 'from'>;
  push?: PushContent;
  in_app?: InAppContent;
}

// ─── Recipient ────────────────────────────────────────────────────────────────

export interface NotificationRecipient {
  /** Absent when the recipient has no corresponding CRS User row (e.g. a
   * recipient of another project's generic send) — Notification.userId is
   * nullable precisely for this case. */
  userId?: string;
  /** Required for email channel */
  email?: string;
  /** Required for sms channel — E.164 format */
  phone?: string;
}

// ─── Channel send result ─────────────────────────────────────────────────────

export interface ChannelSendResult {
  channel: NotificationChannelName;
  success: boolean;
  providerMessageId?: string;
  error?: string;
}
