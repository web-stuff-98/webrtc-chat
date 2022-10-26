import express from "express";
import UsersController from "./controllers/users.controller";
const router = express.Router();

router.route("/login").post(UsersController.login);
router.route("/register").post(UsersController.register);
router.route("/:id").get(UsersController.findUserById);

export default router;
