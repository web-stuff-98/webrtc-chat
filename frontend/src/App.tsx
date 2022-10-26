import "./globals.css";
import { useEffect, useState } from "react";

import classes from "./App.module.scss";

import { BiErrorCircle } from "react-icons/bi";
import { ImSpinner8 } from "react-icons/im";
import { useSocket } from "./context/SocketContext";
import { IResMsg } from "../../server/src/interfaces/interfaces";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./routes/login/Login";
import Register from "./routes/register/Register";
import Home from "./routes/home/Home";
import Nav from "./components/nav/Nav";
import Rooms from "./routes/rooms/Rooms";
import Chat from "./routes/chat/Chat";
import Settings from "./routes/settings/Settings";

const App = () => {
  const { socket } = useSocket();

  const [resMsg, setResMsg] = useState<IResMsg>({
    msg: "",
    err: false,
    pen: true,
  });

  const handleResMsg = (data:IResMsg) => setResMsg(data)

  useEffect(() => {
    if (!socket) return;
    socket.on("resMsg", handleResMsg);
    return () => {
      socket.off("resMsg", handleResMsg)
    }
  }, [socket]);

  useEffect(() => {
    const resized = () => {
      const r = document.documentElement.style
      r.setProperty("--horizontal-space", window.innerWidth < 1024 ? "0px" : r.getPropertyValue("--horizontal-space-default"))
    }
    window.addEventListener("resize", resized)
    return () => window.removeEventListener("resize", resized)
  }, [])

  return (
    <div className={classes.container}>
      {resMsg.msg && (
        <div className={classes.messageModal}>
          <div className={classes.modal}>
            {resMsg.err && <BiErrorCircle className={classes.err} />}
            {resMsg.pen && <ImSpinner8 className={classes.pen} />}
            {resMsg.msg}
            {!resMsg.pen && (
              <button
                onClick={() => setResMsg({ msg: "", err: false, pen: false })}
              >
                Close message
              </button>
            )}
          </div>
        </div>
      )}
      <BrowserRouter>
      <Nav/>
      <main>
        <Routes>
          <Route index element={<Home />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/chat/:roomID" element={<Chat />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
};

export default App;
