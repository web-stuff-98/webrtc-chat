import { ReactNode, useEffect } from "react";
import { createContext, useContext, useState } from "react";

import { io, Socket } from "socket.io-client";

import {
  ServerToClientEvents,
  ClientToServerEvents,
} from "../../../server/src/socket-interface";
import useAuth from "./AuthContext";

const SocketContext = createContext<{
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | undefined;
  connectSocket: (token: string) => void;
} | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] =
    useState<Socket<ServerToClientEvents, ClientToServerEvents>>();
  const { user } = useAuth();

  const connectSocket = (token: string) => {
    const connection = io("http://localhost:5000", {
        query: { token },
      }).connect();
      setSocket(connection);
    return () => {
      connection.disconnect()
    }
  };

  useEffect(() => { if(user) connectSocket(user.token)}, [user])

  return (
    <SocketContext.Provider value={{ socket, connectSocket }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("Use socket from inside socket provider");
  return context;
};
