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
class RoomsDAO {
    static findByName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.connect());
            const getR = yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.get("rooms"));
            yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.disconnect());
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
    static create(name, author, socketId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.connect());
            const getR = yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.get("rooms"));
            let rooms = [];
            if (getR) {
                rooms = JSON.parse(getR);
                if (rooms.find((r) => r.name.toLowerCase() === name.trim().toLowerCase())) {
                    yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.disconnect());
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
            yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.disconnect());
            return room;
        });
    }
    static getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.connect());
            const getR = yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.get("rooms"));
            yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.disconnect());
            let rooms = [];
            if (getR) {
                rooms = JSON.parse(getR);
            }
            return rooms;
        });
    }
    static findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.connect());
            const getR = yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.get("rooms"));
            yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.disconnect());
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
}
exports.default = RoomsDAO;
//# sourceMappingURL=rooms.dao.js.map