import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../utils/errors';
import { Notification } from '../models/Notification';

export const getNotifications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId: req.user?.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Notification.countDocuments({ userId: req.user?.id }),
      Notification.countDocuments({ userId: req.user?.id, isRead: false }),
    ]);

    res.json({
      success: true,
      data: {
        notifications: notifications.map(notif => ({
          id: notif._id.toString(),
          title: notif.title,
          message: notif.message,
          type: notif.type,
          isRead: notif.isRead,
          createdAt: notif.createdAt,
          link: notif.link || null,
        })),
        unreadCount,
        total,
        page: pageNum,
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      _id: notificationId,
      userId: req.user?.id,
    });

    if (!notification) {
      throw createError('Notification not found', 404, 'NOT_FOUND');
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: {
        id: notification._id.toString(),
        isRead: notification.isRead,
      },
    });
  } catch (error) {
    next(error);
  }
};

