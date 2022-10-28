"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = __importDefault(require("../utils/authMiddleware"));
const users_controller_1 = __importDefault(require("./controllers/users.controller"));
const router = express_1.default.Router();
router.route("/login").post(users_controller_1.default.login);
router.route("/register").post(users_controller_1.default.register);
router.route("/:id").get(users_controller_1.default.findUserById);
router.route("/").post(authMiddleware_1.default, users_controller_1.default.updatePfp);
exports.default = router;
//# sourceMappingURL=users.route.js.map