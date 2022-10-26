import redisClient from "../../utils/redis";
import { compare, hash } from "bcrypt";
import crypto from "crypto";
import { IUser } from "../../interfaces/interfaces";

class UsersDAO {
  static async login(name: string, password: string) {
    await redisClient?.connect();
    const getU = await redisClient?.get("users");
    await redisClient?.disconnect();
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

  static async register(name: string, password: string) {
    await redisClient?.connect();
    const getU = await redisClient?.get("users");
    let users: IUser[] = [];
    if (getU) {
      users = JSON.parse(getU);
    }
    if (users.find((u: IUser) => u.name.toLowerCase() === name)) {
      await redisClient?.disconnect();
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
    await redisClient?.disconnect();
    return createdUser;
  }

  static async findById(uid: string) {
    await redisClient?.connect();
    const getU = await redisClient?.get("users");
    await redisClient?.disconnect();
    let users: IUser[] = [];
    if (getU) {
      users = JSON.parse(getU);
    }
    const matching = users.find((u: IUser) => u.id === uid);
    if (!matching) throw new Error("Could not find user");
    delete matching.password;
    return matching;
  }
}
export default UsersDAO;
