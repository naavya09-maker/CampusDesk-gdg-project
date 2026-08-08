const cron = require("node-cron");
const { PrismaClient } = require("@prisma/client");
const { sendEmail } = require("./mailer");

const prisma = new PrismaClient();

const formatDateTime = (date) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);

const startReminderJob = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
      const windowEnd = new Date(inOneHour.getTime() + 60 * 1000);

      const dueBookings = await prisma.booking.findMany({
        where: {
          status: "CONFIRMED",
          reminderSent: false,
          startTime: {
            gte: inOneHour,
            lt: windowEnd,
          },
        },
        include: {
          user: true,
          resource: true,
        },
      });

      for (const booking of dueBookings) {
        await sendEmail({
          to: booking.user.email,
          subject: `CampusDesk reminder: ${booking.resource.name}`,
          text:
            `Your booking for ${booking.resource.name} starts in about one hour.\n\n` +
            `When: ${formatDateTime(booking.startTime)}\n` +
            `Purpose: ${booking.purpose}`,
        });

        await prisma.booking.update({
          where: { id: booking.id },
          data: { reminderSent: true },
        });
      }

      await prisma.booking.updateMany({
        where: {
          status: "CONFIRMED",
          endTime: { lt: now },
        },
        data: { status: "COMPLETED" },
      });
    } catch (error) {
      console.error("[Reminder job]", error);
    }
  });

  console.log("CampusDesk reminder/completion cron started.");
};

module.exports = { startReminderJob };
