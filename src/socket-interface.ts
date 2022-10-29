import { IRoom, IRoomMsg, IUser } from "./interfaces/interfaces";

import AWS from "aws-sdk"

export interface ServerToClientEvents {
  resMsg: (data: { msg: string; err: boolean; pen: boolean }) => void;
  left_room: (uid: string) => void;
  navigate_join_room: (roomID: string) => void;
  server_msg_to_room: (msg: string) => void;
  client_msg_to_room: (data: IRoomMsg) => void;
  room_created: (data: IRoom) => void;
  room_deleted: (roomID: string) => void;
  account_deleted: () => void;
  attachment_progress: (data: { progress: number; msgID: string }) => void;
  attachment_failed: (msgID:string) => void;
  attachment_success: ({msgID, mimeType, ext}:{msgID:string, mimeType:string, ext:string}) => void;

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
  msg_to_room: (data: {
    msg: string;
    attachment?: "pending" | "failed" | "success";
  }) => void;
  delete_account: () => void;

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
