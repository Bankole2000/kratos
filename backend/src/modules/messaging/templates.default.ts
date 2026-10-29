import { ChannelTemplates } from './messaging.types';

// Copy reflects auth.service.ts's actual TTLs (EMAIL_VERIFICATION_TTL_HOURS,
// PASSWORD_RESET_TTL_HOURS) — keep these in sync if those constants change.

const emailVerificationTemplates: ChannelTemplates = {
  email: {
    subject: 'Verify your email address',
    html: `<h1>Email Verification</h1>
<p>Hi {{name}},</p>
<p>Use the code below to verify your email address. It expires in 24 hours.</p>
<h2 style="letter-spacing:8px;font-size:32px;">{{code}}</h2>
<p>If you didn't request this, you can safely ignore this email.</p>`,
    text: 'Hi {{name}}, your verification code is: {{code}}. It expires in 24 hours.',
  },
};

const passwordResetTemplates: ChannelTemplates = {
  email: {
    subject: 'Reset your password',
    html: `<h1>Password Reset</h1>
<p>Hi {{name}},</p>
<p>Use the code below to reset your password. It expires in 1 hour.</p>
<h2 style="letter-spacing:8px;font-size:32px;">{{code}}</h2>
<p>If you didn't request a password reset, you can safely ignore this email.</p>`,
    text: 'Hi {{name}}, your password reset code is: {{code}}. It expires in 1 hour.',
  },
  in_app: {
    title: 'Password reset requested',
    body: 'A password reset was requested for your account. Check your email for the code.',
  },
};

export const DEFAULT_TEMPLATES: Record<string, ChannelTemplates> = {
  'email.verification': emailVerificationTemplates,
  'password.reset': passwordResetTemplates,
};
