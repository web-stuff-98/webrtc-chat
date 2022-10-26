import { Response, Request } from "express";
import UsersDAO from "../dao/users.dao";

import jwt from "jsonwebtoken";
import decodeToken from "../../utils/decodeToken";

class UsersController {
  static async login(req: Request, res: Response) {
    try {
      const user = await UsersDAO.login(req.body.name, req.body.password);
      const token = jwt.sign(user.id, process.env.JWT_SECRET!);
      res.status(200).json({ ...user, token });
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }
  static async register(req: Request, res: Response) {
    try {
      const user = await UsersDAO.register(req.body.name, req.body.password);
      const token = jwt.sign(user.id, process.env.JWT_SECRET!);
      res.status(201).json({ ...user, token });
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }
  static async findUserById(req: Request, res: Response) {
    try {
      const user = await UsersDAO.findById(req.params.id);
      res.status(200).json(user);
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }
  static async updatePfp(req: Request, res: Response) {
    try {
      // @ts-ignore
      console.log("req.uid : " + JSON.stringify(req.uid))
      // @ts-ignore
      await UsersDAO.updatePfp(req.uid, req.body.base64pfp)
      res.status(200).json({msg:"Updated pfp"})
    } catch (e) {
      res.status(400).json({msg:`${e}`})
    }
  }
}

export default UsersController;
