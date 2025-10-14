import nodemailer from 'nodemailer';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

const transporter = nodemailer.createTransport({
    host: 'smtp.mailtrap.io',
    port: 2525,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS,
    },
});

const sendEmail = async (options: MailOptions) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully');
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email.');
  }
};

export const sendVerificationEmail = async (userEmail: string, token: string) => {
    const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
    const subject = 'Verify Your OmniverseTV Account';
    const html = `
        <h1>Welcome to OmniverseTV!</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationLink}">Verify My Email</a>
        <p>If you did not sign up for an account, please ignore this email.</p>
    `;

    await sendEmail({ to: userEmail, subject, html });
}

export const sendPasswordResetEmail = async (userEmail: string, token: string) => {
  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  const subject = 'Your Password Reset Request for OmniverseTV';
  const html = `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset. Please click the link below to set a new password:</p>
      <a href="${resetLink}">Reset My Password</a>
      <p>This link will expire in 10 minutes.</p>
      <p>If you did not request a password reset, please ignore this email.</p>
  `;

  await sendEmail({ to: userEmail, subject, html });
}

export const sendEmailChangeConfirmation = async (newUserEmail: string, token: string) => {
  const confirmationLink = `${process.env.CLIENT_URL}/confirm-email-change?token=${token}`;
  const subject = 'Confirm Your Email Change for OmniverseTV';
  const html = `
      <h1>Email Change Confirmation</h1>
      <p>Please click the link below to confirm your email change:</p>
      <a href="${confirmationLink}">Confirm My Email Change</a>
      <p>This link will expire in 15 minutes.</p>
      <p>If you did not request an email change, please ignore this email.</p>
  `;

  await sendEmail({ to: newUserEmail, subject, html });
}
