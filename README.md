# CampusDesk

Full-stack LNMIIT campus resource booking application.

## Stack

- Frontend: React + Vite + Axios
- Backend: Node.js + Express
- Database: SQLite + Prisma
- Authentication: Email OTP + JWT
- Scheduled jobs: node-cron
- Optional email delivery: Nodemailer SMTP

## Run locally

### 1. Server

```bash
cd server
npm install
```

Create `server/.env` from `.env.example`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="replace-with-a-long-random-secret"
PORT=3000
CLIENT_URL="http://localhost:5173"
```

Optional SMTP variables can be added for real email delivery. If SMTP is not configured, OTPs and reminder messages are printed to the server console; this is explicitly allowed for development by the task.

Then:

```bash
npx prisma migrate dev
npx prisma generate
npm run seed
npm run dev
```

### 2. Client

In another terminal:

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`.

## Demo accounts

All users use OTP login; there are no passwords.

- Admin: `admin@lnmiit.ac.in`
- Student: `naavya@lnmiit.ac.in`
- Student: `rahul@lnmiit.ac.in`

For development, the OTP appears in the server terminal.

## Main API

Authentication:
- `POST /api/auth/send-otp`
- `POST /api/auth/verify-otp`

Resources:
- `GET /api/resources?search=&category=&page=&limit=`
- `GET /api/resources/:id`
- `POST /api/resources` (admin)
- `PATCH /api/resources/:id` (admin)
- `DELETE /api/resources/:id` (admin, soft delete)

Bookings:
- `POST /api/bookings`
- `GET /api/bookings/me?status=&page=&limit=`
- `GET /api/bookings/resource/:id?date=YYYY-MM-DD`
- `PATCH /api/bookings/:id/cancel`
- `GET /api/admin/bookings?resourceId=&status=&date=&page=&limit=` (admin)

## Booking rules

- Confirmed bookings cannot overlap.
- Back-to-back bookings are allowed.
- Start must be in the future.
- End must be after start.
- Duration must be 30 minutes to 4 hours.
- Slot must be inside the resource's opening hours.
- Students can hold at most two upcoming confirmed bookings for one resource.
- Cancellation is owner-only for students and can happen only before the booking starts. Admins can cancel any booking.

## Scheduled job

Every minute the server:
- sends a reminder about one hour before a confirmed booking starts;
- marks past confirmed bookings as `COMPLETED`;
- persists `reminderSent` so a reminder is not sent twice.
