import express from "express";
import http from "http";
import cors from "cors";
import { RemoteSocket, Server } from "socket.io";
import dotenv from "dotenv";
import path from "path";
import crypto from "crypto";
dotenv.config();

import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "./socket-interface";

const origin =
  process.env.NODE_ENV === "production"
    ? "https://webrtc-chat-js.herokuapp.com/"
    : "*";

const app = express();
app.use(cors({ origin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "..", "frontend", "build")));

const server = http.createServer(app);

export const getIpFromRequest = (req: any) => req.ip;

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server, {
  cors: {
    origin,
  },
});

import users from "./api/users.route";
import rooms from "./api/rooms.route";

import RoomsDAO from "./api/dao/rooms.dao";
import decodeToken from "./utils/decodeToken";
import UsersDAO from "./api/dao/users.dao";

app.use("/api/users", users);
app.use("/api/rooms", rooms);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "build", "index.html"));
});

const socketAuthMiddleware = async (socket: any, next: any) => {
  try {
    if (!socket.handshake.auth) throw new Error("No credentials provided");
    const token = socket.handshake.auth.token;
    if (!token) throw new Error("Connection unauthenticated");
    const decodedToken = await decodeToken(token);
    const user = await UsersDAO.findById(decodedToken);
    socket.data.user = user;
    socket.data.auth = decodedToken;
    next();
  } catch (e) {
    socket.emit("resMsg", { msg: `${e}`, err: true, pen: false });
  }
};

io.use(socketAuthMiddleware);

const usersJustDeletedByCleanup: string[] = [];
const roomsJustDeletedByCleanup: string[] = [];

io.on("connection", (socket) => {
  let currentRoom = "";
  let lastMsg = 0;

  const checkDeletedInterval = setInterval(async () => {
    if (usersJustDeletedByCleanup.includes(String(socket.data.auth))) {
      socket.emit("account_deleted");
      usersJustDeletedByCleanup.filter(
        (uid: string) => uid !== socket.data.auth
      );
      socket.disconnect();
    }
    if (currentRoom && roomsJustDeletedByCleanup.includes(currentRoom)) {
      const sids = await (await io.in(currentRoom).fetchSockets())
        .map((s: RemoteSocket<ServerToClientEvents, SocketData>) => s.id)
        .filter((id) => id !== socket.id);
      disconnectFromRoom();
      if (sids.length <= 1) {
        await RoomsDAO.deleteById(currentRoom);
      }
    }
  }, 2000);

  socket.on("delete_account", async () => {
    try {
      if (protectedUsers.includes(String(socket.data.user?.name))) {
        throw new Error("You cannot delete the example accounts.");
      }
      const deletedRooms = await UsersDAO.deleteAccount(
        String(socket.data.auth)
      );
      if (deletedRooms)
        for (const roomID of deletedRooms) {
          io.emit("room_deleted", roomID);
        }
      socket.emit("account_deleted");
    } catch (e) {
      socket.emit("resMsg", { msg: `${e}`, err: true, pen: false });
      return;
    }
  });

  socket.on("join_create_room", async ({ roomName }) => {
    let room: any;
    let created = false;

    try {
      room = await RoomsDAO.findByName(roomName);
      if (!room) {
        created = true;
        room = await RoomsDAO.create(
          roomName,
          String(socket.data.auth),
          socket.handshake.address
        );
      }
    } catch (e) {
      socket.emit("resMsg", { msg: `${e}`, err: true, pen: false });
      return;
    }
    if (!created) {
      const sids = await (
        await io.in(room.id).fetchSockets()
      )
        .map((s: RemoteSocket<ServerToClientEvents, SocketData>) => ({
          sid: s.id,
          uid: s.data.auth,
        }))
        .filter((ids) => ids.sid !== socket.id);
      socket.emit("all_users", sids);
      io.to(room.id).emit(
        "server_msg_to_room",
        `${socket.data.user?.name} has joined the room`
      );
    } else {
      io.emit("room_created", room);
    }
    socket?.emit("navigate_join_room", room.id);
    currentRoom = room.id;
  });

  socket.on("msg_to_room", ({ msg, attachment }) => {
    if (Date.now() - lastMsg < 1) {
      socket.emit("resMsg", {
        msg: "You are sending messages too fast. Max 1 per second.",
        err: true,
        pen: false,
      });
      return;
    }
    io.to(currentRoom).emit("client_msg_to_room", {
      msg,
      author: String(socket.data.auth),
      createdAt: new Date().toISOString(),
      id: crypto.randomBytes(16).toString("hex"),
      ...(attachment ? { attachment } : {}),
    });
    lastMsg = Date.now();
  });

  socket.on("join_room", async ({ roomID }) => {
    if (currentRoom === roomID) return;
    socket.join(roomID);
    const sids = await (
      await io.in(roomID).fetchSockets()
    )
      .map((s: RemoteSocket<ServerToClientEvents, SocketData>) => ({
        sid: s.id,
        uid: s.data.auth,
      }))
      .filter((ids) => ids.sid !== socket.id);
    socket.emit("all_users", sids);
    currentRoom = roomID;
  });

  socket.on("sending_signal", (payload: any) => {
    io.to(payload.userToSignal).emit("user_joined", {
      signal: payload.signal,
      callerID: payload.callerID,
      callerUID: String(socket.data.auth),
    });
  });

  socket.on("returning_signal", (payload: any) => {
    io.to(payload.callerID).emit("receiving_returned_signal", {
      signal: payload.signal,
      id: socket.id,
    });
  });

  const disconnectFromRoom = () => {
    if (currentRoom) {
      socket.leave(currentRoom);
      io.to(currentRoom).emit(
        "server_msg_to_room",
        `${socket.data.user?.name} has left the room`
      );
      io.to(currentRoom).emit("left_room", String(socket.data.auth));
    }
    currentRoom = "";
  };

  socket.on("leave_room", disconnectFromRoom);
  socket.on("disconnect", disconnectFromRoom);

  return () => {
    clearInterval(checkDeletedInterval);
  };
});

export { io };

server.listen(process.env.PORT || 80);

const protectedUsers = ["test1", "test2", "test3", "test4"];
const protectedRooms = ["Room A", "Room B", "Room C", "Room D"];

import redisClient from "./utils/redis";
import { IRoom, IUser } from "./interfaces/interfaces";

const cleanup = () => {
  const i = setInterval(async () => {
    const getU = await redisClient?.get("users");
    const getR = await redisClient?.get("rooms");
    let users: IUser[] = [];
    if (getU) users = JSON.parse(getU);
    let rooms: IRoom[] = [];
    if (getR) rooms = JSON.parse(getR);
    for (const u of users) {
      const uCreatedAt = new Date(u.createdAt).getTime();
      const accountAgeSecs = (Date.now() - uCreatedAt) * 0.001;
      if (accountAgeSecs > 1200 && !protectedUsers.includes(u.name)) {
        users = users.filter((usr: IUser) => usr.id !== u.id);
        usersJustDeletedByCleanup.push(u.id);
      }
    }
    for (const r of rooms) {
      const rCreatedAt = new Date(r.createdAt).getTime();
      const roomAgeSecs = (Date.now() - rCreatedAt) * 0.001;
      if (roomAgeSecs > 1200 && !protectedRooms.includes(r.name)) {
        rooms = rooms.filter((room: IRoom) => room.id !== r.id);
        roomsJustDeletedByCleanup.push(r.id);
      }
    }
    await redisClient?.set("rooms", JSON.stringify(rooms));
    await redisClient?.set("users", JSON.stringify(users));
  }, 5000);
  return () => {
    clearInterval(i);
  };
};
cleanup();
