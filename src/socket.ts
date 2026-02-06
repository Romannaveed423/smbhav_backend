import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { CAChat } from './models/CAChat';
import { CAChatMessage } from './models/CAChatMessage';

export const initSocket = (httpServer: any) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Unauthorized'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      socket.data.user = {
        id: decoded.id,
        role: decoded.role,
      };

      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Connected: ${socket.data.user.id}`);

    /** Join Chat Room */
    socket.on('join_chat', ({ chatId }) => {
      socket.join(chatId);
    });

    /** Send Message */
    socket.on('send_message', async (payload) => {
      const { chatId, message, attachments } = payload;
      const { id, role } = socket.data.user;

      const chat = await CAChat.findOne({ chatId });
      if (!chat) return;

      const msg = await CAChatMessage.create({
        chatId: chat._id,
        senderId: id,
        senderType: role === 'ca_expert' ? 'expert' : 'user',
        message,
        attachments: attachments || [],
        isRead: false,
      });

      chat.lastMessageAt = new Date();
      await chat.save();

      io.to(chatId).emit('new_message', {
        chatId,
        message: msg.message,
        senderType: msg.senderType,
        timestamp: msg.timestamp,
        attachments: msg.attachments,
      });
    });

    /** Read Receipt */
    socket.on('mark_read', async ({ chatId }) => {
      const chat = await CAChat.findOne({ chatId });
      if (!chat) return;

      await CAChatMessage.updateMany(
        {
          chatId: chat._id,
          isRead: false,
        },
        { isRead: true }
      );

      io.to(chatId).emit('read_receipt', { chatId });
    });

    socket.on('disconnect', () => {
      console.log(`Disconnected: ${socket.data.user.id}`);
    });
  });

  return io;
};
