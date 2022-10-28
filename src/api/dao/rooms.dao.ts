import redisClient from "../../utils/redis";
import crypto from "crypto";
import { IRoom } from "../../../src/interfaces/interfaces";

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

  static async create(name: string, author: string, ip:string) {
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
}
export default RoomsDAO;
