import User from '../models/User';

export const generateReferralCode = async (): Promise<string> => {
  let code: string = '';
  let exists = true;

  while (exists) {
    // Generate code like "ZOZO123456"
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    code = `ZOZO${randomNum}`;
    
    const user = await User.findOne({ referralCode: code });
    exists = !!user;
  }

  return code;
};

