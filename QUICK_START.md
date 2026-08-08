# CampusDesk quick start

1. Open two terminals in the project root.

## Terminal 1 — backend

```bash
cd server
npm install
```

Make sure `server/.env` exists. If it does not, copy `.env.example` to `.env` and set a JWT secret.

Then:

```bash
npx prisma migrate dev
npx prisma generate
npm run seed
npm run dev
```

You should see:

```text
Server is running on http://localhost:3000
CampusDesk reminder/completion cron started.
```

## Terminal 2 — frontend

```bash
cd client
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## Login for demo

Use one of:

- `naavya@lnmiit.ac.in` — student
- `rahul@lnmiit.ac.in` — student
- `admin@lnmiit.ac.in` — admin

Enter any name with the email. The OTP appears in the backend terminal because SMTP is optional for development.

## Important

Do not commit `server/.env`.

The committed `server/.env.example` shows the expected environment variables.

The first `npx prisma migrate dev` creates the SQLite database from the migration history. `npm run seed` inserts the demo users and 8 resources.

If you already have an old CampusDesk database and want to preserve it, do not run `npm run seed`, because the seed intentionally clears and recreates demo data.
