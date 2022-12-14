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
const bcrypt_1 = require("bcrypt");
const crypto_1 = __importDefault(require("crypto"));
const imageProcessing_1 = __importDefault(require("../../utils/imageProcessing"));
class UsersDAO {
    static login(name, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const getU = yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.get("users"));
            if (getU) {
                let users = [];
                users = JSON.parse(getU);
                const data = users.find((u) => u.name === name);
                if (data) {
                    if (yield (0, bcrypt_1.compare)(password, data === null || data === void 0 ? void 0 : data.password)) {
                        delete data.password;
                        return data;
                    }
                    else {
                        throw new Error("Incorrect credentials");
                    }
                }
            }
            throw new Error("No user found");
        });
    }
    static register(name, password, ip) {
        return __awaiter(this, void 0, void 0, function* () {
            const getU = yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.get("users"));
            const IPRateLimit = yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.get(ip));
            let IPRateLimitData = {};
            let users = [];
            if (getU) {
                users = JSON.parse(getU);
            }
            if (IPRateLimit) {
                IPRateLimitData = JSON.parse(IPRateLimit);
                if (IPRateLimitData.accounts && IPRateLimitData.accounts === 4) {
                    throw new Error("Max 4 accounts");
                }
                IPRateLimitData = Object.assign(Object.assign({}, IPRateLimitData), { accounts: IPRateLimitData.accounts + 1 });
            }
            else {
                IPRateLimitData = { accounts: 1 };
            }
            if (users.find((u) => u.name.toLowerCase() === name)) {
                throw new Error("There is a user with that name already");
            }
            const passwordHash = yield (0, bcrypt_1.hash)(password, 10);
            const id = crypto_1.default.randomBytes(16).toString("hex");
            const createdUser = {
                name,
                id,
                password: passwordHash,
                createdAt: new Date().toISOString(),
            };
            users.push(createdUser);
            yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.set("users", JSON.stringify(users)));
            yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.set(ip, JSON.stringify(IPRateLimitData)));
            return createdUser;
        });
    }
    static findById(uid) {
        return __awaiter(this, void 0, void 0, function* () {
            const getU = yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.get("users"));
            let users = [];
            if (getU) {
                users = JSON.parse(getU);
            }
            const matching = users.find((u) => u.id === uid);
            if (!matching)
                throw new Error("Could not find user");
            delete matching.password;
            return matching;
        });
    }
    static updatePfp(uid, base64) {
        return __awaiter(this, void 0, void 0, function* () {
            const getU = yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.get("users"));
            let users = [];
            if (getU) {
                users = JSON.parse(getU);
            }
            else {
                throw new Error("Couldn't find user to update");
            }
            const u = users.find((user) => user.id === uid);
            let pfp = "";
            try {
                pfp = yield (0, imageProcessing_1.default)(base64, { width: 32, height: 32 });
            }
            catch (error) {
                console.warn("There was an error processing an image : " + error);
                return;
            }
            if (u) {
                u.pfp = pfp;
                users = users.filter((user) => user.id !== uid);
                users.push(u);
                yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.set("users", JSON.stringify(users)));
            }
        });
    }
    static deleteAccount(uid) {
        return __awaiter(this, void 0, void 0, function* () {
            const getU = yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.get("users"));
            const getR = yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.get("rooms"));
            let users = [];
            let rooms = [];
            if (getU) {
                users = JSON.parse(getU);
            }
            else {
                throw new Error("Couldn't find account to delete");
            }
            if (getR) {
                rooms = JSON.parse(getR);
            }
            const u = users.find((user) => user.id === uid);
            if (u) {
                users = users.filter((user) => user.id !== uid);
                const usersRooms = rooms
                    .filter((room) => room.author === uid)
                    .map((usersRoom) => usersRoom.id);
                rooms = rooms.filter((r) => r.author !== uid);
                yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.set("users", JSON.stringify(users)));
                yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.set("rooms", JSON.stringify(rooms)));
                return usersRooms;
            }
        });
    }
}
exports.default = UsersDAO;
//# sourceMappingURL=users.dao.js.map