const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('./utils/logger');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }
  });

  // Auth middleware for socket
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} (user: ${socket.userId})`);

    // Join a board room to receive updates
    socket.on('board:join', (boardId) => {
      socket.join(`board:${boardId}`);
      logger.debug(`User ${socket.userId} joined board ${boardId}`);
    });

    socket.on('board:leave', (boardId) => {
      socket.leave(`board:${boardId}`);
    });

    // Presence: broadcast who's viewing this board
    socket.on('user:typing', ({ boardId, taskId }) => {
      socket.to(`board:${boardId}`).emit('user:typing', { userId: socket.userId, taskId });
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const emitToBoard = (boardId, event, data) => {
  if (io) {
    io.to(`board:${boardId}`).emit(event, data);
  }
};

module.exports = { initSocket, emitToBoard };