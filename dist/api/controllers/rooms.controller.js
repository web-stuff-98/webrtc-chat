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
const rooms_dao_1 = __importDefault(require("../dao/rooms.dao"));
class RoomsController {
    static getRooms(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const rooms = yield rooms_dao_1.default.getAll();
                res.status(200).json(rooms);
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static getRoomById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const room = yield rooms_dao_1.default.findById(req.params.id);
                res.status(200).json(room);
            }
            catch (e) {
                res.status(500).json({ msg: `${e}` });
            }
        });
    }
}
exports.default = RoomsController;
//# sourceMappingURL=rooms.controller.js.map