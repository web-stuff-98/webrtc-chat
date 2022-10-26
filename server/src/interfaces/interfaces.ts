export interface IUser {
  id: string;
  name: string;
  password?: string;
  pfp?: string;
  token?:string;
}
export interface IResMsg {
    msg:string
    err:boolean
    pen:boolean
}
export interface IRoomMsg {
  msg: string
  author: string
  createdAt: string
}
export interface IParsedRoomMsg {
  msg: string
  author: string
  createdAt: Date
}
export interface IRoom {
  name:string
  author:string
  createdAt:string
  id:string
}