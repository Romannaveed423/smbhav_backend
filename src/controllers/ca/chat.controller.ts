import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { CAChat } from '../../models/CAChat';
import { CAChatMessage } from '../../models/CAChatMessage';
import { User } from '../../models/User';
import { createError } from '../../utils/errors';
import mongoose from 'mongoose';

/**
 * Start chat with CA expert
 */
export const startChat = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { applicationId, serviceType, message } = req.body;

    // Find an available CA expert (for simplicity, pick any available expert)
    if (!userId) {
      throw createError('Unauthorized', 403, 'FORBIDDEN');
    }
    // 🔐 Assign only VERIFIED CA EXPERT
    const expert = await User.findOne({
      role: 'ca_expert',
      isVerified: true,
      isActive: true,
    }).sort({ lastActiveAt: -1 });

    if (!expert) {
      throw createError('No CA expert available', 503, 'SERVICE_UNAVAILABLE');
    }

    // const expertId = expert?._id || (await User.findOne().limit(1))?._id;

    // Check if active chat already exists
    let chat = await CAChat.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      applicationId: applicationId|| null,
      status: 'active',
    });

    if (!chat) {
      chat = await CAChat.create({
        userId,
        expertId: expert._id,
        applicationId: applicationId || null,
        serviceType,
        status: 'active',
        startedAt: new Date(),
        lastMessageAt: new Date(),
      });
    }

    // Send initial message if provided
    if (message) {
      await CAChatMessage.create({
        chatId: chat._id,
        senderId: new mongoose.Types.ObjectId(userId),
        senderType: 'user',
        message,
        isRead: false,
      });

      chat.lastMessageAt = new Date();
      await chat.save();
    }

    const expertData = await User.findById(expert._id).select('name email profileImage').lean();

    res.status(201).json({
      success: true,
      data: {
        chatId: chat.chatId,
        expertId: expert._id?.toString(),
        expertName: expertData?.name || 'CA Expert',
        expertImage: expertData?.profileImage || null,
        isOnline: true, // In production, check actual online status
        startedAt: chat.startedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send chat message
 */
export const sendMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { chatId } = req.params;
    const userId = req.user?.id;
    const { message } = req.body;

    const files = req.files as Express.Multer.File[] | undefined;

    if (!message && (!files || files.length === 0)) {
      throw createError('Message or attachments required', 400, 'VALIDATION_ERROR');
    }

    const chat = await CAChat.findOne({
      chatId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!chat || chat.status !== 'active') {
      throw createError('Chat is closed or inactive', 404, 'CHAT_CLOSED');
    }

    const attachments = files
      ? files.map((file) => ({
          url: file.path,
          publicId: file.filename,
          originalName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
        }))
      : [];
      

    const chatMessage = await CAChatMessage.create({
      chatId: chat._id,
      senderId: new mongoose.Types.ObjectId(userId),
      senderType: 'user',
      message: message || '',
      attachments,
      isRead: false,
    });

    chat.lastMessageAt = new Date();
    await chat.save();

    res.status(201).json({
      success: true,
      data: {
        messageId: chatMessage.messageId,
        chatId: chat.chatId,
        message: chatMessage.message,
        senderId: chatMessage.senderId.toString(),
        senderType: chatMessage.senderType,
        timestamp: chatMessage.timestamp,
        isRead: chatMessage.isRead,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get chat messages
 */
export const getMessages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { chatId } = req.params;
    const userId = req.user?.id;
    const { page = 1, limit = 50, before } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const chat = await CAChat.findOne({
      chatId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!chat) {
      throw createError('Chat not found', 404, 'NOT_FOUND');
    }

    const query: any = {
      chatId: chat._id,
    };

    if (before) {
      query.timestamp = { $lt: new Date(before as string) };
    }

    const [messages, total] = await Promise.all([
      CAChatMessage.find(query)
        .populate('senderId', 'name profileImage')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      CAChatMessage.countDocuments(query),
    ]);

    // Mark messages as read
    await CAChatMessage.updateMany(
      {
        chatId: chat._id,
        senderType: 'expert',
        isRead: false,
      },
      { isRead: true }
    );

    res.json({
      success: true,
      data: {
        messages: messages
          .reverse()
          .map((msg) => ({
            id: msg._id.toString(),
            message: msg.message,
            senderId: (msg.senderId as any)?._id?.toString() || msg.senderId?.toString(),
            senderType: msg.senderType,
            senderName: (msg.senderId as any)?.name || (msg.senderType === 'user' ? 'You' : 'CA Expert'),
            isUser: msg.senderType === 'user',
            timestamp: msg.timestamp,
            isRead: msg.isRead,
            attachments: msg.attachments || [],
          })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          hasMore: skip + messages.length < total,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get active chats
 */
export const getActiveChats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    const chats = await CAChat.find({
      userId: new mongoose.Types.ObjectId(userId),
      status: 'active',
    })
      .populate('expertId', 'name profileImage')
      .sort({ lastMessageAt: -1 })
      .lean();

    const chatsWithMessages = await Promise.all(
      chats.map(async (chat) => {
        const lastMessage = await CAChatMessage.findOne({
          chatId: chat._id,
        })
          .sort({ timestamp: -1 })
          .lean();

        const unreadCount = await CAChatMessage.countDocuments({
          chatId: chat._id,
          senderType: 'expert',
          isRead: false,
        });

        return {
          chatId: chat.chatId,
          expertId: (chat.expertId as any)?._id?.toString() || chat.expertId?.toString(),
          expertName: (chat.expertId as any)?.name || 'CA Expert',
          expertImage: (chat.expertId as any)?.profileImage || null,
          lastMessage: lastMessage?.message || '',
          lastMessageTime: lastMessage?.timestamp || chat.lastMessageAt,
          unreadCount,
          isOnline: true, // In production, check actual status
          applicationId: chat.applicationId?.toString() || null,
        };
      })
    );

    res.json({
      success: true,
      data: {
        chats: chatsWithMessages,
      },
    });
  } catch (error) {
    next(error);
  }
};


/** * Close chat
 */
export const closeChat = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { chatId } = req.params;
    const userId = req.user?.id;
    const chat = await CAChat.findOne({
      chatId,
      userId: new mongoose.Types.ObjectId(userId),
    });
    if (!chat) {
      throw createError('Chat not found', 404, 'NOT_FOUND');
    }
    chat.status = 'closed';
    chat.closedAt = new Date();
    await chat.save();
    res.json({
      success: true,
      message: 'Chat closed successfully',
    });
  } catch (error) {
    next(error);
  }
};


// list of chats  api for admin panel

/** * Get chats for admin panel
 */
export const getAdminChats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};
    if (status) query.status = status;

    const chats = await CAChat.find(query)
      .populate('userId', 'name email')
      .populate('expertId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await CAChat.countDocuments();

    res.json({
      success: true,
      data: {
        chats,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          hasMore: skip + chats.length < total,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/** * Get chat messages for admin panel
 */
export const getAdminChatMessages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const chat = await CAChat.findOne({chatId});
    if (!chat) {
      throw createError('Chat not found', 404, 'NOT_FOUND');
    }
    const total = await CAChatMessage.countDocuments({ chatId: chat._id });
    const messages = await CAChatMessage.find({ chatId: chat._id })
      .populate('senderId', 'name profileImage')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    res.json({
      success: true,
      data: {
        messages: messages
          .reverse()
          .map((msg) => ({
            id: msg._id.toString(),
            message: msg.message,
            senderId: (msg.senderId as any)?._id?.toString() || msg.senderId?.toString(),
            senderType: msg.senderType,
            senderName: (msg.senderId as any)?.name || (msg.senderType === 'user' ? 'User' : 'expert'),
            isUser: msg.senderType === 'user',
            timestamp: msg.timestamp, 
            isRead: msg.isRead,
            attachments: msg.attachments || [],
          })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          hasMore: skip + messages.length < total,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};


/** * Admin send message in chat
 */
export const adminSendMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { chatId } = req.params;
    const { message, attachments } = req.body;  
    const adminId = req.user?.id;

    if (!message && (!attachments || attachments.length === 0)) {
      throw createError('Message or attachments required', 400, 'VALIDATION_ERROR');
    }
    const chat = await CAChat.findOne({ chatId });
    if (!chat || chat.status !== 'active') {
      throw createError('Chat not found', 404, 'NOT_FOUND');
    }

    const chatMessage = await CAChatMessage.create({
      chatId: chat._id,
      senderId: adminId ? new mongoose.Types.ObjectId(adminId) : undefined,
      senderType: adminId ? 'admin' : 'expert',
      message: message || '',
      attachments: attachments || [],
      isRead: false,
    });

    chat.lastMessageAt = new Date();
    await chat.save();

    res.status(201).json({
      success: true,
      data: {
        messageId: chatMessage.messageId,
        chatId: chat.chatId,
        message: chatMessage.message,
        senderId: chatMessage.senderId.toString(),
        senderType: chatMessage.senderType,
        timestamp: chatMessage.timestamp,
        isRead: chatMessage.isRead,
      },
    });
  } catch (error) {
    next(error);
  }
};

/** * Admin Assign expert to chat
 */
export const adminAssignExpert = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { chatId } = req.params;
    const { expertId } = req.body;

    const chat = await CAChat.findOne({ chatId });
    if (!chat) {
      throw createError('Chat not found', 404, 'NOT_FOUND');
    }

    const expert = await User.findOne({
      _id: new mongoose.Types.ObjectId(expertId),
      role: 'expert',
      isVerified: true,
      isActive: true,
    });
    if (!expert) {
      throw createError('Expert not found or inactive', 404, 'NOT_FOUND');
    } 
    chat.expertId = expert._id;
    await chat.save();
    res.json({
      success: true,
      message: 'Expert assigned successfully',
    });
  } catch (error) {
    next(error);
  } 
};

/** * Admin close chat
 */
export const adminCloseChat = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { chatId } = req.params;
    const { status = 'closed', note } = req.body;

    const chat = await CAChat.findOne({ chatId });
    if (!chat) {
      throw createError('Chat not found', 404, 'NOT_FOUND');
    }

    chat.status = status;
    chat.closedAt = new Date();
    await chat.save();

    // Optional system message
    await CAChatMessage.create({
      chatId: chat._id,
      senderType: 'admin',
      message: note || 'Chat closed by admin',
      isRead: true,
    });

    res.json({
      success: true,
      message: 'Chat closed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// expert chat controller functions can be added similarly

/**
 * CA Expert: Get chat messages
 */
export const expertGetMessages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const expertId = req.user?.id;
    const { chatId } = req.params;

    const chat = await CAChat.findOne({
      chatId,
      expertId: new mongoose.Types.ObjectId(expertId),
    });

    if (!chat) {
      throw createError('Chat not found', 404, 'NOT_FOUND');
    }

    const messages = await CAChatMessage.find({ chatId: chat._id })
      .populate('senderId', 'name profileImage')
      .sort({ timestamp: 1 })
      .lean();

    // Mark user messages as read
    await CAChatMessage.updateMany(
      {
        chatId: chat._id,
        senderType: 'user',
        isRead: false,
      },
      { isRead: true }
    );

    res.json({
      success: true,
      data: {
        chatId: chat.chatId,
        messages: messages.map((msg) => ({
          id: msg._id.toString(),
          message: msg.message,
          senderType: msg.senderType,
          senderName: (msg.senderId as any)?.name || 'User',
          timestamp: msg.timestamp,
          attachments: msg.attachments || [],
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CA Expert: Send chat message
 */
export const expertSendMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const expertId = req.user?.id;
    const { chatId } = req.params;
    const { message, attachments } = req.body;

    if (!message && (!attachments || attachments.length === 0)) {
      throw createError('Message or attachments required', 400, 'VALIDATION_ERROR');
    }

    const chat = await CAChat.findOne({
      chatId,
      expertId: new mongoose.Types.ObjectId(expertId),
    });

    if (!chat) {
      throw createError('Chat not found', 404, 'NOT_FOUND');
    }

    const chatMessage = await CAChatMessage.create({
      chatId: chat._id,
      senderId: new mongoose.Types.ObjectId(expertId),
      senderType: 'expert',
      message: message || '',
      attachments: attachments || [],
      isRead: false,
    });

    chat.lastMessageAt = new Date();
    await chat.save();

    res.status(201).json({
      success: true,
      data: {
        messageId: chatMessage.messageId,
        chatId: chat.chatId,
        message: chatMessage.message,
        senderType: chatMessage.senderType,
        timestamp: chatMessage.timestamp,
        isRead: chatMessage.isRead,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CA Expert: Get assigned chats
 */
export const expertGetChats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const expertId = req.user?.id;
    const { status = 'active', page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {
      expertId: new mongoose.Types.ObjectId(expertId),
    };
    if (status) query.status = status;

    const [chats, total] = await Promise.all([
      CAChat.find(query)
        .populate('userId', 'name email profileImage')
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      CAChat.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        chats: chats.map((chat) => ({
          chatId: chat.chatId,
          user: chat.userId,
          applicationId: chat.applicationId,
          status: chat.status,
          lastMessageAt: chat.lastMessageAt,
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};


/** * CA Expert: Close chat
 */
export const expertCloseChat = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const expertId = req.user?.id;
    const { chatId } = req.params;
    const { note } = req.body;

    const chat = await CAChat.findOne({
      chatId,
      expertId: new mongoose.Types.ObjectId(expertId),
    });

    if (!chat) {
      throw createError('Chat not found', 404, 'NOT_FOUND');
    }

    chat.status = 'closed';
    chat.closedAt = new Date();
    await chat.save();

    await CAChatMessage.create({
      chatId: chat._id,
      senderType: 'expert',
      message: note || 'Chat closed by expert',
      isRead: true,
    });

    res.json({
      success: true,
      message: 'Chat closed successfully',
    });
  } catch (error) {
    next(error);
  }
};