import { Response, Request } from "express";
import UsersDAO from "../dao/users.dao";

import jwt from "jsonwebtoken";

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
      if(req.body.name > 24) throw new Error("Username too long. Max 24 characters.")
      if(req.body.password > 100) throw new Error("Password too long. Max 100 characters.")
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
      await UsersDAO.updatePfp(String(req.uid), req.body.base64pfp)
      res.status(200).json({msg:"Updated pfp"})
    } catch (e) {
      res.status(400).json({msg:`${e}`})
    }
  }
}

export default UsersController;
