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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = __importDefault(require("../../utils/redis"));
const crypto_1 = __importDefault(require("crypto"));
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const mime_types_1 = __importDefault(require("mime-types"));
const index_1 = require("../../index");
class RoomsDAO {
    static findByName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const getR = yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.get("rooms"));
            let rooms = [];
            if (getR) {
                rooms = JSON.parse(getR);
                const r = rooms.find((r) => r.name.toLowerCase() === name.trim().toLowerCase());
                if (r) {
                    return r;
                }
            }
            else {
                return false;
            }
        });
    }
    static create(name, author, ip) {
        return __awaiter(this, void 0, void 0, function* () {
            const getR = yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.get("rooms"));
            const IPRateLimit = yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.get(ip));
            let IPRateLimitData = {};
            let rooms = [];
            if (IPRateLimit) {
                IPRateLimitData = JSON.parse(IPRateLimit);
                if (IPRateLimitData.rooms && IPRateLimitData.rooms === 4) {
                    throw new Error("Max 4 rooms");
                }
                IPRateLimitData = Object.assign(Object.assign({}, IPRateLimitData), { rooms: IPRateLimitData.rooms + 1 });
            }
            else {
                IPRateLimitData = { rooms: 1 };
            }
            if (getR) {
                rooms = JSON.parse(getR);
                if (rooms.find((r) => r.name.toLowerCase() === name.trim().toLowerCase())) {
                    throw new Error("There is a room with that name already");
                }
            }
            const room = {
                name,
                author,
                createdAt: new Date().toISOString(),
                id: crypto_1.default.randomBytes(16).toString("hex"),
            };
            rooms.push(Object.assign(Object.assign({}, room), { attachmentKeys: [] }));
            yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.set("rooms", JSON.stringify(rooms)));
            yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.set(ip, JSON.stringify(IPRateLimitData)));
            return room;
        });
    }
    static getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const getR = yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.get("rooms"));
            let rooms = [];
            if (getR) {
                rooms = JSON.parse(getR);
            }
            return rooms.map((r) => ({
                name: r.name,
                author: r.author,
                createdAt: r.createdAt,
                id: r.id,
            }));
        });
    }
    static findById(id, withAttachmentKeys) {
        return __awaiter(this, void 0, void 0, function* () {
            const getR = yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.get("rooms"));
            let rooms = [];
            if (getR) {
                rooms = JSON.parse(getR);
            }
            else {
                throw new Error("There are no rooms");
            }
            const found = rooms.find((room) => room.id === id);
            if (found) {
                return withAttachmentKeys
                    ? found
                    : {
                        name: found.name,
                        author: found.author,
                        createdAt: found.createdAt,
                        id: found.id,
                    };
            }
            throw new Error("Could not find room");
        });
    }
    static deleteById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const getR = yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.get("rooms"));
            let rooms = [];
            if (getR) {
                rooms = JSON.parse(getR);
            }
            else {
                throw new Error("There are no rooms");
            }
            rooms.filter((room) => room.id !== id);
            yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.set("rooms", JSON.stringify(rooms)));
        });
    }
    static uploadAttachment(busboy, roomID, msgID, bytes) {
        return new Promise((resolve, reject) => {
            aws_sdk_1.default.config.update({
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                region: "eu-west-2",
            });
            const s3 = new aws_sdk_1.default.S3();
            let p = 0;
            busboy.on("file", (fieldname, file, filename) => {
                if (!filename.mimeType.includes("video") &&
                    !filename.mimeType.includes("image")) {
                    failed(new Error("Attachment must be an image or video"));
                }
                const ext = String(mime_types_1.default.extension(filename.mimeType));
                const key = `${msgID}.${ext}`;
                s3.upload({
                    Bucket: "webrtc-chat-js",
                    Key: key,
                    Body: file,
                    ContentType: String(mime_types_1.default.contentType(ext)),
                }, (err, file) => {
                    if (err)
                        failed(err);
                    success(filename.mimeType, ext, key);
                }).on("httpUploadProgress", (e) => {
                    p++;
                    // only send every 2nd progress update, because its too many emits otherwise
                    if (p === 2) {
                        p = 0;
                        index_1.io.to(roomID).emit("attachment_progress", {
                            progress: e.loaded / bytes,
                            msgID,
                        });
                    }
                });
            });
            busboy.on("error", failed);
            function failed(e) {
                index_1.io.to(roomID).emit("attachment_failed", msgID);
                reject(e);
            }
            function success(mimeType, ext, key) {
                var _a;
                return __awaiter(this, void 0, void 0, function* () {
                    index_1.io.to(roomID).emit("attachment_success", { msgID, mimeType, ext });
                    const getR = yield redis_1.default.get("rooms");
                    if (getR) {
                        const rooms = JSON.parse(getR);
                        const room = rooms.find((r) => r.id === roomID);
                        if (room === null || room === void 0 ? void 0 : room.attachmentKeys)
                            (_a = room === null || room === void 0 ? void 0 : room.attachmentKeys) === null || _a === void 0 ? void 0 : _a.push(key);
                        else if (room)
                            room.attachmentKeys = [key];
                        const i = rooms.findIndex((r) => r.id === roomID);
                        if (i !== -1 && room)
                            rooms[i] = room;
                        yield redis_1.default.set("rooms", JSON.stringify(rooms));
                    }
                    resolve();
                });
            }
        });
    }
    static deleteAttachments(roomID) {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                aws_sdk_1.default.config.update({
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                    region: "eu-west-2",
                });
                const s3 = new aws_sdk_1.default.S3();
                const attachmentKeys = (yield this.findById(roomID, true)).attachmentKeys;
                if (attachmentKeys && attachmentKeys.length > 0)
                    try {
                        for (var attachmentKeys_1 = __asyncValues(attachmentKeys), attachmentKeys_1_1; attachmentKeys_1_1 = yield attachmentKeys_1.next(), !attachmentKeys_1_1.done;) {
                            const key = attachmentKeys_1_1.value;
                            const params = {
                                Bucket: "webrtc-chat-js",
                                Key: key,
                            };
                            yield new Promise((resolve, reject) => {
                                s3.deleteObject(params, (err, data) => {
                                    if (err)
                                        reject(err);
                                    resolve();
                                });
                            });
                            const getR = yield redis_1.default.get("rooms");
                            if (getR) {
                                const rooms = JSON.parse(getR);
                                let room = rooms.find((r) => r.id === roomID);
                                if (room)
                                    room = {
                                        name: room === null || room === void 0 ? void 0 : room.name,
                                        id: room === null || room === void 0 ? void 0 : room.id,
                                        author: room === null || room === void 0 ? void 0 : room.author,
                                        createdAt: room === null || room === void 0 ? void 0 : room.createdAt,
                                    };
                                const i = rooms.findIndex((r) => r.id === roomID);
                                if (i !== -1 && room)
                                    rooms[i] = room;
                                yield redis_1.default.set("rooms", JSON.stringify(rooms));
                            }
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (attachmentKeys_1_1 && !attachmentKeys_1_1.done && (_a = attachmentKeys_1.return)) yield _a.call(attachmentKeys_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                else {
                    console.log("No attachments to delete");
                }
            }
            catch (e) {
                console.error(e);
            }
        });
    }
}
exports.default = RoomsDAO;
//# sourceMappingURL=rooms.dao.js.map