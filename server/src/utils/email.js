import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendWarningEmail = async (memberEmail, memberName) => {
  if (!process.env.SMTP_USER) {
    console.log(`[Email Skipped] Would send warning to ${memberEmail}`);
    return;
  }

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: memberEmail,
    subject: "PCIC - Membership Status Warning",
    html: `
      <h2>Membership Status Warning</h2>
      <p>Dear ${memberName},</p>
      <p>Your membership status in the Peak Craft Informatics Community has been changed to <strong>Warning</strong>.</p>
      <p>Please contact the Project Manager or Membership Coordinator to discuss your participation.</p>
      <p>Regards,<br/>PCIC Management System</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendNewMemberNotification = async (pmEmail, candidateName) => {
  if (!process.env.SMTP_USER) {
    console.log(`[Email Skipped] Would notify PM about ${candidateName}`);
    return;
  }

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: pmEmail,
    subject: "PCIC - New Member Approved",
    html: `
      <h2>New Member Approved</h2>
      <p>A new candidate <strong>${candidateName}</strong> has been approved by the President.</p>
      <p>Please follow up on onboarding.</p>
      <p>Regards,<br/>PCIC Management System</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendPromotionRequestEmail = async (presidentEmail, memberName, currentBatch, requestedBatch, link) => {
  if (!process.env.SMTP_USER) {
    console.log(
      `[Email Skipped] Would notify president at ${presidentEmail} about promotion request for ${memberName} from ${currentBatch} to ${requestedBatch} (${link})`
    );
    return;
  }

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: presidentEmail,
    subject: "PCIC - Membership Promotion Request",
    html: `
      <h2>Membership Promotion Request</h2>
      <p>Member <strong>${memberName}</strong> has requested promotion from <strong>${currentBatch}</strong> to <strong>${requestedBatch}</strong>.</p>
      <p>You can review the portfolio and make a decision from the members page:</p>
      <p><a href="${link}" target="_blank" rel="noopener noreferrer">Open member review</a></p>
      <p>Regards,<br/>PCIC Management System</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
