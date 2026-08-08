const express = require("express");
const {
  createBooking,
  getMyBookings,
  cancelBooking,
  getResourceBookings,
} = require("../controllers/bookingController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/", requireAuth, createBooking);
router.get("/me", requireAuth, getMyBookings);
router.get("/resource/:id", requireAuth, getResourceBookings);
router.patch("/:id/cancel", requireAuth, cancelBooking);

module.exports = router;
