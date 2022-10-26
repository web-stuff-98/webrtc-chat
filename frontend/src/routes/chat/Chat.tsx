import {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
  useRef,
  useCallback,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";
import classes from "./Chat.module.scss";

import { MdSend } from "react-icons/md";
import { ImSpinner8 } from "react-icons/im";

import {
  IParsedRoomMsg,
  IUser,
} from "../../../../server/src/interfaces/interfaces";

import Peer from "simple-peer";
import useAuth from "../../context/AuthContext";
import useUsers from "../../context/UserContext";
import User from "../../components/user/User";

interface PeerWithIDs {
  peerID: string;
  peerUID: string;
  peer: Peer.Instance;
}

/*

https://dev.to/bravemaster619/how-to-use-socket-io-client-correctly-in-react-app-o65

 ^ This is the solution for React triggering multiple socket emit event problems
   Although... using .off before .on seems to have the same effect, the program will
   crash the computer after a while either way, when there are multiple MediaStreams

   ------------------------------------ SUMMARY ------------------------------------ 
   Put your socket event handlers inside useCallback, and inside your useEffect
   cleanup function use socket.off("your-event-name", yourHandler) to remove the
   event listeners, the same as you have done already below.

*/

function Chat() {
  const { socket } = useSocket();
  const { user } = useAuth();
  const { roomID } = useParams();
  const navigate = useNavigate();
  const { findUserData, cacheUserData } = useUsers();

  const userStream = useRef<MediaStream>();
  const peersRef = useRef<PeerWithIDs[]>([]);
  const [peers, setPeers] = useState<PeerWithIDs[]>([]);
  const userVideo = useRef<HTMLVideoElement | any>();

  const leaveRoom = useCallback(() => {
    socket?.emit("leave_room");
    for (const p of peersRef.current.concat(peers)) {
      p.peer.destroy();
    }
    setPeers([]);
    peersRef.current = [];
  }, []);

  const handleJoinRoom = useCallback((roomID: string) => {
    socket?.emit("join_room", { roomID });
  }, []);

  const handleRoomDeleted = (deletedID: string) => {
    if (deletedID === roomID) leaveRoom();
  };

  const handleAllUsers = useCallback((ids: { sid: string; uid: string }[]) => {
    const peers: any[] = [];
    ids.forEach((ids) => {
      const peer = createPeer(ids.sid, String(socket?.id), userStream.current);
      peersRef.current.push({
        peerID: ids.sid,
        peerUID: ids.uid,
        peer,
      });
      cacheUserData(ids.uid);
      peers.push({ peer, peerID: ids.sid, peerUID: ids.uid });
    });
    setPeers(peers);
  }, []);

  const handleUserJoined = useCallback((payload: any) => {
    const peer = addPeer(payload.signal, payload.callerID, userStream.current);
    peersRef.current.push({
      peerID: payload.callerID,
      peerUID: payload.callerUID,
      peer,
    });
    const userData = findUserData(payload.callerUID);
    addMsg({
      msg: `${
        userData ? userData.name : payload.callerUID
      } joined the room at ${new Date().toTimeString()}`,
      author: "server",
      createdAt: new Date(),
    });
    setPeers((peers: any[]) => [
      ...peers,
      { peer, peerID: payload.callerID, peerUID: payload.callerUID },
    ]);
  }, []);

  const handleLeftRoom = useCallback((uid: string) => {
    const peerRef = peersRef.current.find((p) => p.peerUID === uid);
    if (typeof peerRef !== undefined) {
      peerRef?.peer.destroy();
    }
    const peerState = peers.find((p) => p.peerUID === uid);
    if (typeof peerState !== undefined) {
      peerState?.peer.destroy();
    }
    setPeers((peers) => peers.filter((p) => p.peerUID !== uid));
    peersRef.current = peersRef.current.filter(
      (p: PeerWithIDs) => p.peerUID !== uid
    );
    const userData = findUserData(uid);
    addMsg({
      msg: `${
        userData ? userData.name : uid
      } left the room at ${new Date().toTimeString()}`,
      author: "server",
      createdAt: new Date(),
    });
  }, []);

  const handleReceivingReturningSignal = useCallback((payload: any) => {
    const item = peersRef.current.find((p) => p.peerID === payload.id);
    item?.peer.signal(payload.signal);
  }, []);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then((stream) => {
        userStream.current = stream;
        userVideo.current.srcObject = stream;
        handleJoinRoom(String(roomID));
        socket?.on("all_users", handleAllUsers);
        socket?.on("user_joined", handleUserJoined);
        socket?.on("left_room", handleLeftRoom);
        socket?.on("receiving_returned_signal", handleReceivingReturningSignal);
      });

    socket?.on("server_msg_to_room", handleServerMsgToRoom);
    socket?.on("client_msg_to_room", handleClientMsgToRoom);
    socket?.on("room_deleted", handleRoomDeleted);

    return () => {
      socket?.off("all_users", handleAllUsers);
      socket?.off("user_joined", handleUserJoined);
      socket?.off("left_room", handleLeftRoom);
      socket?.off("receiving_returned_signal", handleReceivingReturningSignal);
      socket?.off("server_msg_to_room", handleServerMsgToRoom);
      socket?.off("client_msg_to_room", handleClientMsgToRoom);
      socket?.off("room_deleted", handleRoomDeleted);
    };
  }, []);

  const createPeer = (
    userToSignal: string,
    callerID: string,
    stream: MediaStream | undefined
  ) => {
    if (typeof stream === "undefined")
      console.warn("Media stream is undefined");
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });
    peer.on("signal", (signal) => {
      socket?.emit("sending_signal", { userToSignal, callerID, signal });
    });
    return peer;
  };

  const addPeer = (
    incomingSignal: Peer.SignalData,
    callerID: string,
    stream: MediaStream | undefined
  ) => {
    if (typeof stream === "undefined")
      console.warn("Media stream is undefined");
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });
    peer.on("signal", (signal) => {
      socket?.emit("returning_signal", { signal, callerID });
    });
    peer.signal(incomingSignal);
    return peer;
  };

  const Video = ({
    peer,
    userData,
  }: {
    peer: Peer.Instance;
    userData: IUser | undefined;
  }) => {
    const ref = useRef<HTMLVideoElement>(null);
    const [streaming, setStreaming] = useState(false);
    const handleStream = useCallback((stream: MediaStream) => {
      if (ref.current) {
        ref.current.srcObject = stream;
        setStreaming(true);
      }
    }, []);
    useEffect(() => {
      peer.on("stream", handleStream);
    }, [peer]);
    return (
      <div className={classes.container}>
        <video
          style={
            streaming ? { filter: "opacity(1)" } : { filter: "opacity(0)" }
          }
          autoPlay
          className={classes.video}
          ref={ref}
        />
        <ImSpinner8
          style={
            streaming ? { filter: "opacity(0)" } : { filter: "opacity(1)" }
          }
          className={classes.spinner}
        />
        <div className={classes.text}>{userData && userData.name}</div>
      </div>
    );
  };

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

  const msgFormRef = useRef<HTMLFormElement>(null);
  const msgsBtmRef = useRef<HTMLDivElement>(null);
  return (
    <div className={classes.container}>
      <div className={classes.chatWindow}>
        <div className={classes.messenger}>
          <div className={classes.list}>
            {messages &&
              messages.map((msg: any) => (
                <div
                  key={msg.author + msg.createdAt}
                  className={classes.message}
                >
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
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setMessageInput(e.target.value)
              }
              type="text"
              required
            />
            <MdSend onClick={() => msgFormRef.current?.requestSubmit()} />
          </form>
        </div>
        <div className={classes.videos}>
          <div className={classes.container}>
            <video
              style={
                userStream.current
                  ? { filter: "opacity(1)" }
                  : { filter: "opacity(0)" }
              }
              muted
              ref={userVideo}
              autoPlay
              playsInline
              className={classes.video}
            />
            <ImSpinner8
              style={
                userStream.current
                  ? { filter: "opacity(0)" }
                  : { filter: "opacity(1)" }
              }
              className={classes.spinner}
            />
          </div>
          {peers.map((peer: any) => (
            <Video
              userData={findUserData(peer.peerUID)}
              key={peer.peerID}
              peer={peer.peer}
            />
          ))}
        </div>
      </div>
      <div className={classes.controls}>
        <div className={classes.inner}>
          <button
            onClick={() => {
              leaveRoom();
              navigate("/rooms");
            }}
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;
