import { IUser } from "../../../../server/src/interfaces/interfaces";
import classes from "./Chat.module.scss";

import Peer from "simple-peer";
import { ImSpinner8 } from "react-icons/im";

import { useEffect, useState, useRef, useCallback } from "react";

export default function Video({
  peer,
  userData,
}: {
  peer: Peer.Instance;
  userData?: IUser;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [streaming, setStreaming] = useState(false);
  useEffect(() => {
    const handleStream = (stream: MediaStream) => {
      if (ref.current && stream) {
        ref.current.srcObject = stream;
        setStreaming(true);
      }
    }
    peer.on("stream", handleStream);
    return () => {
      peer.off("stream", handleStream)
    };
  }, []);
  return (
    <div className={classes.container}>
      <video
        style={streaming ? { filter: "opacity(1)" } : { filter: "opacity(0)" }}
        playsInline
        autoPlay
        className={classes.video}
        ref={ref}
      />
      <ImSpinner8
        style={streaming ? { filter: "opacity(0)" } : { filter: "opacity(1)" }}
        className={classes.spinner}
      />
      <div className={classes.text}>{userData && userData.name}</div>
    </div>
  );
}
