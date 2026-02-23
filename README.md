# Apply2Campus – Consultant Portal MVP

A consultant portal where consultants manage 600+ students. Each student connects their Gmail via Google OAuth. Consultants can view their assigned students, open a student profile, view that student's Gmail inbox (synced via Gmail API), read email threads, and reply/send emails **from the student's Gmail account** (via Gmail API with OAuth). Admins can see all students and system health/audit logs.

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **TailwindCSS** (Lexend font, primary #137fec)
- **PostgreSQL** via Prisma
- **NextAuth** (credentials for consultant/admin login)
- **Gmail API** (googleapis) with OAuth 2.0 and refresh tokens stored encrypted

## Prerequisites

- Node.js 18+
- PostgreSQL
- Google Cloud project with Gmail API and OAuth 2.0 credentials

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in:

- **DATABASE_URL** – PostgreSQL connection string (e.g. `postgresql://user:password@localhost:5432/apply2campus`)
- **NEXTAUTH_URL** – App URL (e.g. `http://localhost:3000`)
- **NEXTAUTH_SECRET** – Long random string for JWT/session signing
- **TOKEN_ENCRYPTION_SECRET** – At least 32 characters; used to encrypt Gmail tokens at rest (AES-256-GCM)
- **GOOGLE_CLIENT_ID** / **GOOGLE_CLIENT_SECRET** – From Google Cloud Console (see below)

### 3. Google Cloud OAuth (Gmail for students)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Create or select a project.
3. Enable **Gmail API** (APIs & Services → Library → Gmail API → Enable).
4. Create **OAuth 2.0 Client ID**:
   - Application type: **Web application**
   - Authorized redirect URIs:
     - `http://localhost:3000/api/oauth/gmail/callback` (dev)
     - `https://your-domain.com/api/oauth/gmail/callback` (prod)
5. Copy Client ID and Client Secret into `.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

OAuth consent screen: configure as needed (internal or external). For Gmail read/send, you’ll need to add the scopes used by the app (see `lib/gmail.ts`: `gmail.readonly`, `gmail.send`, `gmail.modify`, `userinfo.email`).

### 4. Database

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

Seed creates:

- **Admin:** `admin@educonsult.local` / `password123`
- **Consultant:** `sarah@educonsult.local` / `password123`
- **2 students** assigned to Sarah

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in as consultant or admin.

## MVP Flow to Test

1. **Admin** – Log in as `admin@educonsult.local` → go to Student Directory (or Admin Overview). Create a student and assign a consultant.
2. **Consultant** – Log in as `sarah@educonsult.local` → see Student List (only assigned students).
3. Open a student → click **Connect Gmail** → complete Google OAuth consent → return to student page (connected).
4. Open **Inbox** → click **Refresh** to sync (or sync runs when opening inbox). Inbox list shows real messages from Gmail.
5. Open an email → **Reply** → send; email is sent from the student’s Gmail via Gmail API.
6. **Compose** – From inbox, “Compose Message” → To/Subject/Body → Send (from student’s Gmail).
7. **Token expiry** – Revoke access in Google account or wait for expiry → status shows “Token Expired” and **Re-auth** button.

## Project Structure

- `app/` – Next.js App Router pages and API routes
- `app/api/auth/[...nextauth]` – NextAuth
- `app/api/students` – List/create students (RBAC: consultant sees own, admin sees all)
- `app/api/students/[studentId]` – Get/update student
- `app/api/oauth/gmail/start` – Redirect to Google OAuth (state = studentId)
- `app/api/oauth/gmail/callback` – Exchange code, store encrypted tokens
- `app/api/students/[studentId]/emails` – List emails (inbox/sent)
- `app/api/students/[studentId]/emails/[messageId]` – Get message + thread
- `app/api/students/[studentId]/sync` – Trigger Gmail sync
- `app/api/students/[studentId]/send` – Send email as student (Gmail API)
- `app/api/students/[studentId]/disconnect` – Disconnect Gmail
- `app/api/admin/stats` – Dashboard stats (admin only)
- `app/api/admin/audit-logs` – Audit log list (admin only)
- `lib/auth.ts` – NextAuth config
- `lib/db.ts` – Prisma client
- `lib/encryption.ts` – AES-256-GCM for tokens
- `lib/gmail.ts` – Gmail OAuth URL, client, sync, send
- `lib/rbac.ts` – canAccessStudent, getStudentsForUser
- `prisma/schema.prisma` – Data models
- `components/` – AppLayout, ComposeModal, etc.

## Security

- **RBAC:** Consultants only access their assigned students; admin can access all.
- **Tokens:** Refresh and access tokens are encrypted at rest with `TOKEN_ENCRYPTION_SECRET`.
- **Audit:** Connect, disconnect, send email, and token refresh failures can be logged (see `AuditLog` and admin feed).

## Gmail Integration Notes

- **No “Send As” from Workspace:** Emails are sent via Gmail API using each student’s own OAuth tokens (users.messages.send as “me”).
- **Scopes:** `gmail.readonly`, `gmail.send`, `gmail.modify`, `userinfo.email` (see `lib/gmail.ts`).
- **Sync:** On-demand when opening student inbox + “Refresh”; syncs INBOX and SENT. For background sync you can add a cron or queue (e.g. BullMQ + Redis) that calls the sync logic.

## License

Private / internal use as required.
