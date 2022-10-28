import express from "express";
import RoomsController from "./controllers/rooms.controller";
const router = express.Router();

router.route("/").get(RoomsController.getRooms);
router.route("/:id").get(RoomsController.getRoomById);

export default router;
