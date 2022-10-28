import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";
import classes from "./Chat.module.scss";

import { ImSpinner8 } from "react-icons/im";

import Peer from "simple-peer";
import useAuth from "../../context/AuthContext";
import useUsers from "../../context/UserContext";
import Messenger from "./Messenger";
import Video from "./Video";

//This is how you fix it... found out after trying for nearly a week.
import * as process from 'process';
(window as any).process = process;

interface PeerWithIDs {
  peerID: string;
  peerUID: string;
  peer: Peer.Instance;
}

/*
https://dev.to/bravemaster619/how-to-use-socket-io-client-correctly-in-react-app-o65
https://www.loginradius.com/blog/engineering/how-to-fix-memory-leaks-in-react/

 ^ doesn't help
   ////////////
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

  const leaveRoom = () => {
    for (const p of peersRef.current) {
      p.peer.destroy();
    }
    socket?.emit("leave_room");
    peersRef.current = []
    setPeers([])
  };

  const handleJoinRoom = (roomID: string) => {
    console.log("Join room");
    socket?.emit("join_room", { roomID });
  };

  const handleRoomDeleted = (deletedID: string) => {
    if (deletedID === roomID) leaveRoom();
  };

  const handleAllUsers = (ids: { sid: string; uid: string }[]) => {
    const peers: any[] = [];
    console.log("all_users, ids : " + JSON.stringify(ids));
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
  };

  const handleUserJoined = (payload: any) => {
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
  };
  const handleLeftRoom = (uid: string) => {
    console.log(`${uid} left the room`);
    const peerRef = peersRef.current.find((p) => p.peerUID === uid);
    peerRef?.peer.destroy();
    setPeers((peers) => peers.filter((p) => p.peerUID !== uid));
    peersRef.current = peersRef.current.filter(
      (p: PeerWithIDs) => p.peerUID !== uid
    );
  };

  const handleReceivingReturningSignal = (payload: any) => {
    console.log("Receiving returning signal, payload id : " + payload.id);
    const item = peersRef.current.find((p) => p.peerID === payload.id);
    item?.peer.signal(payload.signal);
  };

  const init = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      userStream.current = stream;
      userVideo.current.srcObject = stream;
      handleJoinRoom(String(roomID));
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    let abortController = new AbortController();

    if (!userStream.current) init();

    socket?.on("all_users", handleAllUsers);
    socket?.on("user_joined", handleUserJoined);
    socket?.on("left_room", handleLeftRoom);
    socket?.on("receiving_returned_signal", handleReceivingReturningSignal);
    socket?.on("room_deleted", handleRoomDeleted);

    return () => {
      socket?.off("all_users", handleAllUsers);
      socket?.off("user_joined", handleUserJoined);
      socket?.off("left_room", handleLeftRoom);
      socket?.off("receiving_returned_signal", handleReceivingReturningSignal);
      socket?.off("room_deleted", handleRoomDeleted);
      socket?.emit("leave_room");

      abortController.abort();
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
      console.log("Created peer, sending signal to " + userToSignal);
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
      console.log("Added peer, returning signal");
      socket?.emit("returning_signal", { signal, callerID });
    });
    peer.signal(incomingSignal);
    return peer;
  };

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
