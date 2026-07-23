import type { Server, Socket } from "socket.io"

import { onlineUsers } from "@/lib/storage"

export const sendOnlineCount = (io: Server) => io.emit("users:online-count", onlineUsers.size)

export default function registerUserEvents(io: Server, socket: Socket) {
  socket.on("users:online-count", () => sendOnlineCount(io))
}
