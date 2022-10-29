import { Response, Request } from "express";
import RoomsDAO from "../dao/rooms.dao";

import Busboy from "busboy";

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

  static async uploadAttachment(req: Request, res: Response) {
    const { roomID, msgID, bytes } = req.params;
    const busboy = Busboy({ headers: req.headers });
    req.pipe(busboy);
    try {
      await RoomsDAO.uploadAttachment(busboy, roomID, msgID, Number(bytes));
      res.writeHead(200, { Connection: "close" });
      res.end();
    } catch (e) {
      req.unpipe(busboy);
      res.status(400).json({ msg: `${e}` });
    }
  }
}

export default RoomsController;
