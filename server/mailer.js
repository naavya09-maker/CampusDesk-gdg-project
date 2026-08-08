const nodemailer = require("nodemailer");

let transporterPromise = null;

const getTransporter = async () => {
  if (transporterPromise) return transporterPromise;

  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  ) {
    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE || "false") === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    );
  } else {
    transporterPromise = Promise.resolve(null);
  }

  return transporterPromise;
};

const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = await getTransporter();

  if (!transporter) {
    console.log(`\n[CampusDesk email fallback] To: ${to}\nSubject: ${subject}\n${text}\n`);
    return { fallback: true };
  }

  return transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
};

module.exports = { sendEmail };
