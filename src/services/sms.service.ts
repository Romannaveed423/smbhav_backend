import twilio from 'twilio';
import { config } from '../config/env';
import logger from '../utils/logger';

let twilioClient: twilio.Twilio | null = null;

if (config.twilioAccountSid && config.twilioAuthToken) {
  twilioClient = twilio(config.twilioAccountSid, config.twilioAuthToken);
}

export const sendOTP = async (phoneNumber: string, otp: string): Promise<boolean> => {
  if (!twilioClient || !config.twilioPhoneNumber) {
    logger.warn('Twilio not configured, OTP would be:', otp);
    // In development, log the OTP instead of sending
    if (config.nodeEnv === 'development') {
      logger.info(`OTP for ${phoneNumber}: ${otp}`);
      return true;
    }
    return false;
  }

  try {
    await twilioClient.messages.create({
      body: `Your ZoZo OTP is: ${otp}. Valid for ${config.otpExpiryMinutes} minutes.`,
      from: config.twilioPhoneNumber,
      to: phoneNumber,
    });
    logger.info(`OTP sent to ${phoneNumber}`);
    return true;
  } catch (error) {
    logger.error('Error sending OTP:', error);
    return false;
  }
};

export const sendSMS = async (phoneNumber: string, message: string): Promise<boolean> => {
  if (!twilioClient || !config.twilioPhoneNumber) {
    logger.warn('Twilio not configured');
    if (config.nodeEnv === 'development') {
      logger.info(`SMS to ${phoneNumber}: ${message}`);
      return true;
    }
    return false;
  }

  try {
    await twilioClient.messages.create({
      body: message,
      from: config.twilioPhoneNumber,
      to: phoneNumber,
    });
    return true;
  } catch (error) {
    logger.error('Error sending SMS:', error);
    return false;
  }
};

