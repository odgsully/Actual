/**
 * Resend Email Client
 * Handles all email sending through Resend API
 */

import { Resend } from 'resend';
import { InvitationEmail } from './templates/invitation';
import { PasswordResetEmail } from './templates/password-reset';
import { WelcomeEmail } from './templates/welcome';

// Lazy-initialized Resend client
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

// Email configuration (lazy-loaded at runtime)
function getEmailConfig() {
  const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || 'no-reply@gsrealty.com';
  return {
    from: DEFAULT_FROM,
    replyTo: process.env.RESEND_REPLY_TO_EMAIL || DEFAULT_FROM,
  };
}

/**
 * Interface for invitation email parameters
 */
export interface SendInvitationEmailParams {
  to: string;
  clientName: string;
  setupUrl: string;
  customMessage?: string;
  expiresInDays?: number;
}

/**
 * Interface for password reset email parameters
 */
export interface SendPasswordResetEmailParams {
  to: string;
  userName: string;
  resetUrl: string;
  expiresInHours?: number;
}

/**
 * Interface for welcome email parameters
 */
export interface SendWelcomeEmailParams {
  to: string;
  userName: string;
  dashboardUrl: string;
}

/**
 * Email response type
 */
export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send invitation email to client
 */
export async function sendInvitationEmail(
  params: SendInvitationEmailParams
): Promise<EmailResponse> {
  try {
    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured. Email not sent.');
      console.log('Would send invitation email to:', params.to);
      console.log('Setup URL:', params.setupUrl);
      return {
        success: true,
        messageId: 'mock-message-id-dev',
      };
    }

    // Send email via Resend
    const { data, error } = await getResendClient().emails.send({
      from: getEmailConfig().from,
      replyTo: getEmailConfig().replyTo,
      to: params.to,
      subject: 'Welcome to GSRealty - Set Up Your Account',
      react: InvitationEmail({
        clientName: params.clientName,
        setupUrl: params.setupUrl,
        customMessage: params.customMessage,
        expiresInDays: params.expiresInDays || 7,
      }),
    });

    if (error) {
      console.error('Resend API error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('Invitation email sent successfully:', data?.id);
    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  params: SendPasswordResetEmailParams
): Promise<EmailResponse> {
  try {
    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured. Email not sent.');
      console.log('Would send password reset email to:', params.to);
      console.log('Reset URL:', params.resetUrl);
      return {
        success: true,
        messageId: 'mock-message-id-dev',
      };
    }

    // Send email via Resend
    const { data, error } = await getResendClient().emails.send({
      from: getEmailConfig().from,
      replyTo: getEmailConfig().replyTo,
      to: params.to,
      subject: 'Reset Your GSRealty Password',
      react: PasswordResetEmail({
        userName: params.userName,
        resetUrl: params.resetUrl,
        expiresInHours: params.expiresInHours || 24,
      }),
    });

    if (error) {
      console.error('Resend API error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('Password reset email sent successfully:', data?.id);
    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send welcome email after account setup
 */
export async function sendWelcomeEmail(
  params: SendWelcomeEmailParams
): Promise<EmailResponse> {
  try {
    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured. Email not sent.');
      console.log('Would send welcome email to:', params.to);
      return {
        success: true,
        messageId: 'mock-message-id-dev',
      };
    }

    // Send email via Resend
    const { data, error } = await getResendClient().emails.send({
      from: getEmailConfig().from,
      replyTo: getEmailConfig().replyTo,
      to: params.to,
      subject: 'Welcome to GSRealty!',
      react: WelcomeEmail({
        userName: params.userName,
        dashboardUrl: params.dashboardUrl,
      }),
    });

    if (error) {
      console.error('Resend API error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('Welcome email sent successfully:', data?.id);
    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Verify Resend API key is configured
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}
