import Notification from '../models/Notification';

export const createNotification = async (data: {
  userId: any;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: any;
}): Promise<void> => {
  await Notification.create(data);
};

