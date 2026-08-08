const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const parseDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const minutesFromTime = (value) => {
  const [hour, minute] = String(value).split(":").map(Number);
  return hour * 60 + minute;
};

const dateRange = (date) => {
  const start = new Date(`${date}T00:00:00`);
  const end = new Date(`${date}T23:59:59.999`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return { start, end };
};

const createBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const { resourceId, startTime, endTime, purpose } = req.body;

    const errors = {};
    if (!resourceId) errors.resourceId = "Resource is required";
    if (!startTime) errors.startTime = "Start time is required";
    if (!endTime) errors.endTime = "End time is required";
    if (!String(purpose || "").trim()) errors.purpose = "Purpose is required";

    const start = parseDate(startTime);
    const end = parseDate(endTime);

    if (startTime && !start) errors.startTime = "Invalid start time";
    if (endTime && !end) errors.endTime = "Invalid end time";

    if (Object.keys(errors).length) {
      return res.status(400).json({
        message: "Please fix the highlighted fields",
        errors,
      });
    }

    const resource = await prisma.resource.findUnique({
      where: { id: Number(resourceId) },
    });

    if (!resource || !resource.isActive) {
      return res.status(404).json({ message: "Resource not found" });
    }

    const now = new Date();

    if (start <= now) {
      errors.startTime = "Start time must be in the future";
    }

    if (end <= start) {
      errors.endTime = "End time must be after start time";
    }

    const duration = (end - start) / 60000;
    if (duration < 30 || duration > 240) {
      errors.endTime = "Booking duration must be between 30 minutes and 4 hours";
    }

    const bookingStart = start.getHours() * 60 + start.getMinutes();
    const bookingEnd = end.getHours() * 60 + end.getMinutes();
    const resourceOpen = minutesFromTime(resource.openTime);
    const resourceClose = minutesFromTime(resource.closeTime);

    if (bookingStart < resourceOpen || bookingEnd > resourceClose) {
      errors.startTime = `Resource is open from ${resource.openTime} to ${resource.closeTime}`;
      errors.endTime = `Resource is open from ${resource.openTime} to ${resource.closeTime}`;
    }

    if (Object.keys(errors).length) {
      return res.status(400).json({
        message: "Booking validation failed",
        errors,
      });
    }

    if (req.user.role === "STUDENT") {
      const existingBookings = await prisma.booking.count({
        where: {
          userId,
          resourceId: Number(resourceId),
          status: "CONFIRMED",
          startTime: { gt: now },
        },
      });

      if (existingBookings >= 2) {
        return res.status(400).json({
          message: "You already have 2 upcoming bookings for this resource.",
        });
      }
    }

    // The overlap rule is:
    // existing.start < requested.end AND existing.end > requested.start.
    // This allows back-to-back bookings.
    const conflict = await prisma.booking.findFirst({
      where: {
        resourceId: Number(resourceId),
        status: "CONFIRMED",
        startTime: { lt: end },
        endTime: { gt: start },
      },
      orderBy: { startTime: "asc" },
    });

    if (conflict) {
      return res.status(409).json({
        message: "This resource is already booked for the selected time slot.",
        conflict: {
          id: conflict.id,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
          purpose: conflict.purpose,
          status: conflict.status,
        },
      });
    }

    const booking = await prisma.booking.create({
      data: {
        userId,
        resourceId: Number(resourceId),
        startTime: start,
        endTime: end,
        purpose: String(purpose).trim(),
      },
      include: { resource: true },
    });

    return res.status(201).json(booking);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const { status } = req.query;

    const validStatuses = ["CONFIRMED", "CANCELLED", "COMPLETED"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid booking status" });
    }

    const where = {
      userId: req.user.id,
      ...(status ? { status } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: { resource: true },
        orderBy: { startTime: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    return res.json({ data, page, limit, total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const booking = await prisma.booking.findUnique({ where: { id } });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "CONFIRMED") {
      return res.status(400).json({ message: "Only confirmed bookings can be cancelled" });
    }

    const isAdmin = req.user.role === "ADMIN";
    if (!isAdmin && booking.userId !== req.user.id) {
      return res.status(403).json({ message: "You can only cancel your own booking" });
    }

    if (!isAdmin && new Date() >= booking.startTime) {
      return res.status(400).json({ message: "Booking has already started" });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: { resource: true },
    });

    return res.json(updatedBooking);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const getResourceBookings = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const range = dateRange(date);
    if (!range) {
      return res.status(400).json({ message: "Date must be YYYY-MM-DD" });
    }

    const resource = await prisma.resource.findUnique({ where: { id } });
    if (!resource || !resource.isActive) {
      return res.status(404).json({ message: "Resource not found" });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        resourceId: id,
        status: "CONFIRMED",
        startTime: { lt: range.end },
        endTime: { gt: range.start },
      },
      orderBy: { startTime: "asc" },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        purpose: true,
        status: true,
        userId: true,
      },
    });

    return res.json(bookings);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const getAdminBookings = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const { resourceId, status, date } = req.query;

    const validStatuses = ["CONFIRMED", "CANCELLED", "COMPLETED"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid booking status" });
    }

    const where = {
      ...(resourceId ? { resourceId: Number(resourceId) } : {}),
      ...(status ? { status } : {}),
    };

    if (date) {
      const range = dateRange(date);
      if (!range) {
        return res.status(400).json({ message: "Date must be YYYY-MM-DD" });
      }
      where.startTime = { lt: range.end };
      where.endTime = { gt: range.start };
    }

    const [data, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: { resource: true, user: true },
        orderBy: { startTime: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    return res.json({ data, page, limit, total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  cancelBooking,
  getResourceBookings,
  getAdminBookings,
};
