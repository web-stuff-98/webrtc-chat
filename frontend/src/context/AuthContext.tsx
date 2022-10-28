import { useState, useContext, createContext, ReactNode } from "react";

import { IUser, IResMsg } from "../interfaces/interfaces";

const AuthContext = createContext<
  | {
      user?: IUser;
      register: (name: string, password: string) => void;
      login: (name: string, password: string) => void;
      logout: () => void;
      resMsg: IResMsg;
      clrMsg: () => void;
    }
  | any
>({
  user: null,
  register: () => {},
  login: () => {},
  logout: () => {},
  clrMsg: () => {},
  resMsg: { msg: "", err: false, pen: false },
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [resMsg, setResMsg] = useState<IResMsg>({
    msg: "",
    err: false,
    pen: false,
  });

  const clrMsg = () => setResMsg({ msg: "", err: false, pen: false });

  const register = async (name: string, password: string) => {
    setResMsg({ msg: "Creating account", err: false, pen: true });
    const res = await fetch("/api/users/register", {
      method: "POST",
      body: JSON.stringify({ name, password }),
      headers: { "Content-type": "application/json;charset=UTF-8" },
    });
    const json = await res.json();
    if (res.ok) {
      setUser(json);
      setResMsg({ msg: "Created account", err: false, pen: false });
    } else {
      setResMsg({ msg: json.msg, err: true, pen: false });
    }
  };

  const login = async (name: string, password: string) => {
    setResMsg({ msg: "Logging in", err: false, pen: true });
    const res = await fetch("/api/users/login", {
      method: "POST",
      body: JSON.stringify({ name, password }),
      headers: { "Content-type": "application/json;charset=UTF-8" },
    });
    const json = await res.json();
    if (res.ok) {
      setUser(json);
      setResMsg({ msg: "Logged in", err: false, pen: false });
    } else {
      setResMsg({ msg: json.msg, err: true, pen: false });
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, register, login, logout, clrMsg, resMsg }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

export default useAuth;
