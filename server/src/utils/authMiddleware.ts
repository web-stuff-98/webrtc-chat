import { Request, Response, NextFunction } from "express";
import decodeToken from "./decodeToken";

export default async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(403).json({ msg: "Unauthorized" });
  }
  const token = authHeader.split("Bearer ")[1];
  let decodedToken = "";
  try {
    decodedToken = await decodeToken(token);
  } catch (error) {
    return res.status(403).json({ msg: "Unauthorized" });
  }
  // @ts-ignore
  req.uid = decodedToken
  next();
}
