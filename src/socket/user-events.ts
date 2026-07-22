import type { Server, Socket } from "socket.io"

import { sendOnlineCount } from "@/lib/utils"

const registerUserEvents = (io: Server, socket: Socket) => {
  socket.on("users:online-count", () => {
    sendOnlineCount(io)
  })
}

export default registerUserEvents
