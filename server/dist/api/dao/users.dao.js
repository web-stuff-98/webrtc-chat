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
class UsersDAO {
    static login(name, password) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.connect());
            const getU = yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.get("users"));
            yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.disconnect());
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
    static register(name, password) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.connect());
            const getU = yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.get("users"));
            let users = [];
            if (getU) {
                users = JSON.parse(getU);
            }
            if (users.find((u) => u.name.toLowerCase() === name)) {
                yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.disconnect());
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
            yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.disconnect());
            return createdUser;
        });
    }
    static findById(uid) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.connect());
            const getU = yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.get("users"));
            yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.disconnect());
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
            yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.connect());
            const getU = yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.get("users"));
            let users = [];
            if (getU) {
                users = JSON.parse(getU);
            }
            else {
                yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.disconnect());
                throw new Error("Couldn't find user to update");
            }
            const u = users.find((user) => user.id === uid);
            if (u) {
                u.pfp = base64;
                users = users.filter((user) => user.id !== uid);
                users.push(u);
                yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.set("users", JSON.stringify(users)));
            }
            yield (redis_1.default === null || redis_1.default === void 0 ? void 0 : redis_1.default.disconnect());
        });
    }
}
exports.default = UsersDAO;
//# sourceMappingURL=users.dao.js.map