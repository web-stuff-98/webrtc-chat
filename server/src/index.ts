import express from "express";
import http from "http";
import cors from "cors";
import { RemoteSocket, Server } from "socket.io";
import dotenv from "dotenv";
dotenv.config();

import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "./socket-interface";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server, {
  cors: {
    origin: "*",
  },
});

import users from "./api/users.route";
import rooms from "./api/rooms.route";

import RoomsDAO from "./api/dao/rooms.dao";
import decodeToken from "./utils/decodeToken";
import UsersDAO from "./api/dao/users.dao";

app.use("/users", users);
app.use("/rooms", rooms);

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

io.on("connection", (socket) => {
  let currentRoom = "";

  socket.on("delete_account", async () => {
    try {
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
          socket.id
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
      io.to(room.id).emit("server_msg_to_room", `${socket.data.user?.name} has joined the room`)
    } else {
      io.emit("room_created", room);
    }
    socket?.emit("navigate_join_room", room.id);
    currentRoom = room.id;
  });

  socket.on("msg_to_room", ({ msg, roomID }) => {
    socket.to(roomID).emit("client_msg_to_room", {
      msg,
      author: String(socket.data.auth),
      createdAt: new Date().toISOString(),
    });
  });

  socket.on("join_room", async ({ roomID }) => {
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

  const disconnected = () => {
    if (currentRoom) {
      socket.leave(currentRoom);
      io.to(currentRoom).emit("server_msg_to_room", `${socket.data.user?.name} has left the room`)
      io.to(currentRoom).emit("left_room", String(socket.data.auth));
    }
    currentRoom = "";
  };

  socket.on("leave_room", disconnected);
  socket.on("disconnect", disconnected);
});
server.listen(5000);
