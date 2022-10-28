import classes from "./Chat.module.scss";

import { IParsedRoomMsg } from "../../interfaces/interfaces";

import {
  FormEvent,
  ChangeEvent,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { useSocket } from "../../context/SocketContext";
import { useParams } from "react-router-dom";
import useAuth from "../../context/AuthContext";
import useUsers from "../../context/UserContext";

import { MdSend } from "react-icons/md";
import User from "../../components/user/User";

export default function Messenger() {
  const { socket } = useSocket();
  const { user } = useAuth();
  const { roomID } = useParams();
  const { findUserData } = useUsers();

  useEffect(() => {
    socket?.off("server_msg_to_room").on("server_msg_to_room", handleServerMsgToRoom);
    socket?.off("client_msg_to_room").on("client_msg_to_room", handleClientMsgToRoom);
  }, []);

  const handleServerMsgToRoom = (msg: string) =>
    addMsg({ msg, author: "server", createdAt: new Date() });
  const handleClientMsgToRoom = (data: {
    msg: string;
    createdAt: string;
    author: string;
  }) => {
    addMsg(data);
  };
  const addMsg = useCallback(
    (data: { msg: string; author: string; createdAt: string | Date }) => {
      setMessages((oldMsgs) => [
        ...oldMsgs,
        {
          ...data,
          createdAt:
            typeof data.createdAt === "string"
              ? new Date(data.createdAt)
              : data.createdAt,
        },
      ]);
      msgsBtmRef.current?.scrollIntoView({ behavior: "auto" });
    },
    []
  );
  const [messages, setMessages] = useState<IParsedRoomMsg[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const handleSubmitMessage = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      socket?.emit("msg_to_room", { msg: messageInput, roomID: `${roomID}` });
      addMsg({
        msg: messageInput,
        author: user.id,
        createdAt: new Date(),
      });
    },
    [messageInput]
  );
  const handleMessageInput = (e: ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
  };

  const msgFormRef = useRef<HTMLFormElement>(null);
  const msgsBtmRef = useRef<HTMLDivElement>(null);

  return (
    <div className={classes.messenger}>
      <div className={classes.list}>
        {messages &&
          messages.map((msg: any) => (
            <div key={msg.msg + msg.author + msg.createdAt} className={classes.message}>
              <User
                customDate={msg.createdAt}
                userData={findUserData(msg.author)}
              />
              <div className={classes.content}>{msg.msg}</div>
            </div>
          ))}
        <div ref={msgsBtmRef} style={{ height: "0px", width: "100%" }} />
      </div>
      <form ref={msgFormRef} onSubmit={handleSubmitMessage}>
        <input
          value={messageInput}
          onChange={handleMessageInput}
          type="text"
          required
        />
        <MdSend onClick={() => msgFormRef.current?.requestSubmit()} />
      </form>
    </div>
  );
}
