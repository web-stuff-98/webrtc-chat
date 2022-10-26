import { IRoom, IRoomMsg, IUser } from "./interfaces/interfaces";

export interface ServerToClientEvents {
  /*noArg: () => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
  withAck: (d: string, callback: (e: number) => void) => void;*/
  resMsg: (data: { msg: string; err: boolean; pen: boolean }) => void;
  left_room: (uid: string) => void;
  navigate_join_room: (roomID: string) => void;
  server_msg_to_room: (msg: string) => void;
  client_msg_to_room: (data: IRoomMsg) => void;
  room_created: (data: IRoom) => void;

  // WebRTC stuff
  receiving_returned_signal: (data: { signal: any; id: string }) => void;
  user_joined: (data: {
    signal: any;
    callerID: string;
    callerUID: string;
  }) => void;
  sending_signal: (payload: any) => void;
  returning_signal: (payload: any) => void;
  all_users: (ids: { sid: string; uid: string }[]) => void;
}

export interface ClientToServerEvents {
  join_room: (data: { roomID: string }) => void;
  leave_room: () => void;
  other_user: (uid: string, socketID: string) => void;
  join_create_room: (data: { roomName: string }) => void;
  msg_to_room: (data: { msg: string; roomID: string }) => void;

  // WebRTC stuff
  sending_signal: (payload: any) => void;
  returning_signal: (payload: any) => void;
}

export interface InterServerEvents {
  navigate_to_room: (roomID: string) => void;
  server_msg_to_room: (data: IRoomMsg) => void;
  room_created: (r: IRoom) => void;
}

export interface SocketData {
  user: Partial<IUser>;
  auth: string;
}
