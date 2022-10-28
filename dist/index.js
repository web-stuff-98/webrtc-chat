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
exports.getIpFromRequest = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: "*" }));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static(path_1.default.join(__dirname, "..", "frontend", "build")));
const server = http_1.default.createServer(app);
const getIpFromRequest = (req) => req.ip;
exports.getIpFromRequest = getIpFromRequest;
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
const redis_1 = __importDefault(require("./utils/redis"));
app.use("/api/users", users_route_1.default);
app.use("/api/rooms", rooms_route_1.default);
app.get("*", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "..", "frontend", "build", "index.html"));
});
const socketAuthMiddleware = (socket, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!socket.handshake.auth)
            throw new Error("No credentials provided");
        const token = socket.handshake.auth.token;
        if (!token)
            throw new Error("Connection unauthenticated");
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
    let currentRoom = "";
    socket.on("delete_account", () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const deletedRooms = yield users_dao_1.default.deleteAccount(String(socket.data.auth));
            if (deletedRooms)
                for (const roomID of deletedRooms) {
                    io.emit("room_deleted", roomID);
                }
            socket.emit("account_deleted");
        }
        catch (e) {
            socket.emit("resMsg", { msg: `${e}`, err: true, pen: false });
            return;
        }
    }));
    socket.on("join_create_room", ({ roomName }) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
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
            io.to(room.id).emit("server_msg_to_room", `${(_a = socket.data.user) === null || _a === void 0 ? void 0 : _a.name} has joined the room`);
        }
        else {
            io.emit("room_created", room);
        }
        socket === null || socket === void 0 ? void 0 : socket.emit("navigate_join_room", room.id);
        currentRoom = room.id;
    }));
    socket.on("msg_to_room", ({ msg, roomID }) => {
        socket.to(roomID).emit("client_msg_to_room", {
            msg,
            author: String(socket.data.auth),
            createdAt: new Date().toISOString(),
        });
    });
    socket.on("join_room", ({ roomID }) => __awaiter(void 0, void 0, void 0, function* () {
        if (currentRoom === roomID)
            return;
        socket.join(roomID);
        const sids = yield (yield io.in(roomID).fetchSockets())
            .map((s) => ({
            sid: s.id,
            uid: s.data.auth,
        }))
            .filter((ids) => ids.sid !== socket.id);
        socket.emit("all_users", sids);
        currentRoom = roomID;
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
    const disconnected = () => {
        var _a;
        if (currentRoom) {
            socket.leave(currentRoom);
            io.to(currentRoom).emit("server_msg_to_room", `${(_a = socket.data.user) === null || _a === void 0 ? void 0 : _a.name} has left the room`);
            io.to(currentRoom).emit("left_room", String(socket.data.auth));
        }
        currentRoom = "";
    };
    socket.on("leave_room", disconnected);
    socket.on("disconnect", disconnected);
});
server.listen(5000);
const protectedUsers = ["test1", "test2", "test3", "test4"];
const protectedRooms = ["Room A", "Room B", "Room C", "Room D"];
const cleanup = () => {
    const i = setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.connect());
        const getU = yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.get("users"));
        const getR = yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.get("rooms"));
        let users = [];
        if (getU)
            users = JSON.parse(getU);
        let rooms = [];
        if (getR)
            rooms = JSON.parse(getR);
        for (const u of users) {
            const uCreatedAt = new Date(u.createdAt).getTime();
            const accountAgeSecs = (Date.now() - uCreatedAt) * 0.001;
            if (accountAgeSecs > 1200 && !protectedUsers.includes(u.name)) {
                users = users.filter((usr) => usr.id !== u.id);
            }
        }
        for (const r of rooms) {
            const rCreatedAt = new Date(r.createdAt).getTime();
            const roomAgeSecs = (Date.now() - rCreatedAt) * 0.001;
            if (roomAgeSecs > 1200 && !protectedRooms.includes(r.name)) {
                rooms = rooms.filter((room) => room.id !== r.id);
            }
        }
        yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.set("rooms", JSON.stringify(rooms)));
        yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.set("users", JSON.stringify(users)));
        yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.disconnect());
    }), 5000);
    return () => {
        clearInterval(i);
    };
};
cleanup();
//# sourceMappingURL=index.js.map