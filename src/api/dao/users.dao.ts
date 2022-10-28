import redisClient from "../../utils/redis";
import { compare, hash } from "bcrypt";
import crypto from "crypto";
import { IRoom, IUser } from "../../interfaces/interfaces";
import imageProcessing from "../../utils/imageProcessing";

class UsersDAO {
  static async login(name: string, password: string) {
    const getU = await redisClient?.get("users");
    if (getU) {
      let users: IUser[] = [];
      users = JSON.parse(getU);
      const data = users.find((u: IUser) => u.name === name);
      if (data) {
        if (await compare(password, data?.password!)) {
          delete data.password;
          return data;
        } else {
          throw new Error("Incorrect credentials");
        }
      }
    }
    throw new Error("No user found");
  }

  static async register(name: string, password: string, ip: string) {
    const getU = await redisClient?.get("users");
    const IPRateLimit = await redisClient?.get(ip);
    let IPRateLimitData: any = {};
    let users: IUser[] = [];
    if (getU) {
      users = JSON.parse(getU);
    }
    if (IPRateLimit) {
      IPRateLimitData = JSON.parse(IPRateLimit);
      if (IPRateLimitData.accounts && IPRateLimitData.accounts === 4) {
        throw new Error("Max 4 accounts");
      }
      IPRateLimitData = {
        ...IPRateLimitData,
        accounts: IPRateLimitData.accounts + 1,
      };
    } else {
      IPRateLimitData = { accounts: 1 };
    }
    if (users.find((u: IUser) => u.name.toLowerCase() === name)) {
      throw new Error("There is a user with that name already");
    }
    const passwordHash = await hash(password, 10);
    const id = crypto.randomBytes(16).toString("hex");
    const createdUser = {
      name,
      id,
      password: passwordHash,
      createdAt: new Date().toISOString(),
    };
    users.push(createdUser);
    await redisClient?.set("users", JSON.stringify(users));
    await redisClient?.set(ip, JSON.stringify(IPRateLimitData));
    return createdUser;
  }

  static async findById(uid: string) {
    const getU = await redisClient?.get("users");
    let users: IUser[] = [];
    if (getU) {
      users = JSON.parse(getU);
    }
    const matching = users.find((u: IUser) => u.id === uid);
    if (!matching) throw new Error("Could not find user");
    delete matching.password;
    return matching;
  }

  static async updatePfp(uid: string, base64: string) {
    const getU = await redisClient?.get("users");
    let users: IUser[] = [];
    if (getU) {
      users = JSON.parse(getU);
    } else {
      throw new Error("Couldn't find user to update");
    }
    const u = users.find((user: IUser) => user.id === uid);
    let pfp = "";
    try {
      pfp = await imageProcessing(base64, { width: 32, height: 32 });
    } catch (error) {
      console.warn("There was an error processing an image : " + error);
      return;
    }
    if (u) {
      u.pfp = pfp;
      users = users.filter((user: IUser) => user.id !== uid);
      users.push(u);
      await redisClient?.set("users", JSON.stringify(users));
    }
  }

  static async deleteAccount(uid: string) {
    const getU = await redisClient?.get("users");
    const getR = await redisClient?.get("rooms");
    let users: IUser[] = [];
    let rooms: IRoom[] = [];
    if (getU) {
      users = JSON.parse(getU);
    } else {
      throw new Error("Couldn't find account to delete");
    }
    if (getR) {
      rooms = JSON.parse(getR);
    }
    const u = users.find((user: IUser) => user.id === uid);
    if (u) {
      users = users.filter((user: IUser) => user.id !== uid);
      const usersRooms = rooms
        .filter((room: IRoom) => room.author === uid)
        .map((usersRoom) => usersRoom.id);
      rooms = rooms.filter((r: IRoom) => r.author !== uid);
      await redisClient?.set("users", JSON.stringify(users));
      await redisClient?.set("rooms", JSON.stringify(rooms));
      return usersRooms;
    }
  }
}
export default UsersDAO;
