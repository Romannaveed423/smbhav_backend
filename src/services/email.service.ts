import sgMail from '@sendgrid/mail';
import { config } from '../config/env';
import logger from '../utils/logger';

if (config.sendGridApiKey) {
  sgMail.setApiKey(config.sendGridApiKey);
}

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> => {
  if (!config.sendGridApiKey) {
    logger.warn('SendGrid not configured');
    if (config.nodeEnv === 'development') {
      logger.info(`Email to ${to}: ${subject}\n${text || html}`);
      return true;
    }
    return false;
  }

  try {
    await sgMail.send({
      to,
      from: config.fromEmail,
      subject,
      text,
      html,
    });
    logger.info(`Email sent to ${to}`);
    return true;
  } catch (error) {
    logger.error('Error sending email:', error);
    return false;
  }
};

export const sendOTPEmail = async (email: string, otp: string): Promise<boolean> => {
  const subject = 'Your ZoZo OTP';
  const html = `
    <h2>Your ZoZo OTP</h2>
    <p>Your OTP code is: <strong>${otp}</strong></p>
    <p>This OTP is valid for ${config.otpExpiryMinutes} minutes.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;
  return sendEmail(email, subject, html, `Your ZoZo OTP is: ${otp}`);
};

export const sendTransactionNotification = async (
  email: string,
  amount: number,
  type: string,
  description: string
): Promise<boolean> => {
  const subject = 'Transaction Update - ZoZo';
  const html = `
    <h2>Transaction Update</h2>
    <p><strong>Type:</strong> ${type}</p>
    <p><strong>Amount:</strong> ₹${amount}</p>
    <p><strong>Description:</strong> ${description}</p>
  `;
  return sendEmail(email, subject, html);
};

