# Email Invitation System - GSRealty Client Management

## Overview

The Email Invitation System provides secure, token-based client onboarding via magic links. Admins can invite clients who receive an email with a unique setup link valid for 7 days.

## Architecture

### Components

1. **Email Client** (`lib/email/resend-client.ts`)
   - Sends emails via Resend API
   - Handles invitation, password reset, and welcome emails
   - Graceful fallback if Resend not configured (dev mode)

2. **Email Templates** (`lib/email/templates/`)
   - `invitation.tsx` - Client invitation with magic link
   - `password-reset.tsx` - Password reset link
   - `welcome.tsx` - Welcome email after setup

3. **Database Functions** (`lib/database/invitations.ts`)
   - Create, retrieve, and manage invitations
   - Token validation and expiration handling
   - Invitation status tracking

4. **API Routes**
   - `/api/admin/invites/send` - Send new invitation
   - `/api/admin/invites/resend` - Resend invitation with new token
   - `/api/admin/invites/verify` - Verify token validity (public)

5. **Setup Page** (`/app/setup/[token]/page.tsx`)
   - Public page for account creation
   - Token validation
   - Password setup form
   - Auto-login after setup

6. **Admin Modal** (`components/admin/InviteClientModal.tsx`)
   - UI for sending invitations
   - Client selection dropdown
   - Custom message support

## Database Schema

```sql
CREATE TABLE public.gsrealty_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.gsrealty_clients(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.gsrealty_users(id),
  custom_message TEXT
);
```

### Migration

Run the migration to create the invitations table:

```bash
# Apply migration via Supabase CLI
supabase db push

# Or use the admin API endpoint (development only)
POST /api/admin/run-migration
{
  "migrationFile": "20251017000000_create_invitations_table.sql"
}
```

## Configuration

### Environment Variables

Add to your `.env.local`:

```bash
# Required for email sending
RESEND_API_KEY=re_your_api_key_here

# Optional - defaults shown
RESEND_FROM_EMAIL=no-reply@gsrealty.com
RESEND_REPLY_TO_EMAIL=support@gsrealty.com

# Required for magic links
NEXT_PUBLIC_APP_URL=http://localhost:3004
```

### Get Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain (or use onboarding domain for testing)
3. Create an API key
4. Add to `.env.local`

### Domain Configuration

For production, you'll need to:
1. Add and verify your domain in Resend
2. Update `RESEND_FROM_EMAIL` to use your domain
3. Configure DNS records (SPF, DKIM, DMARC)

## Usage

### 1. Admin Sends Invitation

```typescript
// Using the InviteClientModal component
import InviteClientModal from '@/components/admin/InviteClientModal';

<InviteClientModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSuccess={() => {
    console.log('Invitation sent!');
  }}
/>
```

### 2. API Usage (Direct)

```typescript
// Send invitation
const response = await fetch('/api/admin/invites/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clientId: 'uuid-here',
    customMessage: 'Welcome to GSRealty!'
  })
});

const data = await response.json();
// Returns: { success, invitation: { id, email, expiresAt, setupUrl }, emailSent, messageId }
```

### 3. Resend Invitation

```typescript
// Resend with new token
const response = await fetch('/api/admin/invites/resend', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    invitationId: 'uuid-here', // or clientId
    customMessage: 'Here is your new invitation link'
  })
});
```

### 4. Client Receives Email

Client receives professional email with:
- Personalized greeting
- Magic link to `/setup/[token]`
- Custom message (if provided)
- Expiration notice (7 days)

### 5. Client Sets Up Account

1. Click magic link in email
2. Token validated automatically
3. Create password (min 8 chars)
4. Accept terms
5. Submit form
6. Account created + auto sign-in
7. Redirect to `/client/dashboard`

## Email Templates

### Customization

Templates use React Email components with inline styles. Edit in `lib/email/templates/`:

```typescript
// invitation.tsx
export const InvitationEmail = ({
  clientName,
  setupUrl,
  customMessage,
  expiresInDays = 7,
}: InvitationEmailProps) => (
  <Html>
    <Body>
      <Container>
        <Heading>Welcome to GSRealty!</Heading>
        <Text>Hi {clientName},</Text>
        <Button href={setupUrl}>Set Up Your Account</Button>
      </Container>
    </Body>
  </Html>
);
```

### Testing Locally

Preview emails in development:

```bash
# Install React Email CLI
npm install -g react-email

# Preview templates
cd lib/email/templates
react-email dev
```

Open http://localhost:3000 to see email previews.

## Security Features

### Token Security
- **UUID v4 tokens** - Cryptographically secure
- **Single-use** - Marked as used after account creation
- **7-day expiration** - Automatic invalidation
- **Client-bound** - Token linked to specific client ID

### Access Control
- Admin-only invitation sending (role check)
- Public token verification (for setup page)
- RLS policies on invitations table

### Password Requirements
- Minimum 8 characters
- Stored as bcrypt hash via Supabase Auth

## Error Handling

### Common Scenarios

1. **Invitation Expired**
   - Code: `EXPIRED`
   - User message: "This invitation has expired"
   - Action: Admin must resend

2. **Invitation Already Used**
   - Code: `USED`
   - User message: "Already used. Try signing in."
   - Action: Redirect to sign-in

3. **Account Exists**
   - Code: `ACCOUNT_EXISTS`
   - User message: "Account already exists"
   - Action: Redirect to sign-in

4. **Email Send Failed**
   - Status: 207 Multi-Status
   - Creates invitation but flags email failure
   - Admin can retry or share link manually

## Development Mode

If `RESEND_API_KEY` is not configured:

```typescript
// Email client logs to console instead of sending
console.log('Would send invitation email to:', params.to);
console.log('Setup URL:', params.setupUrl);

// Returns mock success
return {
  success: true,
  messageId: 'mock-message-id-dev',
};
```

This allows testing without Resend account.

## Database Functions

### Create Invitation

```typescript
const { invitation, error } = await createInvitation({
  clientId: 'uuid',
  email: 'client@example.com',
  customMessage: 'Welcome!',
  expiresInDays: 7,
  createdBy: 'admin-user-id'
});
```

### Verify Token

```typescript
const { invitation, error } = await getInvitationByToken(token);
// Checks: exists, not used, not expired
```

### Mark as Used

```typescript
const { success, error } = await markInvitationUsed(token);
```

### Cleanup Expired

```typescript
const { count, error } = await deleteExpiredInvitations();
// Deletes invitations expired >30 days ago
```

## Monitoring

### Invitation Analytics

Query invitation statistics:

```sql
-- Pending invitations
SELECT COUNT(*) FROM gsrealty_invitations
WHERE used_at IS NULL AND expires_at > NOW();

-- Used invitations (last 30 days)
SELECT COUNT(*) FROM gsrealty_invitations
WHERE used_at IS NOT NULL
AND used_at > NOW() - INTERVAL '30 days';

-- Expired unused invitations
SELECT COUNT(*) FROM gsrealty_invitations
WHERE used_at IS NULL AND expires_at < NOW();
```

### Email Logs

Resend provides:
- Delivery status
- Open tracking (optional)
- Click tracking (optional)
- Bounce handling

Access via [Resend Dashboard](https://resend.com/emails).

## Troubleshooting

### Email Not Received

1. Check spam folder
2. Verify `RESEND_API_KEY` is set
3. Check Resend dashboard for delivery status
4. Ensure sender domain is verified
5. Check email address is valid

### Token Invalid

1. Check expiration date
2. Verify token hasn't been used
3. Check client hasn't already created account
4. Ensure invitation exists in database

### Setup Page Errors

1. Check browser console for errors
2. Verify API routes are accessible
3. Check database connection
4. Ensure client record exists

## Testing Checklist

- [ ] Send invitation to test email
- [ ] Receive email with magic link
- [ ] Click link and load setup page
- [ ] Verify client info displayed correctly
- [ ] Create password and submit
- [ ] Auto sign-in works
- [ ] Redirect to dashboard
- [ ] Token marked as used
- [ ] Client linked to user account
- [ ] Cannot reuse same token
- [ ] Resend creates new token

## Production Deployment

1. **Set up Resend**
   - Add production domain
   - Verify DNS records
   - Create production API key

2. **Update Environment**
   ```bash
   RESEND_API_KEY=re_prod_xxx
   RESEND_FROM_EMAIL=no-reply@yourdomain.com
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

3. **Run Migration**
   ```bash
   supabase db push
   ```

4. **Test End-to-End**
   - Send real invitation
   - Complete setup flow
   - Verify email delivery

## Future Enhancements

- [ ] Email templates with company branding
- [ ] Bulk invitation sending
- [ ] Invitation expiration reminders
- [ ] Analytics dashboard
- [ ] Webhook notifications
- [ ] Email preview before sending
- [ ] Scheduled invitations
- [ ] Multi-language templates

## Support

For issues:
1. Check this documentation
2. Review error logs
3. Check Resend dashboard
4. Verify database state
5. Contact support with error details

---

**Last Updated**: October 17, 2025
**Version**: 1.0.0
**Maintained by**: Agent J (Email System Engineer)
