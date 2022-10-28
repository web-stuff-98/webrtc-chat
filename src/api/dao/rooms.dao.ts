import redisClient from "../../utils/redis";
import crypto from "crypto";
import { IRoom } from "../../../src/interfaces/interfaces";

class RoomsDAO {
  static async findByName(name: string) {
    await redisClient?.connect();
    const getR = await redisClient?.get("rooms");
    await redisClient?.disconnect();
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

  static async create(name: string, author: string, ip:string) {
    await redisClient?.connect();
    const getR = await redisClient?.get("rooms");
    const IPRateLimit = await redisClient?.get(ip);
    let IPRateLimitData: any = {};
    let rooms: IRoom[] = [];
    if (IPRateLimit) {
      IPRateLimitData = JSON.parse(IPRateLimit);
      if (IPRateLimitData.rooms && IPRateLimitData.rooms === 4) {
        await redisClient?.disconnect();
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
        await redisClient?.disconnect();
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
    await redisClient?.disconnect();
    return room;
  }

  static async getAll() {
    await redisClient?.connect();
    const getR = await redisClient?.get("rooms");
    await redisClient?.disconnect();
    let rooms: IRoom[] = [];
    if (getR) {
      rooms = JSON.parse(getR);
    }
    return rooms;
  }

  static async findById(id: string) {
    await redisClient?.connect();
    const getR = await redisClient?.get("rooms");
    await redisClient?.disconnect();
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
    await redisClient?.connect();
    const getR = await redisClient?.get("rooms");
    let rooms: IRoom[] = [];
    if (getR) {
      rooms = JSON.parse(getR);
    } else {
      await redisClient?.disconnect();
      throw new Error("There are no rooms");
    }
    rooms.filter((room: IRoom) => room.id !== id);
    await redisClient?.set("rooms", JSON.stringify(rooms));
    await redisClient?.disconnect();
  }
}
export default RoomsDAO;
