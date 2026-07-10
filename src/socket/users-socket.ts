import type { Server, Socket } from "socket.io"

import { onlineUsers } from "./storage"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const usersSocket = (io: Server, socket: Socket) => {
  io.emit("users:online-count", onlineUsers.size)
}

export default usersSocket
