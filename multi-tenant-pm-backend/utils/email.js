const nodemailer = require('nodemailer');

let transporter = null;

if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

const safeSendMail = async (mailOptions) => {
  if (!transporter) {
    console.log('[Email Skipped - SMTP not configured]:', mailOptions.subject, '->', mailOptions.to);
    return { skipped: true };
  }
  try {
    return await transporter.sendMail(mailOptions);
  } catch (err) {
    console.warn('Email send warning:', err.message);
    return { error: err.message };
  }
};

const sendInviteEmail = async (to, firstName, inviteToken, orgName, inviteUrl) => {
  return safeSendMail({
    from: `"Project Management Tool" <${process.env.EMAIL_USER || 'no-reply@pmtool.local'}>`,
    to,
    subject: `Invitation to join ${orgName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to ${orgName}!</h2>
        <p>Hi ${firstName},</p>
        <p>You have been invited to join <strong>${orgName}</strong> as a team member.</p>
        <p><a href="${inviteUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Accept Invitation</a></p>
        <p style="margin-top: 20px; font-size: 14px; color: #666;">Or copy this link: ${inviteUrl}</p>
      </div>
    `,
  });
};

const sendTaskAssignedEmail = async ({ to, assigneeName, taskTitle, projectName, assignedByName, priority, dueDate }) => {
  const dueText = dueDate ? new Date(dueDate).toLocaleDateString() : 'No due date';
  return safeSendMail({
    from: `"Project Management Tool" <${process.env.EMAIL_USER || 'no-reply@pmtool.local'}>`,
    to,
    subject: `New Task Assigned: ${taskTitle} (${projectName})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Task Assigned to You</h2>
        <p>Hi ${assigneeName},</p>
        <p><strong>${assignedByName}</strong> assigned you a task in project <strong>${projectName}</strong>:</p>
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <h3 style="margin: 0 0 8px 0; color: #0f172a;">${taskTitle}</h3>
          <p style="margin: 4px 0; color: #475569;"><strong>Priority:</strong> ${priority}</p>
          <p style="margin: 4px 0; color: #475569;"><strong>Due Date:</strong> ${dueText}</p>
        </div>
      </div>
    `,
  });
};

const sendBillingConfirmation = async (to, orgName, userPacks) => {
  return safeSendMail({
    from: `"Project Management Tool" <${process.env.EMAIL_USER || 'no-reply@pmtool.local'}>`,
    to,
    subject: `User Limit Upgraded - ${orgName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Payment Successful!</h2>
        <p>Your organization <strong>${orgName}</strong> has been upgraded with <strong>${userPacks * 5}</strong> additional user slots.</p>
      </div>
    `,
  });
};

module.exports = {
  sendInviteEmail,
  sendTaskAssignedEmail,
  sendBillingConfirmation
};
