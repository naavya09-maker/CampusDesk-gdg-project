const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendEmail } = require("../mailer");

const prisma = new PrismaClient();

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const validEmail = (email) =>
  /^[^\s@]+@lnmiit\.ac\.in$/i.test(email);

const sendOtp = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = normalizeEmail(req.body.email);

    if (!name || !email) {
      return res.status(400).json({
        message: "Name and email are required",
        errors: {
          name: !name ? "Name is required" : undefined,
          email: !email ? "Email is required" : undefined,
        },
      });
    }

    if (!validEmail(email)) {
  return res.status(400).json({
    message: "Only LNMIIT college email addresses are allowed",
    errors: {
      email: "Please use your @lnmiit.ac.in email address",
    },
  });
}

    /*// At most 3 OTP requests in the last 10 minutes.
    const since = new Date(Date.now() - 10 * 60 * 1000);
    const recentRequests = await prisma.otp.count({
      where: {
        email,
        createdAt: { gte: since },
      },
    });

    if (recentRequests >= 3) {
      return res.status(429).json({
        message: "Too many OTP requests. Please wait before trying again.",
      });
    }*/

    const otp = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Make previous unexpired codes unusable for this email.
    await prisma.otp.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    await prisma.otp.create({
      data: { email, otp, expiresAt },
    });

    await sendEmail({
  to: email,
  subject: "CampusDesk Login OTP",
  text: `Your CampusDesk verification code is ${otp}. It is valid for 5 minutes.`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
      <h2>CampusDesk</h2>
      <p>Your verification code is:</p>
      <h1 style="letter-spacing: 6px;">${otp}</h1>
      <p>This code is valid for 5 minutes.</p>
      <p>If you did not request this code, you can ignore this email.</p>
    </div>
  `,
});

return res.json({
  message: "OTP sent successfully",
});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();

    if (!name || !email || !otp) {
      return res.status(400).json({
        message: "Name, email and OTP are required",
        errors: {
          name: !name ? "Name is required" : undefined,
          email: !email ? "Email is required" : undefined,
          otp: !otp ? "OTP is required" : undefined,
        },
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        message: "OTP must contain exactly 6 digits",
        errors: { otp: "Enter the 6-digit OTP" },
      });
    }

    const record = await prisma.otp.findFirst({
      where: { email, otp, used: false },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return res.status(400).json({
        message: "Invalid or already-used OTP",
        errors: { otp: "Invalid or already-used OTP" },
      });
    }

    if (record.expiresAt <= new Date()) {
      return res.status(400).json({
        message: "OTP has expired",
        errors: { otp: "OTP has expired. Request a new one." },
      });
    }

    await prisma.otp.update({
      where: { id: record.id },
      data: { used: true },
    });

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: { name, email, role: "STUDENT" },
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.json({
      message: "OTP verified successfully",
      token,
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

module.exports = { sendOtp, verifyOtp };
