/**
 * Welcome Email Template
 * Sent after client successfully sets up their account
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

interface WelcomeEmailProps {
  userName: string;
  dashboardUrl: string;
}

export const WelcomeEmail = ({
  userName,
  dashboardUrl,
}: WelcomeEmailProps) => (
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

          <Text style={text}>Hi {userName},</Text>

          <Text style={text}>
            Congratulations! Your Sullivan Realty CRM account has been successfully set up.
            We're excited to have you on board.
          </Text>

          <Text style={text}>
            Your account gives you access to:
          </Text>

          <ul style={list}>
            <li>Your property dashboard with all important information</li>
            <li>Secure document storage and management</li>
            <li>Direct communication with your agent</li>
            <li>Real-time updates on your properties</li>
            <li>Market insights and analytics</li>
          </ul>

          <Section style={buttonContainer}>
            <Button style={button} href={dashboardUrl}>
              Go to Dashboard
            </Button>
          </Section>

          <Hr style={hr} />

          <Section style={tipsBox}>
            <Heading style={h3}>Getting Started Tips:</Heading>
            <ul style={tipsList}>
              <li>Complete your profile for a personalized experience</li>
              <li>Upload any relevant documents to your secure vault</li>
              <li>Set your notification preferences</li>
              <li>Explore the property search and analytics tools</li>
            </ul>
          </Section>

          <Text style={text}>
            If you have any questions or need assistance, don't hesitate to reach out.
            We're here to help!
          </Text>
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            © {new Date().getFullYear()} Sullivan Realty CRM. All rights reserved.
          </Text>
          <Text style={footerText}>
            Need help? Contact your agent or visit our support center.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default WelcomeEmail;

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

const h3 = {
  color: '#1a365d',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 12px',
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

const tipsBox = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const tipsList = {
  color: '#166534',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
  paddingLeft: '20px',
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

const footer = {
  textAlign: 'center' as const,
  padding: '0 48px',
};

const footerText = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '8px 0',
};
