import { verify } from "jsonwebtoken";

export default (token: string):Promise<string> => {
  return new Promise((resolve, reject) => {
    verify(token, process.env.JWT_SECRET!, (err, decoded) => {
      if (err) reject(new Error("Unauthorized"));
      resolve(String(decoded));
    });
  });
};
