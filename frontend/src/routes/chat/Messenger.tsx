import classes from "./Chat.module.scss";

import { IParsedRoomMsg, IRoomMsg } from "../../interfaces/interfaces";

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

import { AiFillFileAdd } from "react-icons/ai";
import { MdSend } from "react-icons/md";
import { BiErrorCircle } from "react-icons/bi";
import { FaDownload } from "react-icons/fa";

import User from "../../components/user/User";
import ProgressBar from "../../components/progressBar/ProgressBar";
import { useModal } from "../../context/ModalContext";

export default function Messenger() {
  const { socket } = useSocket();
  const { user } = useAuth();
  const { roomID } = useParams();
  const { findUserData } = useUsers();
  const { openAttachment } = useModal();

  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const [attachment, setAttachment] = useState<File>();
  const attachmentRef = useRef<File>();

  const handleAttachmentSuccess = useCallback(
    ({ msgID, mimeType, ext }: { msgID: string; mimeType: string,ext:string }) => {
      setMessages((msgs: IParsedRoomMsg[]) => {
        let newMsgs = msgs;
        const i = newMsgs.findIndex((msg) => msg.id === msgID);
        if (i !== -1)
          newMsgs[i] = {
            ...newMsgs[i],
            attachment: "success",
            attachmentMimeType: mimeType,
            attachmentProgress: 1,
            attachmentExt: ext
          };
        if (newMsgs[i].author === user.id) setAttachmentPending(false);
        return [...newMsgs];
      });
    },
    []
  );
  const handleAttachmentFailed = useCallback((msgID: string) => {
    setMessages((msgs: IParsedRoomMsg[]) => {
      let newMsgs = msgs;
      const i = newMsgs.findIndex((msg) => msg.id === msgID);
      if (i !== -1) newMsgs[i] = { ...newMsgs[i], attachment: "failed" };
      if (newMsgs[i].author === user.id) setAttachmentPending(false);
      return [...newMsgs];
    });
  }, []);
  const handleAttachmentProgress = useCallback(
    ({ progress, msgID }: { progress: number; msgID: string }) => {
      setMessages((msgs: IParsedRoomMsg[]) => {
        let newMsgs = msgs;
        const i = newMsgs.findIndex((msg) => msg.id === msgID);
        newMsgs[i].attachmentProgress = progress * 100;
        return [...newMsgs];
      });
    },
    []
  );

  useEffect(() => {
    if (socket) {
      socket.on("server_msg_to_room", handleServerMsgToRoom);
      socket.on("client_msg_to_room", handleClientMsgToRoom);
      socket.on("attachment_success", handleAttachmentSuccess);
      socket.on("attachment_failed", handleAttachmentFailed);
      socket.on("attachment_progress", handleAttachmentProgress);
    }
    return () => {
      socket?.off("client_msg_to_room", handleClientMsgToRoom);
      socket?.off("server_msg_to_room", handleServerMsgToRoom);
      socket?.off("attachment_success", handleAttachmentSuccess);
      socket?.off("attachment_failed", handleAttachmentFailed);
      socket?.off("attachment_progress", handleAttachmentProgress);
    };
  }, []);

  const handleServerMsgToRoom = (msg: string) =>
    addMsg({
      msg,
      author: "server",
      createdAt: new Date(),
      id: (Math.random() + 1).toString(36).substring(7),
    });
  const handleClientMsgToRoom = async (data: IRoomMsg) => {
    addMsg(data);
    if (data.author === user.id && data.attachment === "pending") {
      await uploadAttachment(data.id);
    }
  };
  const addMsg = (data: {
    msg: string;
    author: string;
    createdAt: string | Date;
    id: string;
  }) => {
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
  };
  const [messages, setMessages] = useState<IParsedRoomMsg[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const handleMessageInput = (e: ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
  };
  const handleSubmitMessage = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    socket?.emit("msg_to_room", {
      msg: messageInput,
      ...(attachment ? { attachment: "pending" } : {}),
    });
  };

  const uploadAttachment = async (msgID: string) => {
    try {
      setAttachmentPending(true);
      if (!attachmentRef.current) {
        console.warn("No attachment");
        return;
      }
      let formData = new FormData();
      //@ts-ignore
      formData.append("file", attachmentRef.current);
      await fetch(
        `${
          process.env.NODE_ENV === "development" ? "http://localhost:5000" : ""
        }/api/rooms/attachment/${roomID}/${msgID}/${
          attachmentRef.current.size
        }`,
        {
          method: "POST",
          body: formData,
          headers: {
            authorization: `Bearer ${user.token}`,
          },
        }
      );
      setAttachment(undefined);
      attachmentRef.current = undefined;
    } catch (e) {
      console.warn(e);
      setAttachment(undefined);
      attachmentRef.current = undefined;
    }
  };

  const handleAttachmentInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    if (!file) return;
    setAttachment(file);
    attachmentRef.current = file;
  };
  const [attachmentPending, setAttachmentPending] = useState(false);

  const msgFormRef = useRef<HTMLFormElement>(null);
  const msgsBtmRef = useRef<HTMLDivElement>(null);
  return (
    <div className={classes.messenger}>
      <div className={classes.list}>
        {messages &&
          messages.map((msg: IParsedRoomMsg) => (
            <div
              key={msg.msg + msg.author + msg.createdAt}
              className={classes.message}
            >
              <User
                customDate={msg.createdAt}
                userData={findUserData(msg.author)}
              />
              <div className={classes.content}>{msg.msg}</div>
              {msg.attachment && msg.attachment === "pending" && (
                <div className={classes.progressBarContainer}>
                  <ProgressBar
                    percent={msg.attachmentProgress}
                    label={"Attachment..."}
                  />
                </div>
              )}
              {msg.attachment && msg.attachment === "failed" && (
                <div className={classes.attachmentFailed}>
                  <BiErrorCircle />
                  Attachment failed
                </div>
              )}
              {msg.attachment && msg.attachment === "success" && (
                <div className={classes.attachmentDownload}>
                  Watch / download attachment
                  <FaDownload
                    className={classes.attachmentIcon}
                    onClick={() => {
                      openAttachment(
                        `${msg.id}.${msg.attachmentExt}`,
                        String(msg.attachmentExt)
                      );
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        <div ref={msgsBtmRef} style={{ height: "0px", width: "100%" }} />
      </div>
      <form ref={msgFormRef} style={attachment ? {
        color:"lime", lineHeight:"0.866",
        filter:"drop-shadow(0px 2px 1.5px rgba(0,0,0,0.166))"
      } : {}} onSubmit={handleSubmitMessage}>
        <input
          value={messageInput}
          onChange={handleMessageInput}
          type="text"
          required
        />
        <MdSend onClick={() => msgFormRef.current?.requestSubmit()} />
        <AiFillFileAdd
          style={
            attachmentPending
              ? {
                  filter: "opacity(0.5)",
                  pointerEvents: "none",
                }
              : attachment
              ? {
                  fill: "lime",
                }
              : {}
          }
          onClick={() => {
            if (!attachmentPending) {
              attachmentInputRef.current?.click();
            }
          }}
        />
        {attachment && attachment.name}
        <input
          style={{ display: "none" }}
          id="attachment"
          name="attachment"
          onChange={handleAttachmentInput}
          ref={attachmentInputRef}
          type="file"
        />
      </form>
    </div>
  );
}
