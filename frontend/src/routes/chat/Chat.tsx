import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";
import classes from "./Chat.module.scss";

import { ImSpinner8 } from "react-icons/im";

import {
  IParsedRoomMsg,
  IUser,
} from "../../../../server/src/interfaces/interfaces";

import Peer from "simple-peer";
import useAuth from "../../context/AuthContext";
import useUsers from "../../context/UserContext";
import Messenger from "./Messenger";
import Video from "./Video";

interface PeerWithIDs {
  peerID: string;
  peerUID: string;
  peer: Peer.Instance;
}

/*

https://dev.to/bravemaster619/how-to-use-socket-io-client-correctly-in-react-app-o65

 ^ This is the solution for React triggering multiple socket emit event problems



https://www.loginradius.com/blog/engineering/how-to-fix-memory-leaks-in-react/
 
 ^ Read this too....... try it on everything.

*/

function Chat() {
  const { socket } = useSocket();
  const { roomID } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const handleRoomDeleted = useCallback((deletedID: string) => {
    if (deletedID === roomID) leaveRoom();
  }, []);

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
    if (
      peersRef.current.find((p: PeerWithIDs) => p.peerID === payload.callerID)
    )
      return;
    cacheUserData(payload.callerUID);
    const peer = addPeer(payload.signal, payload.callerID, userStream.current);
    setPeers((peers: any[]) => [
      ...peers,
      { peer, peerID: payload.callerID, peerUID: payload.callerUID },
    ]);
    peersRef.current.push({
      peerID: payload.callerID,
      peerUID: payload.callerUID,
      peer,
    });
  }, []);

  const handleLeftRoom = useCallback((uid: string) => {
    if (uid === user.id) return;
    const peerRef = peersRef.current.find((p) => p.peerUID === uid);
    if (typeof peerRef !== undefined) {
      peerRef?.peer.destroy();
    }
    setPeers((peers) => peers.filter((p) => p.peerUID !== uid));
    peersRef.current = peersRef.current.filter(
      (p: PeerWithIDs) => p.peerUID !== uid
    );
  }, []);

  const handleReceivingReturningSignal = useCallback((payload: any) => {
    const item = peersRef.current.find((p) => p.peerID === payload.id);
    item?.peer.signal(payload.signal);
  }, []);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then((stream) => {
        if (userStream) userStream.current = stream;
        if (userVideo) userVideo.current.srcObject = stream;
        handleJoinRoom(String(roomID));
        socket?.on("all_users", handleAllUsers);
        socket?.on("user_joined", handleUserJoined);
        socket?.on("left_room", handleLeftRoom);
        socket?.on("receiving_returned_signal", handleReceivingReturningSignal);
      });

    socket?.on("room_deleted", handleRoomDeleted);

    return () => {
      socket?.off("all_users", handleAllUsers);
      socket?.off("user_joined", handleUserJoined);
      socket?.off("left_room", handleLeftRoom);
      socket?.off("receiving_returned_signal", handleReceivingReturningSignal);
      socket?.off("room_deleted", handleRoomDeleted);
      socket?.emit("leave_room");
    };
  }, []);

  const createPeer = useCallback(
    (
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
      peer.on("disconnect", () => {
        peer.destroy();
      });
      return peer;
    },
    []
  );

  const addPeer = useCallback(
    (
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
      peer.on("disconnect", () => {
        peer.destroy();
      });
      peer.signal(incomingSignal);
      return peer;
    },
    []
  );

  return (
    <div className={classes.container}>
      <div className={classes.chatWindow}>
        {peers.length} | {peersRef.current.length}
        <Messenger />
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
          {peers.map((peer: any, index: number) => (
            <Video
              userData={findUserData(peer.peerUID)}
              key={peer.peerUID}
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
