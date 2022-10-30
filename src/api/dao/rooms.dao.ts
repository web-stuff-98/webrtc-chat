import redisClient from "../../utils/redis";
import crypto from "crypto";
import { IRoom } from "../../../src/interfaces/interfaces";

import { Busboy } from "busboy";
import AWS from "aws-sdk";
import mime from "mime-types";

import { io } from "../../index";

class RoomsDAO {
  static async findByName(name: string) {
    const getR = await redisClient?.get("rooms");
    let rooms: IRoom[] = [];
    if (getR) {
      rooms = JSON.parse(getR);
      const r = rooms.find(
        (r: IRoom) => r.name.toLowerCase() === name.trim().toLowerCase()
      );
      if (r) {
        return r;
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
    rooms.push({
      ...room,
      attachmentKeys: [],
    });
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
    return rooms.map((r) => ({
      name: r.name,
      author: r.author,
      createdAt: r.createdAt,
      id: r.id,
    }));
  }

  static async findById(id: string, withAttachmentKeys?: boolean) {
    const getR = await redisClient?.get("rooms");
    let rooms: IRoom[] = [];
    if (getR) {
      rooms = JSON.parse(getR);
    } else {
      throw new Error("There are no rooms");
    }
    const found = rooms.find((room: IRoom) => room.id === id);
    if (found) {
      return withAttachmentKeys
        ? found
        : {
            name: found.name,
            author: found.author,
            createdAt: found.createdAt,
            id: found.id,
          };
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

  static uploadAttachment(
    busboy: Busboy,
    roomID: string,
    msgID: string,
    bytes: number
  ) {
    return new Promise<void>((resolve, reject) => {
      AWS.config.update({
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
        const ext = String(mime.extension(filename.mimeType));
        const key = `${msgID}.${ext}`;
        s3.upload(
          {
            Bucket: "webrtc-chat-js",
            Key: key,
            Body: file,
            ContentType: String(mime.contentType(ext)),
          },
          (err: any, file: any) => {
            if (err) failed(err);
            success(filename.mimeType, ext, key);
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
      async function success(mimeType: string, ext: string, key: string) {
        io.to(roomID).emit("attachment_success", { msgID, mimeType, ext });
        const getR = await redisClient.get("rooms");
        if (getR) {
          let rooms: IRoom[] = JSON.parse(getR);
          let room = rooms.find((r) => r.id === roomID);
          if (room?.attachmentKeys) room?.attachmentKeys?.push(key);
          else if (room) room.attachmentKeys = [key];
          const i = rooms.findIndex((r) => r.id === roomID);
          if (i !== -1 && room) rooms[i] = room;
          await redisClient.set("rooms", JSON.stringify(rooms));
        }
        resolve();
      }
    });
  }

  static async deleteAttachments(roomID: string) {
    try {
      AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: "eu-west-2",
      });
      const s3 = new AWS.S3();
      const attachmentKeys = (await this.findById(roomID, true)).attachmentKeys;
      if (attachmentKeys && attachmentKeys.length > 0)
        for await (const key of attachmentKeys) {
          const params = {
            Bucket: "webrtc-chat-js",
            Key: key,
          };
          await new Promise<void>((resolve, reject) => {
            s3.deleteObject(params, (err, data) => {
              if (err) reject(err);
              resolve();
            });
          });
          const getR = await redisClient.get("rooms");
          if (getR) {
            let rooms: IRoom[] = JSON.parse(getR);
            let room = rooms.find((r) => r.id === roomID);
            if (room)
              room = {
                name: room?.name,
                id: room?.id,
                author: room?.author,
                createdAt: room?.createdAt,
              };
            const i = rooms.findIndex((r) => r.id === roomID);
            if (i !== -1 && room) rooms[i] = room;
            await redisClient.set("rooms", JSON.stringify(rooms));
          }
        }
      else {
        console.log("No attachments to delete");
      }
    } catch (e) {
      console.error(e);
    }
  }
}
export default RoomsDAO;
