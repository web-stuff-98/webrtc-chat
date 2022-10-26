import { Request, Response, NextFunction } from "express";

export default function authMiddleware(req:Request, res:Response, next:NextFunction) {
    console.log(`Token : ${JSON.stringify(req.headers.authorization)}`)
    next()
}