"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: "*" }));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
    },
});
const users_route_1 = __importDefault(require("./api/users.route"));
const rooms_route_1 = __importDefault(require("./api/rooms.route"));
const rooms_dao_1 = __importDefault(require("./api/dao/rooms.dao"));
const decodeToken_1 = __importDefault(require("./utils/decodeToken"));
const users_dao_1 = __importDefault(require("./api/dao/users.dao"));
app.use("/users", users_route_1.default);
app.use("/rooms", rooms_route_1.default);
const socketAuthMiddleware = (socket, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (socket.data.auth) {
            return next();
        }
        if (!socket)
            throw new Error("No socket");
        const { token } = socket.handshake.query;
        if (!token) {
            return;
        }
        const decodedToken = yield (0, decodeToken_1.default)(token);
        const user = yield users_dao_1.default.findById(decodedToken);
        socket.data.user = user;
        socket.data.auth = decodedToken;
        next();
    }
    catch (e) {
        socket.emit("resMsg", { msg: `${e}`, err: true, pen: false });
    }
});
io.use(socketAuthMiddleware);
io.on("connection", (socket) => {
    console.log("Connected, socket auth" + socket.data.auth);
    socket.on("join_create_room", ({ roomName }) => __awaiter(void 0, void 0, void 0, function* () {
        let room;
        let created = false;
        try {
            room = yield rooms_dao_1.default.findByName(roomName);
            if (!room) {
                created = true;
                room = yield rooms_dao_1.default.create(roomName, String(socket.data.auth), socket.id);
            }
        }
        catch (e) {
            socket.emit("resMsg", { msg: `${e}`, err: true, pen: false });
            return;
        }
        if (!created) {
            const sids = yield (yield io.in(room.id).fetchSockets())
                .map((s) => ({
                sid: s.id,
                uid: s.data.auth,
            }))
                .filter((ids) => ids.sid !== socket.id);
            socket.emit("all_users", sids);
        }
        else {
            io.emit("room_created", room);
            console.log("room_created emit " + JSON.stringify(room));
        }
        socket === null || socket === void 0 ? void 0 : socket.emit("navigate_join_room", room.id);
    }));
    socket.on("msg_to_room", ({ msg, roomID }) => {
        socket.to(roomID).emit("client_msg_to_room", {
            msg,
            author: String(socket.data.auth),
            createdAt: new Date().toISOString(),
        });
    });
    socket.on("join_room", ({ roomID }) => __awaiter(void 0, void 0, void 0, function* () {
        socket.join(roomID);
        const sids = yield (yield io.in(roomID).fetchSockets())
            .map((s) => ({
            sid: s.id,
            uid: s.data.auth,
        }))
            .filter((ids) => ids.sid !== socket.id);
        socket.emit("all_users", sids);
    }));
    socket.on("sending_signal", (payload) => {
        io.to(payload.userToSignal).emit("user_joined", {
            signal: payload.signal,
            callerID: payload.callerID,
            callerUID: String(socket.data.auth),
        });
    });
    socket.on("returning_signal", (payload) => {
        io.to(payload.callerID).emit("receiving_returned_signal", {
            signal: payload.signal,
            id: socket.id,
        });
    });
    socket.on("get_user_data", (uid) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        if (uid === socket.data.auth)
            return socket.emit("got_user_data", socket.data.user);
        try {
            const sockets = yield io.fetchSockets();
            const data = (_a = sockets.find((s) => s.data.auth === uid)) === null || _a === void 0 ? void 0 : _a.data.user;
            socket.emit("got_user_data", data);
        }
        catch (e) {
            socket.emit("resMsg", {
                msg: `${e}`,
                err: true,
                pen: false,
            });
        }
    }));
    const disconnected = () => {
        const userRooms = io.sockets.adapter.socketRooms(socket.id);
        if (userRooms)
            for (const room of userRooms) {
                // for some reason the users socket id is included in socketRooms() ......
                // It shouldn't be there but I never put it there? Quickly see if you can
                // find another function that returns all the sockets rooms, without the
                // socket id
                if (room !== socket.id) {
                    if (socket.data.auth)
                        socket.broadcast
                            .to(room)
                            .emit("left_room", String(socket.data.auth));
                    socket.leave(room);
                }
            }
    };
    socket.on("leave_room", disconnected);
    socket.on("disconnect", disconnected);
});
server.listen(5000);
//# sourceMappingURL=index.js.map