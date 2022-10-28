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
const users_dao_1 = __importDefault(require("../dao/users.dao"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../../index");
class UsersController {
    static login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield users_dao_1.default.login(req.body.name, req.body.password);
                const token = jsonwebtoken_1.default.sign(user.id, process.env.JWT_SECRET);
                res.status(200).json(Object.assign(Object.assign({}, user), { token }));
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static register(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (req.body.name > 24)
                    throw new Error("Username too long. Max 24 characters.");
                if (req.body.password > 100)
                    throw new Error("Password too long. Max 100 characters.");
                const ip = (0, index_1.getIpFromRequest)(req);
                const user = yield users_dao_1.default.register(req.body.name, req.body.password, ip);
                const token = jsonwebtoken_1.default.sign(user.id, process.env.JWT_SECRET);
                res.status(201).json(Object.assign(Object.assign({}, user), { token }));
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static findUserById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield users_dao_1.default.findById(req.params.id);
                res.status(200).json(user);
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static updatePfp(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield users_dao_1.default.updatePfp(String(req.uid), req.body.base64pfp);
                res.status(200).json({ msg: "Updated pfp" });
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
}
exports.default = UsersController;
//# sourceMappingURL=users.controller.js.map