import {
  useContext,
  createContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import type { ReactNode } from "react";
import { IUser } from "../../../server/src/interfaces/interfaces";
import { useSocket } from "./SocketContext";
import useAuth from "./AuthContext";

const UsersContext = createContext<{
  users: IUser[];
  cacheUserData: (uid: string, force?: boolean) => void;
  findUserData: (uid: string) => void;
}>({
  users: [],
  cacheUserData: () => {},
  findUserData: () => {},
});

export const UsersProvider = ({ children }: { children: ReactNode }) => {
  const { socket } = useSocket();
  const { user } = useAuth();

  const [users, setUsers] = useState<IUser[]>([]);

  const cacheUserData = useCallback((uid: string, force?: boolean) => {
    const found = users.find((u: IUser) => u.id === uid);
    if (found && !force) return;
    socket?.emit("get_user_data", uid);
  }, []);

  const gotUserData = useCallback((data: any) => {
    console.log("Got user data : " + JSON.stringify(data))
    if (data) setUsers((old) => [...old.filter((u) => u.id !== data.id), data]);
  }, []);

  const findUserData = useCallback(
    (uid: string) => users.find((u: IUser) => u.id === uid),
    [users]
  );

  useEffect(() => {
    if (!socket) return;
    socket?.on("got_user_data", gotUserData);
    return () => {
      socket?.off("got_user_data", gotUserData);
    };
  }, [socket]);

  useEffect(() => {
    if (user) cacheUserData(user.id);
  }, [user]);

  return (
    <UsersContext.Provider value={{ users, cacheUserData, findUserData }}>
      {children}
    </UsersContext.Provider>
  );
};

const useUsers = () => useContext(UsersContext);
export default useUsers;
