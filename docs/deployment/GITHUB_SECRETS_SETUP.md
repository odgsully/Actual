# GitHub Secrets Setup Guide

> Last Updated: December 2025
> Purpose: Configure GitHub Secrets for CI/CD deployment workflows

## Required Secrets

The following secrets must be configured in your GitHub repository for the deployment workflows to function:

### Vercel Deployment Secrets

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `VERCEL_TOKEN` | Vercel authentication token | [Vercel Dashboard → Settings → Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Your Vercel organization/team ID | See "Finding Vercel IDs" below |
| `VERCEL_PROJECT_ID` | The Vercel project ID | See "Finding Vercel IDs" below |

### Supabase Secrets

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | [Supabase Dashboard → Project Settings → API](https://app.supabase.com/) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Same location as URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) | Same location (keep secret!) |

### Optional Secrets

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `SLACK_WEBHOOK_URL` | Slack notification webhook | [Slack API → Incoming Webhooks](https://api.slack.com/messaging/webhooks) |
| `DISCORD_WEBHOOK_URL` | Discord notification webhook | Discord → Server Settings → Integrations → Webhooks |

---

## Step-by-Step Setup

### 1. Create Vercel Token

1. Go to [Vercel Account Settings → Tokens](https://vercel.com/account/tokens)
2. Click "Create"
3. Name: `github-actions-deploy`
4. Scope: Full Account
5. Expiration: No Expiration (or set reminder to rotate)
6. Copy the token immediately (it won't be shown again)

### 2. Finding Vercel IDs

Run this command in your project root:

```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Link your project (this creates .vercel/project.json)
vercel link

# View the IDs
cat .vercel/project.json
```

Output will look like:
```json
{
  "orgId": "team_xxxxxxxxxxxxx",
  "projectId": "prj_xxxxxxxxxxxxx"
}
```

Use these values for `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`.

### 3. Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret:

```
Name: VERCEL_TOKEN
Value: [your token from step 1]

Name: VERCEL_ORG_ID
Value: team_xxxxxxxxxxxxx

Name: VERCEL_PROJECT_ID
Value: prj_xxxxxxxxxxxxx

Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://xxxxx.supabase.co

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGci...
```

### 4. Create Production Environment

For additional protection on production deployments:

1. Go to **Settings** → **Environments**
2. Click **New environment**
3. Name: `production`
4. Configure protection rules:
   - ✅ Required reviewers (add yourself or team)
   - ✅ Wait timer: 0 minutes (or add delay)
5. Click **Save protection rules**

---

## Verify Setup

After adding secrets, you can verify the staging workflow:

1. Push a commit to `main` branch
2. Go to **Actions** tab
3. Watch the "Deploy to Staging" workflow run
4. Check that all jobs complete successfully

For production:

1. Go to **Actions** → **Deploy to Production**
2. Click **Run workflow**
3. Type `deploy` in the confirmation field
4. Click **Run workflow**
5. Approve the deployment if environment protection is enabled

---

## Troubleshooting

### "Error: Vercel CLI requires authentication"

Your `VERCEL_TOKEN` is invalid or missing.

1. Check the token in GitHub Secrets
2. Regenerate if expired
3. Ensure no leading/trailing whitespace

### "Error: Project not found"

Your `VERCEL_PROJECT_ID` or `VERCEL_ORG_ID` is incorrect.

1. Run `vercel link` locally
2. Check `.vercel/project.json`
3. Update the secrets

### "Build failed: Missing environment variables"

Supabase secrets are missing or incorrect.

1. Verify `NEXT_PUBLIC_SUPABASE_URL` format: `https://xxx.supabase.co`
2. Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the public/anon key (starts with `eyJ`)

### "Environment 'production' not found"

You haven't created the production environment in GitHub.

1. Go to Settings → Environments
2. Create `production` environment
3. Re-run the workflow

---

## Security Notes

- **Never commit secrets** to the repository
- **Rotate tokens** periodically (every 6-12 months)
- **Use environment protection** for production deployments
- **Limit token scope** when possible (Vercel tokens are full-account by default)
- **Review audit logs** in GitHub Settings → Security → Audit log

---

## Related Documentation

- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Supabase API Settings](https://supabase.com/docs/guides/api)
