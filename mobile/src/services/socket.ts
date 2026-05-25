import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from './api';

export const connectSocket = (token: string): Socket => {
  return io(SOCKET_URL, {
    autoConnect: true,
    transports: ['websocket'],
    auth: { token },
  });
};
