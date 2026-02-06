import { config } from '../config/env';

export const generateOTP = (): string => {
  const digits = '0123456789';
  let OTP = '';
  for (let i = 0; i < config.otpLength; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
};

export const getOTPExpiry = (): Date => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + config.otpExpiryMinutes);
  return expiry;
};

export const isOTPExpired = (expiresAt: Date): boolean => {
  return new Date() > expiresAt;
};

