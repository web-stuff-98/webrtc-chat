import { Response, Request } from "express";
import RoomsDAO from "../dao/rooms.dao";

class RoomsController {
  static async getRooms(req: Request, res: Response) {
    try {
      const rooms = await RoomsDAO.getAll();
      res.status(200).json(rooms);
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }

  static async getRoomById(req: Request, res: Response) {
    try {
      const room = await RoomsDAO.findById(req.params.id);
      res.status(200).json(room);
    } catch (e) {
      res.status(500).json({ msg: `${e}` });
    }
  }
}

export default RoomsController;
