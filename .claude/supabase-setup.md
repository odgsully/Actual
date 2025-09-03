# Supabase MCP Setup Guide

## 1. Install Supabase MCP Server
```bash
npm install -g @supabase/mcp-server
```

## 2. Get Your Supabase Credentials

### From Supabase Dashboard:
1. Go to your project dashboard
2. Navigate to Settings > API
3. Copy the following values:
   - **Project URL** (SUPABASE_URL)
   - **anon public** key (SUPABASE_ANON_KEY)
   - **service_role** key (SUPABASE_SERVICE_ROLE_KEY)

## 3. Update Environment Variables

Replace the placeholder values in `.claude/.mcp.json`:

```json
{
  "mcpServers": {
    "Supabase": {
      "command": "npx",
      "args": [
        "@supabase/mcp-server"
      ],
      "env": {
        "SUPABASE_URL": "https://your-project-id.supabase.co",
        "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
  }
}
```

## 4. Available Supabase MCP Tools

Once configured, you'll have access to:

- **Database Operations**: Query, insert, update, delete records
- **Table Management**: Create, modify, drop tables
- **Schema Operations**: Manage database schemas
- **Real-time Subscriptions**: Listen to database changes
- **Storage Operations**: File upload/download to Supabase Storage
- **Authentication**: User management and auth operations
- **Edge Functions**: Deploy and manage serverless functions

## 5. Security Notes

- Keep your service role key secure - it bypasses RLS
- Use anon key for client-side operations
- Consider using environment variables for production

## 6. Restart Claude

After updating the configuration, restart Claude to load the new MCP server.
