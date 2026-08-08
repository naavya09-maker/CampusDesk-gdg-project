# CampusDesk

> A full-stack campus resource booking system for LNMIIT.

CampusDesk allows students to discover campus resources, view availability, book time slots, and manage their bookings. Administrators can manage resources and monitor bookings.

The core challenge of the project is preventing overlapping bookings for the same resource while enforcing booking and authorization rules on the backend.

---

## 📌 Submission

| Deliverable | Link |
|---|---|
| GitHub Repository | [CampusDesk-gdg-project](https://github.com/naavya09-maker/CampusDesk-gdg-project) |
| Demo Video | **TODO — add link before submission** |
| Live Deployment | **TODO — add link if deployed** |
| Design Document | [DESIGN.md](./DESIGN.md) |

---

## ✨ Features

### Authentication
- Passwordless email + OTP authentication
- 6-digit OTP
- OTP expiry and single-use validation
- OTP request rate limiting
- JWT authentication
- 24-hour authenticated sessions
- Student and Admin roles
- Protected API routes
- Automatic logout on `401 Unauthorized`

### Resource Management
- Browse campus resources
- Search resources
- Filter by category
- Server-side pagination
- Admin resource creation
- Admin resource updates
- Admin soft deletion

### Booking
- Create bookings for campus resources
- View resource availability
- Prevent overlapping confirmed bookings
- Allow back-to-back bookings
- Validate booking duration
- Validate resource operating hours
- Require future start times
- Maximum of two upcoming confirmed bookings per resource per student
- Cancel eligible bookings
- Admin booking management

### Automated Jobs
- Reminder processing approximately one hour before confirmed bookings
- Prevent duplicate reminders using `reminderSent`
- Automatically mark past confirmed bookings as completed

---

## 🏗️ Architecture

```text
┌─────────────────────┐
│    React Frontend   │
│      Vite + Axios   │
└──────────┬──────────┘
           │
           │ REST API / JSON
           ▼
┌─────────────────────┐
│   Express Backend   │
│ Authentication      │
│ Authorization       │
│ Validation          │
│ Booking Logic       │
└──────────┬──────────┘
           │
           │ Prisma
           ▼
┌─────────────────────┐
│    SQLite Database  │
└─────────────────────┘

        ┌──────────────┐
        │ node-cron     │
        │ Scheduled Job │
        └──────────────┘