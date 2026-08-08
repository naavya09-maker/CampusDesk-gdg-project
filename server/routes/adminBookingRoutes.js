const express = require("express");
const { getAdminBookings } = require("../controllers/bookingController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, requireAdmin, getAdminBookings);

module.exports = router;
