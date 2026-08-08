# CampusDesk

CampusDesk is a full-stack campus resource booking application designed for managing shared college resources such as rooms, labs, sports facilities, and equipment.

## Submission

| Deliverable | Link |
|---|---|
| GitHub Repository | [CampusDesk-gdg-project](https://github.com/naavya09-maker/CampusDesk-gdg-project) |
| Live Frontend | [CampusDesk](https://campusdesk-4tgu.onrender.com) |
| Live Backend API | [CampusDesk API](https://campusdesk-api-ih0s.onrender.com) |
| Demo Video | Add video link here |

## Features

### Authentication
- Email-based OTP authentication
- JWT-based session authentication
- Role-based access control for students and administrators
- LNMIIT email-based user identification

### Resource Management
- Browse available campus resources
- Search resources by name
- Filter resources by category
- View resource details and availability
- Admin resource creation, editing, and soft deletion

### Booking System
- Create bookings for available resources
- Prevent overlapping bookings
- Allow back-to-back bookings
- Enforce booking duration limits
- Enforce resource opening hours
- Limit students to two upcoming confirmed bookings per resource
- Cancel bookings according to ownership and timing rules
- Admins can manage and cancel bookings

### Booking Status
Bookings can have the following states:

- CONFIRMED
- CANCELLED
- COMPLETED

Past confirmed bookings are automatically marked as completed.

### Scheduled Tasks
A `node-cron` job runs periodically to:

- Send booking reminders approximately one hour before the booking
- Mark past confirmed bookings as completed
- Prevent duplicate reminders using the `reminderSent` field

## Technology Stack

### Frontend
- React
- Vite
- Axios
- CSS

### Backend
- Node.js
- Express.js
- JWT
- Nodemailer
- node-cron

### Database
- SQLite
- Prisma ORM

## Project Structure

```text
CampusDesk/
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   └── package.json
│
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── cron.js
│   ├── mailer.js
│   ├── index.js
│   └── package.json
│
├── postman/
├── DESIGN.md
├── QUICK_START.md
└── README.md
