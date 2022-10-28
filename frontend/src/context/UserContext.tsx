import {
  useContext,
  createContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import type { ReactNode } from "react";
import useAuth from "./AuthContext";
import { IUser } from "../interfaces/interfaces";

const UsersContext = createContext<{
  users: IUser[];
  cacheUserData: (uid: string, force?: boolean) => void;
  findUserData: (uid: string) => IUser | undefined;
  addCurrentUserData: (u: IUser) => void;
}>({
  users: [],
  cacheUserData: () => {},
  findUserData: () => undefined,
  addCurrentUserData: () => undefined,
});

export const UsersProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  const [users, setUsers] = useState<IUser[]>([
    { name: "Server", id: "server" },
  ]);

  const addCurrentUserData = (u: IUser) => {
    setUsers((old) => [...old, u]);
  };

  const cacheUserData = async (uid: string, force?: boolean) => {
    const found = users.find((u: IUser) => u.id === uid);
    if (found && !force) return;
    const res = await fetch(`${process.env.NODE_ENV === "development" ? "http://localhost:5000" : ""}/api/users/${uid}`, {
      method: "GET",
      headers: { "Content-type": "application/json;charset=UTF-8" },
    });
    if (res.ok) {
      const json = await res.json();
      setUsers((old) => [...old, json]);
    } else {
      console.warn("Couldn't get data for user " + uid);
    }
  };

  const findUserData = useCallback(
    (uid: string) => {
      return users.find((u: IUser) => u.id === uid);
    },
    [users]
  );

  useEffect(() => {
    if (user) addCurrentUserData(user);
  }, [user]);

  return (
    <UsersContext.Provider
      value={{ users, cacheUserData, findUserData, addCurrentUserData }}
    >
      {children}
    </UsersContext.Provider>
  );
};

const useUsers = () => useContext(UsersContext);
export default useUsers;
