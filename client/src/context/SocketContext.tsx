import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { BASE_URL } from '../lib/api-config';

interface LeaderboardEntry {
  display_name: string;
  weekly_xp: number;
  level: number;
}

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  leaderboard: LeaderboardEntry[];
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  leaderboard: [],
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, sessionId } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (!sessionId || !user) return;

    const socketUrl = BASE_URL.replace('/api', '');

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      // Join class room for targeted broadcasts
      if (user.class_group) {
        socket.emit('join_class', user.class_group);
      }
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('leaderboard:update', (data: LeaderboardEntry[]) => {
      setLeaderboard(data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionId, user]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, leaderboard }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

