const sendEmail = async ({ to, subject, text }) => {
  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
  const secret = process.env.GOOGLE_SCRIPT_SECRET;

  if (!scriptUrl || !secret) {
    console.error("Google email service environment variables are missing");
    throw new Error("Email service is not configured");
  }

  const response = await fetch(scriptUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      secret,
      to,
      otp: extractOtp(text),
    }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    console.error("Google email service error:", result);
    throw new Error(result.message || "Failed to send email");
  }

  return result;
};

const extractOtp = (text) => {
  const match = String(text || "").match(/\b\d{6}\b/);

  if (!match) {
    throw new Error("OTP could not be extracted from email content");
  }

  return match[0];
};

module.exports = { sendEmail };