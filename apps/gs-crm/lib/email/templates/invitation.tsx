/**
 * Invitation Email Template
 * Sent when admin invites a client to set up their account
 */

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Button,
  Hr,
} from '@react-email/components';

interface InvitationEmailProps {
  clientName: string;
  setupUrl: string;
  customMessage?: string;
  expiresInDays?: number;
}

export const InvitationEmail = ({
  clientName,
  setupUrl,
  customMessage,
  expiresInDays = 7,
}: InvitationEmailProps) => (
  <Html>
    <Head />
    <Body style={main}>
      <Container style={container}>
        {/* Header */}
        <Section style={header}>
          <Heading style={h1}>Sullivan Realty CRM</Heading>
        </Section>

        {/* Main Content */}
        <Section style={content}>
          <Heading style={h2}>Welcome to Sullivan Realty CRM!</Heading>

          <Text style={text}>Hi {clientName},</Text>

          <Text style={text}>
            You've been invited to set up your Sullivan Realty CRM client account.
            With your account, you'll be able to:
          </Text>

          <ul style={list}>
            <li>View your property information</li>
            <li>Access important documents</li>
            <li>Communicate with your agent</li>
            <li>Track your real estate journey</li>
          </ul>

          {customMessage && (
            <Section style={customMessageBox}>
              <Text style={customMessageText}>{customMessage}</Text>
            </Section>
          )}

          <Section style={buttonContainer}>
            <Button style={button} href={setupUrl}>
              Set Up Your Account
            </Button>
          </Section>

          <Text style={smallText}>
            This invitation link will expire in {expiresInDays} days.
          </Text>

          <Hr style={hr} />

          <Text style={smallText}>
            If you didn't expect this invitation, you can safely ignore this email.
          </Text>
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            © {new Date().getFullYear()} Sullivan Realty CRM. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default InvitationEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 20px',
  textAlign: 'center' as const,
  backgroundColor: '#1a365d',
};

const h1 = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
};

const content = {
  padding: '0 48px',
};

const h2 = {
  color: '#1a365d',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '30px 0 15px',
};

const text = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const list = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
  paddingLeft: '20px',
};

const customMessageBox = {
  backgroundColor: '#f0f7ff',
  border: '1px solid #bfdbfe',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
};

const customMessageText = {
  color: '#1e40af',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
  fontStyle: 'italic' as const,
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
};

const smallText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
  textAlign: 'center' as const,
};

const footer = {
  textAlign: 'center' as const,
  padding: '0 48px',
};

const footerText = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '0',
};
