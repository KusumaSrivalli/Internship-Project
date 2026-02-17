import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useBoardStore from '../store/boardStore';
import useAuthStore from '../store/authStore';

let socket = null;

export const getSocket = () => socket;

export const useSocket = () => {
  const token = useAuthStore((s) => s.token);
  const { onTaskCreated, onTaskUpdated, onTaskDeleted, onTaskMoved, onListCreated, onListUpdated, onListDeleted, onMemberAdded } = useBoardStore();

  useEffect(() => {
    if (!token) return;

    socket = io('/', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => console.log('🔌 Socket connected'));
    socket.on('disconnect', () => console.log('🔌 Socket disconnected'));
    socket.on('connect_error', (err) => console.error('Socket error:', err.message));

    socket.on('task:created', ({ task }) => onTaskCreated(task));
    socket.on('task:updated', ({ task }) => onTaskUpdated(task));
    socket.on('task:deleted', (data) => onTaskDeleted(data));
    socket.on('task:moved', (data) => onTaskMoved(data));
    socket.on('list:created', ({ list }) => onListCreated(list));
    socket.on('list:updated', ({ list }) => onListUpdated(list));
    socket.on('list:deleted', (data) => onListDeleted(data));
    socket.on('board:member_added', ({ user }) => onMemberAdded(user));

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [token]);

  return socket;
};

export const joinBoard = (boardId) => socket?.emit('board:join', boardId);
export const leaveBoard = (boardId) => socket?.emit('board:leave', boardId);