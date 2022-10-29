import redisClient from "../../utils/redis";
import crypto from "crypto";
import { IRoom } from "../../../src/interfaces/interfaces";

import { Busboy } from "busboy";
import AWS from "aws-sdk";

import { io } from "../../index";

class RoomsDAO {
  static async findByName(name: string) {
    const getR = await redisClient?.get("rooms");
    let rooms: IRoom[] = [];
    if (getR) {
      rooms = JSON.parse(getR);
      if (
        rooms.find(
          (r: IRoom) => r.name.toLowerCase() === name.trim().toLowerCase()
        )
      ) {
        return true;
      }
    } else {
      return false;
    }
  }

  static async create(name: string, author: string, ip: string) {
    const getR = await redisClient?.get("rooms");
    const IPRateLimit = await redisClient?.get(ip);
    let IPRateLimitData: any = {};
    let rooms: IRoom[] = [];
    if (IPRateLimit) {
      IPRateLimitData = JSON.parse(IPRateLimit);
      if (IPRateLimitData.rooms && IPRateLimitData.rooms === 4) {
        throw new Error("Max 4 rooms");
      }
      IPRateLimitData = {
        ...IPRateLimitData,
        rooms: IPRateLimitData.rooms + 1,
      };
    } else {
      IPRateLimitData = { rooms: 1 };
    }
    if (getR) {
      rooms = JSON.parse(getR);
      if (
        rooms.find(
          (r: IRoom) => r.name.toLowerCase() === name.trim().toLowerCase()
        )
      ) {
        throw new Error("There is a room with that name already");
      }
    }
    const room = {
      name,
      author,
      createdAt: new Date().toISOString(),
      id: crypto.randomBytes(16).toString("hex"),
    };
    rooms.push(room);
    await redisClient?.set("rooms", JSON.stringify(rooms));
    await redisClient?.set(ip, JSON.stringify(IPRateLimitData));
    return room;
  }

  static async getAll() {
    const getR = await redisClient?.get("rooms");
    let rooms: IRoom[] = [];
    if (getR) {
      rooms = JSON.parse(getR);
    }
    return rooms;
  }

  static async findById(id: string) {
    const getR = await redisClient?.get("rooms");
    let rooms: IRoom[] = [];
    if (getR) {
      rooms = JSON.parse(getR);
    } else {
      throw new Error("There are no rooms");
    }
    const found = rooms.find((room: IRoom) => room.id === id);
    if (found) {
      return found;
    }
    throw new Error("Could not find room");
  }

  static async deleteById(id: string) {
    const getR = await redisClient?.get("rooms");
    let rooms: IRoom[] = [];
    if (getR) {
      rooms = JSON.parse(getR);
    } else {
      throw new Error("There are no rooms");
    }
    rooms.filter((room: IRoom) => room.id !== id);
    await redisClient?.set("rooms", JSON.stringify(rooms));
  }

  static uploadAttachment(busboy: Busboy, roomID: string, msgID: string, bytes:number) {
    return new Promise<void>((resolve, reject) => {
      AWS.config.update({
        // if you are having trouble with S3 you could just save to disk and remove attachment progress until
        // you have everything else sorted out
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: "eu-west-2",
      });
      const s3 = new AWS.S3();
      let p = 0;
      busboy.on("file", (fieldname: string, file: any, filename: any) => {
        if (
          !filename.mimeType.includes("video") &&
          !filename.mimeType.includes("image")
        ) {
          failed(new Error("Attachment must be an image or video"));
        }
        s3.upload(
          {
            Bucket: "webrtc-chat-js",
            Key: `attachment.${msgID}`,
            Body: file,
          },
          (err: any, file: any) => {
            if (err) failed(err);
            success();
          }
        ).on("httpUploadProgress", (e: AWS.S3.ManagedUpload.Progress) => {
          p++;
          // only send every 2nd progress update, because its too many emits otherwise
          if (p === 2) {
            p = 0;
            io.to(roomID).emit("attachment_progress", {
              progress: e.loaded / bytes,
              msgID,
            });
          }
        });
      });
      busboy.on("error", failed);
      function failed(e: unknown) {
        io.to(roomID).emit("attachment_failed", msgID);
        reject(e);
      }
      function success() {
        io.to(roomID).emit("attachment_success", msgID);
        resolve();
      }
    });
  }
}
export default RoomsDAO;
