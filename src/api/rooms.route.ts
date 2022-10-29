import express from "express";
import authMiddleware from "../utils/authMiddleware";
import RoomsController from "./controllers/rooms.controller";
const router = express.Router();

router.route("/").get(authMiddleware, RoomsController.getRooms);
router
  .route("/attachment/:roomID/:msgID/:bytes")
  .post(authMiddleware, RoomsController.uploadAttachment);
router.route("/:id").get(authMiddleware, RoomsController.getRoomById);

export default router;
