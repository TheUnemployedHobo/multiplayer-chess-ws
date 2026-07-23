import type { Server, Socket } from "socket.io"

import { sendOnlineCount } from "@/lib/utils"

export default function registerUserEvents(io: Server, socket: Socket) {
  socket.on("users:online-count", () => {
    sendOnlineCount(io)
  })
}
