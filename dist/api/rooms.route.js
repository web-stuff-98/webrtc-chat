"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const rooms_controller_1 = __importDefault(require("./controllers/rooms.controller"));
const router = express_1.default.Router();
router.route("/").get(rooms_controller_1.default.getRooms);
router.route("/:id").get(rooms_controller_1.default.getRoomById);
exports.default = router;
//# sourceMappingURL=rooms.route.js.map