\# CampusDesk — Design Document



\## 1. Overview



CampusDesk is a full-stack campus resource booking application designed for students, clubs, and administrators.



The application allows users to discover campus resources, view availability, create bookings, manage their bookings, and cancel eligible bookings. Administrators can manage resources and view bookings.



The main design goal is to prevent conflicting bookings for the same resource while keeping the booking workflow simple and understandable.



\---



\## 2. Technology Stack



\### Frontend

\- React

\- Vite

\- Axios

\- CSS



\### Backend

\- Node.js

\- Express.js

\- Prisma ORM



\### Database

\- SQLite



\### Authentication

\- Email + OTP authentication

\- JWT-based session authentication

\- Role-based access control



\### Scheduled Tasks

\- node-cron



\### API Testing

\- Postman



\---



\## 3. Application Architecture



The application follows a client-server architecture.



```text

React Frontend

&#x20;     |

&#x20;     | HTTP / JSON

&#x20;     v

Express REST API

&#x20;     |

&#x20;     v

Prisma ORM

&#x20;     |

&#x20;     v

SQLite Database

