# Phase 6: Google and Apple API Integrations - Requirements Document

> **Status**: Research Complete - Ready for Implementation Planning
> **Last Updated**: December 22, 2025
> **Related Plan**: [tile-logic-untile.md](../tile-logic-untile.md)

## Table of Contents

1. [Overview](#overview)
2. [Tiles in Phase 6](#tiles-in-phase-6)
3. [Google Forms API](#google-forms-api)
4. [Apple API Limitations](#apple-api-limitations)
5. [Implementation Approach](#implementation-approach)
6. [Effort Estimates](#effort-estimates)
7. [Security Considerations](#security-considerations)
8. [Testing Requirements](#testing-requirements)

---

## Overview

Phase 6 focuses on integrating external APIs for form tracking, device data, and contact management. This phase presents unique challenges:

- **Google Forms API**: Fully supported with OAuth 2.0
- **Apple APIs**: No public API for Screen Time, Contacts (device-only), or iCloud Drive (limited)

**Key Insight**: Apple APIs require alternative approaches such as iOS Shortcuts, manual data entry, or "device-only" tile variants.

---

## Tiles in Phase 6

| Tile | API | Complexity | Public API? |
|------|-----|------------|-------------|
| Forms Streak | Google Forms API | Medium | ✅ Yes |
| Time Spent Pie | Apple Screen Time | Hard | ❌ No |
| Random Contact | Apple Contacts | Hard | ⚠️ Device-only |
| iCloud Folders | iCloud Drive | Hard | ⚠️ Limited |
| Non-Google Form | Custom form | Easy | ✅ Internal |

### Tile Descriptions

1. **Forms Streak**: Shows consecutive days of Google Forms completion (e.g., daily check-in form)
2. **Time Spent Pie**: Two pie charts showing time spent on productive vs. distracting apps
3. **Random Contact**: Selects a random contact from Apple Contacts for outreach
4. **iCloud Folders**: Shows folder structure and file counts from iCloud Drive
5. **Non-Google Form**: Internal custom form (no external API needed)

---

## Google Forms API

### 1. OAuth Setup Steps

#### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project" and name it (e.g., "GS Site Dashboard")
3. Note the Project ID

#### Step 2: Enable Google Forms API

1. In Google Cloud Console, go to **APIs & Services > Library**
2. Search for "Google Forms API"
3. Click **Enable**

#### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Choose **External** user type (unless using Google Workspace)
3. Fill in required fields:
   - App name: "GS Site Dashboard"
   - User support email: your email
   - Developer contact: your email
4. Add scopes (see below)
5. Add test users (your Google account) while in development
6. Submit for verification before production (required for sensitive scopes)

#### Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client ID**
3. Choose application type: **Web application**
4. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (development)
   - `https://yourdomain.com/api/auth/google/callback` (production)
5. Click **Create**
6. Download the JSON file as `google-credentials.json`

### 2. Required OAuth Scopes

For reading form responses, use the **least privileged scope**:

```
https://www.googleapis.com/auth/forms.responses.readonly
```

**Alternative scopes** (broader access, use only if needed):

| Scope | Description | Sensitivity |
|-------|-------------|-------------|
| `forms.responses.readonly` | Read all form responses | Low |
| `forms.body.readonly` | Read form structure/questions | Low |
| `forms.body` | Read and edit forms | High (requires verification) |
| `drive.file` | Access specific Drive files | High |
| `drive` | Full Drive access | Very High |

**Recommendation**: Start with `forms.responses.readonly` to avoid Google verification delays.

### 3. API Endpoints and Usage

#### Fetch Form Responses

```typescript
// Endpoint
GET https://forms.googleapis.com/v1/forms/{formId}/responses

// Example using fetch
const response = await fetch(
  `https://forms.googleapis.com/v1/forms/${formId}/responses`,
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }
);

const data = await response.json();
// data.responses[] contains all responses
```

#### Calculate Streak

**Algorithm**:

1. Fetch all responses from the form
2. Extract submission timestamps
3. Group by date (ignore time)
4. Sort dates descending
5. Count consecutive days from today backwards

**Example**:

```typescript
function calculateStreak(responses: FormResponse[]): number {
  // Extract dates (YYYY-MM-DD format)
  const dates = responses
    .map(r => r.lastSubmittedTime.split('T')[0])
    .sort()
    .reverse();

  // Remove duplicates (multiple submissions same day)
  const uniqueDates = [...new Set(dates)];

  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  let currentDate = new Date(today);

  for (const dateStr of uniqueDates) {
    const expectedDate = currentDate.toISOString().split('T')[0];

    if (dateStr === expectedDate) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1); // Go back one day
    } else {
      break; // Streak broken
    }
  }

  return streak;
}
```

### 4. Rate Limits and Quotas

From [Google Forms API Usage Limits](https://developers.google.com/workspace/forms/api/limits):

| Limit Type | Quota | Error Code |
|------------|-------|------------|
| Read requests | Per-minute quota (project-level) | 429 Too Many Requests |
| Write requests | Per-minute quota (project-level) | 429 Too Many Requests |
| Daily requests | No limit if within per-minute quota | N/A |
| Cost | **Free** | N/A |

**Error Handling**:

```typescript
async function fetchWithRetry(url: string, options: RequestInit, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      // Exponential backoff: 2^i seconds
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }

    return response;
  }

  throw new Error('Max retries exceeded');
}
```

### 5. Required Environment Variables

Add to `.env.local` and `.env.sample`:

```bash
# Google Forms API
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Form IDs (find in form URL: forms.google.com/d/{formId}/edit)
GOOGLE_FORMS_DAILY_CHECK_IN_ID=1a2b3c4d5e6f7g8h9i0j

# Optional: Service account for server-side only (no user OAuth)
GOOGLE_SERVICE_ACCOUNT_KEY=path/to/service-account.json
```

### 6. Implementation Files

**Create these files**:

| File | Purpose | Lines (est.) |
|------|---------|--------------|
| `lib/google/forms-client.ts` | Google Forms API wrapper | ~200 |
| `lib/google/oauth.ts` | OAuth 2.0 flow handler | ~150 |
| `hooks/useGoogleForms.ts` | React Query hook | ~100 |
| `app/api/auth/google/callback/route.ts` | OAuth callback | ~80 |
| `app/api/google/forms/responses/route.ts` | Fetch responses | ~60 |
| `components/tiles/graphics/FormsStreakTile.tsx` | Streak display | ~180 |

### 7. Caching Strategy

| Data | Cache Duration | Reason |
|------|----------------|--------|
| Form responses | 5 minutes | Responses don't change frequently |
| Streak calculation | 1 hour | Only changes once per day max |
| OAuth tokens | 55 minutes | Tokens expire after 1 hour |

---

## Apple API Limitations

### Screen Time API

**Reality**: Apple's Screen Time API (FamilyControls, ManagedSettings, DeviceActivity) is **extremely limited** for third-party developers.

#### What's Available (iOS 15+)

From [Screen Time API Documentation](https://developer.apple.com/documentation/screentimeapidocumentation):

- **FamilyControls**: Request permission to manage app/web activity
- **ManagedSettings**: Define restrictions (block apps, limit usage)
- **DeviceActivity**: Monitor when thresholds are reached

#### What's NOT Available

- ❌ **No programmatic access to Screen Time data** (hours spent per app)
- ❌ **No API to read historical data**
- ❌ **No web/server API** (iOS app only)
- ❌ **No background data export**
- ❌ **Callbacks only when thresholds hit** (you can't query current values)

**Conclusion**: Cannot build "Time Spent Pie" tile with current API.

#### Proposed Workaround: iOS Shortcuts

1. **User runs a Shortcut** (manual or scheduled automation)
2. Shortcut uses Screen Time data (if available via Shortcuts app)
3. Exports JSON to iCloud Drive or sends to webhook
4. Dashboard fetches exported file

**Limitation**: Shortcuts app does **not** have access to Screen Time data either as of 2025.

**Alternative**: Manual data entry form (see Implementation Approach below).

### Apple Contacts API

**Reality**: Contacts framework exists for **iOS/macOS apps only**, not web APIs.

#### What's Available

From [Apple Contacts Framework](https://developer.apple.com/documentation/contacts):

- **CNContactStore**: Access user's contacts (iOS/macOS app)
- **CNContact**: Read contact data (name, phone, email, etc.)
- **ContactProvider** (iOS 18+): Provide contacts to system

#### What's NOT Available

- ❌ **No public web API** for iCloud Contacts
- ❌ **CloudKit Contacts API is private** (Apple only)
- ❌ **No REST API** to fetch contacts from server

**Conclusion**: Cannot directly access Apple Contacts from a web dashboard.

#### Proposed Workaround: iOS Shortcuts

**Workflow**:

1. User runs iOS Shortcut on their device
2. Shortcut uses "Get Contacts" action
3. Selects random contact (Shortcuts supports random selection)
4. Exports contact details to JSON file in iCloud Drive (Shortcuts folder)
5. Dashboard fetches JSON file via iCloud Drive API (CloudKit)

**Example Shortcut**:

```
Get Contacts (All Contacts)
→ Get Item from List (Random Item)
→ Get Details of Contact (Name, Phone, Email)
→ Dictionary (name: Contact Name, phone: Phone Number, email: Email Address)
→ Get Text from Input (JSON)
→ Save File to iCloud Drive/GS-Site/random-contact.json (Replace if exists)
```

**Dashboard Implementation**:

- Fetches `random-contact.json` from iCloud Drive
- Shows contact info in tile
- "Refresh" button triggers user to run Shortcut again

**Limitation**: Requires user action to update data.

### iCloud Drive API (CloudKit)

**Reality**: CloudKit provides **limited** access to iCloud Drive, mainly for app-specific containers.

#### What's Available

From [CloudKit Documentation](https://developer.apple.com/icloud/cloudkit/):

- **CloudKit**: Store/sync data in private or public databases
- **iCloud Documents API**: Sync unstructured file data (app-specific)
- **CloudKit Web Services**: REST API with API token

#### What's NOT Available

- ❌ **Cannot access user's full iCloud Drive** like Google Drive API
- ❌ **No folder browsing** of non-app files
- ❌ **App-specific containers only** (not user's Documents/Desktop)

**Conclusion**: Can only access files in app-specific iCloud container, not user's full iCloud Drive.

#### Proposed Workaround: iOS Shortcuts + iCloud Drive

**Workflow**:

1. User creates Shortcut to scan iCloud Drive folders
2. Shortcut uses "Get Folder Contents" action
3. Counts files per folder
4. Exports JSON to app-specific folder (accessible via CloudKit)
5. Dashboard fetches JSON via CloudKit API

**Example Shortcut**:

```
Get Folder (iCloud Drive/Documents)
→ Get Folder Contents (recursive: No)
→ Count (group by: Type)
→ Dictionary (folders: Folder Count, files: File Count, totalSize: Total Size)
→ Get Text from Input (JSON)
→ Save File to iCloud Drive/GS-Site/folder-stats.json
```

**Alternative**: Show "Open on device" button that launches Shortcuts app.

---

## Implementation Approach

### Tier 1: Full API Support (Google Forms)

**Tiles**: Forms Streak, Non-Google Form

**Implementation**:

1. Standard OAuth 2.0 flow
2. Server-side API calls with token refresh
3. React Query for caching
4. Error states with retry

**UI States**:

- **Loading**: Skeleton with "Connecting to Google Forms..."
- **Success**: Animated counter with flame icon for streak
- **Error**: "Unable to connect" with "Reconnect" button
- **No data**: "No responses yet" message

**Example Component**:

```tsx
function FormsStreakTile({ definition }: { definition: TileDefinition }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['forms-streak', formId],
    queryFn: () => fetchFormsStreak(formId),
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 1,
  });

  if (isLoading) return <TileSkeleton variant="graphic" />;

  if (error) {
    return (
      <TileError
        message="Unable to load form responses"
        onRetry={refetch}
      />
    );
  }

  return (
    <GraphicTile definition={definition}>
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-6xl font-bold">{data.streak}</div>
        <div className="text-sm text-muted-foreground mt-2">
          🔥 Day streak
        </div>
        <div className="text-xs text-muted-foreground mt-4">
          Last form: {formatDate(data.lastSubmission)}
        </div>
      </div>
    </GraphicTile>
  );
}
```

### Tier 2: Device-Only with Shortcuts (Apple Contacts, iCloud)

**Tiles**: Random Contact, iCloud Folders

**Implementation**:

1. User runs iOS Shortcut (provide download link)
2. Shortcut exports JSON to iCloud Drive/CloudKit
3. Dashboard fetches JSON via CloudKit API
4. "Refresh" button reminds user to run Shortcut

**UI States**:

- **No Shortcut**: "Tap to set up iOS Shortcut" with instructions
- **Data Available**: Show contact/folder data with timestamp
- **Stale Data**: "Data is X hours old. Tap to refresh" (opens Shortcuts)
- **Error**: "Unable to load data. Check Shortcut setup"

**Example Component**:

```tsx
function RandomContactTile({ definition }: { definition: TileDefinition }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['random-contact'],
    queryFn: fetchRandomContactFromICloud,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours (user-triggered)
  });

  const openShortcut = () => {
    // Deep link to Shortcuts app
    window.open('shortcuts://run-shortcut?name=GS-Random-Contact', '_blank');
  };

  if (!data) {
    return (
      <ButtonTile
        definition={definition}
        onClick={openShortcut}
        icon="Smartphone"
        description="Set up iOS Shortcut to enable this feature"
      />
    );
  }

  const dataAge = Date.now() - new Date(data.timestamp).getTime();
  const hoursOld = Math.floor(dataAge / (1000 * 60 * 60));

  return (
    <GraphicTile definition={definition}>
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-xl font-semibold">{data.name}</div>
        <div className="text-sm text-muted-foreground">{data.phone}</div>
        <button
          onClick={openShortcut}
          className="mt-4 text-xs text-blue-500 hover:underline"
        >
          Refresh ({hoursOld}h old)
        </button>
      </div>
    </GraphicTile>
  );
}
```

**Shortcut Distribution**:

1. Create Shortcuts using Shortcuts app on iOS
2. Export as `.shortcut` file
3. Host on website or iCloud link
4. Provide instructions in tile hover/modal

### Tier 3: Manual Entry Fallback (Screen Time)

**Tiles**: Time Spent Pie

**Implementation**:

1. User manually enters daily app usage
2. Store in Supabase or local storage
3. Display pie chart from user-entered data
4. Optional: CSV import from exported Screen Time reports

**UI States**:

- **No Data**: "Enter your Screen Time data" with form
- **Data Available**: Pie chart with last updated timestamp
- **Edit Mode**: Form to update values

**Example Component**:

```tsx
function TimeSpentPieTile({ definition }: { definition: TileDefinition }) {
  const [isEditing, setIsEditing] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['screen-time'],
    queryFn: fetchScreenTimeData, // From Supabase
  });

  if (!data) {
    return (
      <FormTile
        definition={definition}
        formTitle="Enter Screen Time Data"
        onSubmit={handleSaveScreenTime}
      >
        <label>Productive hours</label>
        <input type="number" name="productive" min="0" max="24" />

        <label>Distraction hours</label>
        <input type="number" name="distraction" min="0" max="24" />

        <button type="submit">Save</button>
      </FormTile>
    );
  }

  return (
    <GraphicTile definition={definition}>
      <PieChart data={[
        { name: 'Productive', value: data.productive, fill: '#22c55e' },
        { name: 'Distraction', value: data.distraction, fill: '#ef4444' }
      ]} />
      <button onClick={() => setIsEditing(true)}>Edit</button>
    </GraphicTile>
  );
}
```

### Tier 4: Internal Forms (No External API)

**Tiles**: Non-Google Form

**Implementation**:

1. React Hook Form with Zod validation
2. Store responses in Supabase
3. Modal dialog for form display
4. No external API dependencies

**Example**:

```tsx
function NonGoogleFormTile({ definition }: { definition: TileDefinition }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <ButtonTile
        definition={definition}
        onClick={() => setIsOpen(true)}
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{definition.name}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            {/* Custom form fields */}
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

---

## Effort Estimates

| Task | Complexity | Time Estimate | Priority |
|------|------------|---------------|----------|
| **Google Forms OAuth Setup** | Medium | 4 hours | High |
| - Create GCP project + credentials | Easy | 1 hour | High |
| - Implement OAuth flow | Medium | 2 hours | High |
| - Test token refresh | Easy | 1 hour | High |
| **Forms Streak Tile** | Medium | 6 hours | High |
| - API client for responses | Medium | 2 hours | High |
| - Streak calculation logic | Medium | 2 hours | High |
| - UI component with states | Medium | 2 hours | High |
| **iOS Shortcuts for Contacts** | Medium | 5 hours | Medium |
| - Design Shortcut workflow | Easy | 1 hour | Medium |
| - CloudKit API integration | Hard | 3 hours | Medium |
| - UI with "Run Shortcut" prompt | Easy | 1 hour | Medium |
| **iOS Shortcuts for iCloud Folders** | Medium | 5 hours | Low |
| - Similar to Contacts approach | Medium | 5 hours | Low |
| **Manual Screen Time Entry** | Easy | 4 hours | Medium |
| - Form UI | Easy | 2 hours | Medium |
| - Supabase storage | Easy | 1 hour | Medium |
| - Pie chart display | Easy | 1 hour | Medium |
| **Non-Google Form** | Easy | 3 hours | Low |
| - Modal form component | Easy | 2 hours | Low |
| - Validation + submission | Easy | 1 hour | Low |
| **Documentation + Testing** | Medium | 4 hours | High |
| - Setup guides for users | Easy | 2 hours | High |
| - Unit tests | Medium | 2 hours | High |
| **TOTAL** | | **31 hours** | |

### Phased Rollout Recommendation

**Phase 6A (Week 1)**: Google Forms only

- Google Forms OAuth setup
- Forms Streak tile
- Non-Google Form tile

**Phase 6B (Week 2)**: Apple workarounds

- iOS Shortcuts for Random Contact
- Manual Screen Time entry form
- Documentation for users

**Phase 6C (Optional)**: iCloud Folders (low priority)

---

## Security Considerations

### Google Forms API

1. **OAuth Token Storage**:
   - Store access tokens in server-side session (encrypted)
   - Store refresh tokens in database (encrypted at rest)
   - Never expose tokens to client-side JavaScript

2. **Token Refresh**:
   - Implement automatic token refresh before expiry
   - Handle refresh failures gracefully (re-authenticate)

3. **Scope Minimization**:
   - Use `forms.responses.readonly` only (least privilege)
   - Avoid requesting `drive` scope unless absolutely necessary

4. **CORS and Redirects**:
   - Whitelist redirect URIs in Google Cloud Console
   - Validate `state` parameter to prevent CSRF attacks

5. **Rate Limiting**:
   - Implement client-side rate limiting (respect quotas)
   - Cache responses aggressively to reduce API calls

**Example Token Storage (Supabase)**:

```typescript
// app/api/auth/google/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(code);

  // Store in Supabase (user_integrations table)
  const supabase = createRouteHandlerClient({ cookies });
  await supabase.from('user_integrations').upsert({
    user_id: user.id,
    provider: 'google',
    access_token: encrypt(tokens.access_token),
    refresh_token: encrypt(tokens.refresh_token),
    expires_at: Date.now() + tokens.expires_in * 1000,
  });

  return redirect('/dashboard');
}
```

### iOS Shortcuts / iCloud Drive

1. **CloudKit Security**:
   - Use CloudKit private database (user-specific)
   - Validate file signatures (if possible)
   - Set TTL on cached data (expire after 24 hours)

2. **User Privacy**:
   - Never store full contact lists (only random contact)
   - Inform users what data is collected
   - Provide "delete my data" option

3. **Shortcut Distribution**:
   - Sign Shortcuts with Apple Developer account (optional)
   - Provide checksums for .shortcut files
   - Warn users to only download from official source

---

## Testing Requirements

### Google Forms API

**Unit Tests**:

```typescript
describe('calculateStreak', () => {
  it('returns 0 for no responses', () => {
    expect(calculateStreak([])).toBe(0);
  });

  it('returns 1 for submission today only', () => {
    const today = new Date().toISOString();
    expect(calculateStreak([{ lastSubmittedTime: today }])).toBe(1);
  });

  it('returns 5 for consecutive 5 days', () => {
    const responses = Array.from({ length: 5 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return { lastSubmittedTime: date.toISOString() };
    });
    expect(calculateStreak(responses)).toBe(5);
  });

  it('breaks streak on missing day', () => {
    const responses = [
      { lastSubmittedTime: new Date().toISOString() }, // Today
      // Missing yesterday
      { lastSubmittedTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }, // 2 days ago
    ];
    expect(calculateStreak(responses)).toBe(1);
  });
});
```

**Integration Tests**:

- Mock Google Forms API responses
- Test OAuth flow (redirect, callback, token exchange)
- Test token refresh on expiry
- Test rate limiting (429 error handling)

**E2E Tests (Playwright)**:

```typescript
test('user can connect Google Forms and see streak', async ({ page }) => {
  await page.goto('/dashboard');

  // Click Forms Streak tile
  await page.click('text=Forms Streak');

  // Should redirect to Google OAuth
  await expect(page).toHaveURL(/accounts\.google\.com/);

  // (Manual: User logs in and approves)

  // After redirect back, streak should display
  await expect(page.locator('text=🔥')).toBeVisible();
  await expect(page.locator('text=/\\d+ day streak/')).toBeVisible();
});
```

### iOS Shortcuts

**Manual Testing Checklist**:

- [ ] Shortcut downloads correctly (.shortcut file)
- [ ] Shortcut runs without errors on iOS device
- [ ] JSON file appears in iCloud Drive/GS-Site folder
- [ ] Dashboard fetches JSON file successfully
- [ ] "Refresh" button opens Shortcuts app
- [ ] Stale data warning appears after 24 hours

**Shortcut Validation**:

```bash
# Test JSON output from Shortcut
curl https://icloud-api.com/v1/files/random-contact.json | jq .

# Expected output:
{
  "name": "John Doe",
  "phone": "+1234567890",
  "email": "john@example.com",
  "timestamp": "2025-12-22T10:30:00Z"
}
```

---

## Database Schema

### User Integrations Table

```sql
-- Add to Supabase migration
CREATE TABLE user_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'google', 'apple', etc.
  access_token TEXT NOT NULL, -- Encrypted
  refresh_token TEXT, -- Encrypted
  expires_at BIGINT, -- Unix timestamp
  metadata JSONB, -- Provider-specific data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, provider)
);

-- Row Level Security
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own integrations"
  ON user_integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integrations"
  ON user_integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations"
  ON user_integrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations"
  ON user_integrations FOR DELETE
  USING (auth.uid() = user_id);
```

### Screen Time Data Table

```sql
CREATE TABLE user_screen_time (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  productive_hours DECIMAL(4,2) NOT NULL CHECK (productive_hours >= 0 AND productive_hours <= 24),
  distraction_hours DECIMAL(4,2) NOT NULL CHECK (distraction_hours >= 0 AND distraction_hours <= 24),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, date)
);

-- RLS policies (same pattern as above)
```

---

## Resources

### Google Forms API

- [Google Forms API Documentation](https://developers.google.com/workspace/forms/api/reference/rest)
- [OAuth 2.0 Scopes for Google APIs](https://developers.google.com/identity/protocols/oauth2/scopes)
- [Retrieve Forms and Responses Guide](https://developers.google.com/workspace/forms/api/guides/retrieve-forms-responses)
- [Usage Limits Documentation](https://developers.google.com/workspace/forms/api/limits)
- [Python Quickstart](https://developers.google.com/workspace/forms/api/quickstart/python)

### Apple APIs

- [Screen Time API Documentation](https://developer.apple.com/documentation/screentimeapidocumentation)
- [Contacts Framework](https://developer.apple.com/documentation/contacts)
- [CloudKit Documentation](https://developer.apple.com/icloud/cloudkit/)
- [Screen Time API Proposal (Third-Party)](https://screentimeapi.com/)
- [Developer's Guide to Screen Time APIs (Medium)](https://medium.com/@juliusbrussee/a-developers-guide-to-apple-s-screen-time-apis-familycontrols-managedsettings-deviceactivity-e660147367d7)

### iOS Shortcuts

- [Apple Shortcuts User Guide](https://support.apple.com/guide/shortcuts/welcome/ios)
- [Shortcuts Archive (MacStories)](https://www.macstories.net/shortcuts/)
- [iPhone Shortcuts Automation 2025 Guide](https://isitdev.com/iphone-shortcuts-automation-2025/)

---

## Next Steps

1. **Start with Google Forms** (Tier 1 - fully supported)
   - Set up Google Cloud project
   - Implement OAuth flow
   - Build Forms Streak tile

2. **Design iOS Shortcuts** (Tier 2 - workarounds)
   - Create Random Contact Shortcut
   - Test CloudKit file access
   - Document user setup process

3. **Build Manual Entry Forms** (Tier 3 - fallbacks)
   - Screen Time data entry
   - Supabase storage
   - Pie chart visualization

4. **Document User Guides**
   - "How to connect Google Forms"
   - "How to install iOS Shortcuts"
   - "How to enter Screen Time data manually"

5. **Test End-to-End**
   - OAuth flows
   - Shortcut execution
   - Manual data entry
   - Error states

---

**Last Updated**: December 22, 2025
**Author**: AI Research
**Status**: Ready for implementation planning
