import classes from "./Rooms.module.scss";

import { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { BsDoorOpen } from "react-icons/bs";
import { useSocket } from "../../context/SocketContext";
import useAuth from "../../context/AuthContext";
import { IRoom, IUser } from "../../interfaces/interfaces";
import useUsers from "../../context/UserContext";

export default function Rooms() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user } = useAuth();
  const { cacheUserData, findUserData } = useUsers();

  const [roomInput, setRoomInput] = useState("");
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    socket?.emit("join_create_room", {
      roomName: roomInput,
    });
  };

  const navToRoom = (roomID: string) => {
    navigate(`/chat/${roomID}`);
  };

  const handleRoomCreated = (r: IRoom) => {
    setRooms((old) => {
      cacheUserData(r.author);
      return [...old, r];
    });
  };
  const handleRoomDeleted = (id: string) => {
    setRooms((old) => old.filter((r) => r.id !== id));
  };

  const [rooms, setRooms] = useState<IRoom[]>([]);
  const getRooms = async () => {
    try {
      const res = await fetch(`${process.env.NODE_ENV === "development" ? "http://localhost:5000" : ""}/api/rooms`, {
        method: "GET",
        headers: {
          "Content-type": "application/json",
          authorization: `Bearer ${user.token}`,
        },
      });
      const json = await res.json();
      if (res.ok) {
        setRooms(json);
        let uids: string[] = [];
        for (const r of json) {
          if (!uids.includes(r.author)) uids.push(r.author);
        }
        await Promise.all(uids.map((uid: string) => cacheUserData(uid)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    let abort = new AbortController();
    getRooms();
    return () => {
      abort.abort();
    };
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("room_created", handleRoomCreated);
      socket.on("room_deleted", handleRoomDeleted);
      socket.on("navigate_join_room", navToRoom);
      return () => {
        socket.off("room_created", handleRoomCreated);
        socket.off("room_deleted", handleRoomDeleted);
        socket.off("navigate_join_room", navToRoom);
      };
    }
  }, []);

  const renderRoom = (authorData: IUser | undefined, room: IRoom) => {
    return (
      <>
        <div className={classes.name}>{room.name}</div>
        <div className={classes.timeAuthor}>
          created {new Date(room.createdAt).toDateString()} by
          {authorData && " " + authorData.name}
        </div>
        <div className={classes.options}>
          <span
            onClick={() => {
              navigate(`/chat/${room.id}`);
            }}
            className={classes.joinIconContainer}
          >
            <BsDoorOpen />
          </span>
        </div>
      </>
    );
  };

  return (
    <div className={classes.container}>
      <div className={classes.roomList}>
        {rooms &&
          rooms.map((room: any) => (
            <div key={room.id} className={classes.room}>
              {renderRoom(findUserData(room.author), room)}
            </div>
          ))}
      </div>
      <div className={classes.inputControls}>
        <form onSubmit={handleSubmit} className={classes.inner}>
          <input
            value={roomInput}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setRoomInput(e.target.value)
            }
            type="text"
          />
          <button type="submit">Join / Create</button>
        </form>
      </div>
    </div>
  );
}
