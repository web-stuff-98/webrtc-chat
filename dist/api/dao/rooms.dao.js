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
                if (rooms.find((r) => r.name.toLowerCase() === name.trim().toLowerCase())) {
                    return true;
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
            rooms.push(room);
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
            return rooms;
        });
    }
    static findById(id) {
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
                return found;
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
                // if you are having trouble with S3 you could just save to disk and remove attachment progress until
                // you have everything else sorted out
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
                console.log(JSON.stringify(filename));
                const ext = String(mime_types_1.default.extension(filename.mimeType));
                s3.upload({
                    Bucket: "webrtc-chat-js",
                    Key: `${msgID}.${ext}`,
                    Body: file,
                    ContentType: String(mime_types_1.default.contentType(ext)),
                }, (err, file) => {
                    if (err)
                        failed(err);
                    success(filename.mimeType, ext);
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
            function success(mimeType, ext) {
                index_1.io.to(roomID).emit("attachment_success", { msgID, mimeType, ext });
                resolve();
            }
        });
    }
}
exports.default = RoomsDAO;
//# sourceMappingURL=rooms.dao.js.map