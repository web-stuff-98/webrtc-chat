import classes from "./Rooms.module.scss";

import { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { BsDoorOpen } from "react-icons/bs";
import { useSocket } from "../../context/SocketContext";
import useAuth from "../../context/AuthContext";
import { IRoom, IUser } from "../../../../server/src/interfaces/interfaces";
import useUsers from "../../context/UserContext";

export default function Rooms() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user } = useAuth();
  const { cacheUserData } = useUsers();

  const [roomInput, setRoomInput] = useState("");
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    socket?.emit("join_create_room", {
      roomName: roomInput,
    });
  };

  const navToRoom = (roomID:string) => {
    navigate(`/chat/${roomID}`);
  }

  useEffect(() => {
    if (!socket) return;
    socket
      .on("navigate_join_room", navToRoom);
    return () => {
      socket.off("navigate_join_room", navToRoom)
    }
  }, [socket]);

  const handleRoomCreated = (r: IRoom) => {
    setRooms((old) => [...old, r]);
  };
  const [rooms, setRooms] = useState<IRoom[]>([]);
  const getRooms = async () => {
    try {
      const res = await fetch("http://localhost:5000/rooms", {
        method: "GET",
        headers: {
          "Content-type": "application/json",
          authorization: `Bearer ${user.token}`,
        },
      });
      const json = await res.json();
      if (res.ok) {
        setRooms(json);
        for (const r of json) {
          cacheUserData(r.author);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const getRoomsInterval = setInterval(() => {
      getRooms();
    }, 5000);
    getRooms();
    return () => {
      clearInterval(getRoomsInterval);
    };
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("room_created", handleRoomCreated);
      return () => {
        socket.off("room_created", handleRoomCreated);
      };
    }
  }, []);

  return (
    <div className={classes.container}>
      <div className={classes.roomList}>
        {rooms &&
          rooms.map((room: any) => (
            <div key={room.id} className={classes.room}>
              <div className={classes.name}>{room.name}</div>
              <div className={classes.timeAuthor}>
                created {new Date(room.createdAt).toDateString()} by{" "}
                {room.author}
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
