import "./globals.css";
import { useEffect, useState, useRef, createContext } from "react";

import classes from "./App.module.scss";

import { BiErrorCircle } from "react-icons/bi";
import { MdDarkMode } from "react-icons/md";
import { ImSpinner8 } from "react-icons/im";
import { useSocket } from "./context/SocketContext";
import { IResMsg } from "./interfaces/interfaces";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./routes/login/Login";
import Register from "./routes/register/Register";
import Home from "./routes/home/Home";
import Nav from "./components/nav/Nav";
import Rooms from "./routes/rooms/Rooms";
import Chat from "./routes/chat/Chat";
import Settings from "./routes/settings/Settings";
import { EModalType, useModal } from "./context/ModalContext";
import ProtectedRoute, { ProtectedRouteProps } from "./routes/ProtectedRoute";
import useAuth from "./context/AuthContext";

const App = () => {
  const { state: mState, closeAttachment } = useModal();
  const { socket } = useSocket();
  const { user } = useAuth();

  const [resMsg, setResMsg] = useState<IResMsg>({
    msg: "",
    err: false,
    pen: true,
  });

  const handleResMsg = (data: IResMsg) => setResMsg(data);

  useEffect(() => {
    if (!socket) return;
    socket.on("resMsg", handleResMsg);
    return () => {
      socket.off("resMsg", handleResMsg);
    };
  }, [socket]);

  useEffect(() => {
    const resized = () => {
      const r = document.documentElement.style;
      r.setProperty(
        "--horizontal-space",
        window.innerWidth < 1024
          ? "0px"
          : r.getPropertyValue("--horizontal-space-default")
      );
      setWinDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    resized();
    const mouseMoved = (e: MouseEvent) => {
      setMousePos({ left: e.clientX, top: e.clientY });
    };
    window.addEventListener("mousemove", mouseMoved)
    window.addEventListener("resize", resized);
    const i = setInterval(() => {
      resized();
    }, 100);
    return () => {
      window.removeEventListener("mousemove", mouseMoved);
      window.removeEventListener("resize", resized);
      clearInterval(i);
    };
  }, []);

  const [dark, setDark] = useState(true);
  useEffect(() => {
    document.body.classList.toggle("dark");
  }, [dark]);

  const [winDimensions, setWinDimensions] = useState({
    width: 1920,
    height: 1080,
  });

  const defaultProtectedRouteProps: Omit<ProtectedRouteProps, "outlet"> = {
    user: user || undefined,
    redirectPath: "/login",
  };

  const [mousePos, setMousePos] = useState({ left: 0, top: 0 });

  const hiddenAttachmentDownloadTag = useRef<HTMLAnchorElement>(null);
  return (
    <div className={classes.container}>
      <div className={classes.backgroundOuterContainer}>
        <div className={classes.backgroundInnerContainer}>
          <div
            /*style={{
              backgroundPositionY: `${scrollTop * -0.05}px`,
            }}*/
            aria-label="hidden"
            className={classes.background}
          />
          <div
            aria-label="hidden"
            style={{
              ...(winDimensions.width < 500
                ? {
                    maskImage: `radial-gradient(circle at 50% 50%, transparent -50%, rgba(0,0,0,0.25) 86.66%)`,
                    WebkitMaskImage: `radial-gradient(circle at 50% 50%, transparent -50%, rgba(0,0,0,0.25) 86.66%)`,
                  }
                : {
                    maskImage: `radial-gradient(circle at ${
                      (mousePos?.left! / winDimensions.width) * 100
                    }% ${
                      (mousePos?.top! / winDimensions.height) * 100
                    }%, black 0%, transparent 7%)`,
                    WebkitMaskImage: `radial-gradient(circle at ${
                      (mousePos?.left! / winDimensions.width) * 100
                    }% ${
                      (mousePos?.top! / winDimensions.height) * 100
                    }%, black 0%, transparent 7%)`,
                  }),
              ...(dark
                ? { filter: "brightness(5.5) contrast(1.5) blur(3px)" }
                : {}),
              //backgroundPositionY: `${scrollTop * -0.05}px`,
            }}
            className={classes.backgroundHover}
          />
        </div>
      </div>
      {mState.showModal && (
        <>
          <div
            onClick={() => closeAttachment()}
            className={classes.modalBackdrop}
          />
          <div className={classes.modalContainer}>
            <div className={classes.modal}>
              <>
                {mState.modalType === EModalType.ViewAttachmentVideo && (
                  <video src={mState.url} controls={true} />
                )}
                {mState.modalType === EModalType.ViewAttachmentImage && (
                  <img src={mState.url} />
                )}
                {mState.modalType === EModalType.ViewAttachmentFile && (
                  <>
                    <a
                      ref={hiddenAttachmentDownloadTag}
                      href={mState.url}
                      style={{ display: "none" }}
                      download
                    />
                    <button
                      onClick={() => {
                        if (hiddenAttachmentDownloadTag.current)
                          hiddenAttachmentDownloadTag.current.click();
                      }}
                      className={classes.downloadButton}
                    >
                      Download attachment
                    </button>
                  </>
                )}
              </>
            </div>
          </div>
        </>
      )}
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
        <Nav />
        <header>
          WebRTC-chat-js
          <div onClick={() => setDark(!dark)} className={classes.darkToggle}>
            Toggle dark mode
            <MdDarkMode />
          </div>
        </header>
        <main>
          <Routes>
            <Route index element={<Home />} />
            <Route
              path="/rooms"
              element={
                <ProtectedRoute
                  {...defaultProtectedRouteProps}
                  outlet={<Rooms />}
                />
              }
            />
            <Route
              path="/chat/:roomID"
              element={
                <ProtectedRoute
                  {...defaultProtectedRouteProps}
                  outlet={<Chat />}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute
                  {...defaultProtectedRouteProps}
                  outlet={<Settings />}
                />
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
};

export default App;
