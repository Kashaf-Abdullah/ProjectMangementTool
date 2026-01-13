// utils/email.js (CORRECTED)
const nodemailer = require('nodemailer');  // ✅ MISSING IMPORT ADDED

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Test transporter on startup (optional)
transporter.verify((error, success) => {
  if (error) {
    console.log('Email config error:', error);
  } else {
    console.log('Email server ready');
  }
});

// Send user invitation email
const sendInviteEmail = async (to, firstName, inviteToken, orgName, inviteUrl) => {
  const mailOptions = {
    from: `"Project Management Tool" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Invitation to join ${orgName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to ${orgName}!</h2>
        <p>Hi ${firstName},</p>
        <p>You have been invited to join <strong>${orgName}</strong> as a team member.</p>
        <p><strong>Click the button below to accept your invitation:</strong></p>
        <a href="${inviteUrl}" style="
          background-color: #2563eb; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 6px; 
          display: inline-block;
          font-weight: bold;
        ">Accept Invitation</a>
        <p style="margin-top: 20px; font-size: 14px; color: #666;">
          Or copy this link: ${inviteUrl}
        </p>
        <p>This invitation will expire in 24 hours.</p>
        <hr style="margin: 30px 0;">
        <p style="font-size: 12px; color: #999;">
          © 2025 Project Management Tool. All rights reserved.
        </p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

// Send billing confirmation
const sendBillingConfirmation = async (to, orgName, userPacks) => {
  const mailOptions = {
    from: `"Project Management Tool" <${process.env.EMAIL_USER}>`,
    to,
    subject: `User Limit Upgraded - ${orgName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Payment Successful!</h2>
        <p>Your organization <strong>${orgName}</strong> has been upgraded.</p>
        <p><strong>${userPacks * 5} additional user slots</strong> added successfully!</p>
        <div style="
          background: #f0fdf4; 
          padding: 20px; 
          border-radius: 8px; 
          border-left: 4px solid #10b981;
        ">
          <h3 style="color: #047857; margin-top: 0;">What's Next?</h3>
          <ul style="color: #065f46;">
            <li>You can now invite up to ${userPacks * 5} more users</li>
            <li>Go to <strong>Users → Invite</strong> in your dashboard</li>
            <li>Team members will receive email invitations</li>
          </ul>
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendInviteEmail,
  sendBillingConfirmation
};
