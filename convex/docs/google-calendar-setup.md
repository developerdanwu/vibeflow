# Google Calendar Sync – Setup

## Google Cloud Console

1. Use the same Google Cloud project as WorkOS (or create one).
2. Enable **Google Calendar API**: APIs & Services → Library → search "Google Calendar API" → Enable.
3. Create **OAuth 2.0 credentials**: APIs & Services → Credentials → Create Credentials → OAuth client ID.
   - Application type: **Web application**.
   - Authorized redirect URIs (add both):
     - `http://localhost:3000/settings/calendars/callback` (dev)
     - `https://<your-production-domain>/settings/calendars/callback` (prod)
4. Copy **Client ID** and **Client Secret**.

## Convex environment variables

Set these in the Convex dashboard (Settings → Environment Variables) for your deployment:

| Variable | Description |
| -------- | ----------- |
| `GOOGLE_CALENDAR_CLIENT_ID` | OAuth 2.0 Web client ID from Google Cloud |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | OAuth 2.0 Web client secret |
| `ENCRYPTION_KEY` | (Optional) 32-byte hex key for encrypting refresh tokens in the DB |
| `GOOGLE_CALENDAR_WEBHOOK_URL` | Full URL for push notifications (e.g. `https://<deploy>.convex.site/google-calendar-webhook`) |

## OAuth scopes

- Minimum: `https://www.googleapis.com/auth/calendar.events`
- For calendar list: `https://www.googleapis.com/auth/calendar.readonly` or `https://www.googleapis.com/auth/calendar`
