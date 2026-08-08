require("dotenv").config();

const express = require("express");
const cors = require("cors");

const resourceRoutes = require("./routes/resourceRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const authRoutes = require("./routes/authRoutes");
const adminBookingRoutes = require("./routes/adminBookingRoutes");
const { startReminderJob } = require("./cron");

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin/bookings", adminBookingRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "CampusDesk Backend Running",
    version: "1.0",
  });
});

app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  startReminderJob();
});
