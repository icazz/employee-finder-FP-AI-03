import nodemailer from "nodemailer";

export function sendGmail(
  toEmail: string,
  subject: string,
  content: string,
  senderName: string = ""
): { simulated: boolean; message: string } {
  const smtpUser = process.env.SMTP_USER || "";
  const smtpPassword = process.env.SMTP_PASSWORD || "";

  if (!smtpUser || !smtpPassword) {
    console.warn("SMTP not configured — returning simulated send");
    return { simulated: true, message: "SMTP not configured" };
  }

  const name = senderName.trim() || "CVDrop-AI";
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: smtpUser, pass: smtpPassword },
  });

  try {
    transporter.sendMail({
      from: `"${name}" <${smtpUser}>`,
      to: toEmail,
      subject,
      text: content,
    });
    console.info("Email sent to %s", toEmail);
    return { simulated: false, message: "Email sent successfully" };
  } catch (exc) {
    console.error("Failed to send email:", exc);
    return { simulated: true, message: String(exc) };
  }
}
