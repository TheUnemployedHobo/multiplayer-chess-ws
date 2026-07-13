import type { Server } from "socket.io"

import { jwtHelper } from "@/lib/utils"

import friendsSocket from "./friends-socket"
import { friendStatusUpdate, onlineUsers, sendOnlineCount } from "./utilities"

const initiateSocketIO = (io: Server) => {
  io.use((socket, next) => {
    try {
      const { jwt } = socket.handshake.auth
      if (!jwt) return next(new Error("Unauthorized"))

      const { userId } = jwtHelper.verify(jwt)
      socket.data.userId = userId

      next()
    } catch {
      next(new Error("Unauthorized"))
    }
  })

  io.on("connection", (socket) => {
    const { userId } = socket.data

    onlineUsers.set(userId, { socketId: socket.id, status: "online" })

    sendOnlineCount(io)
    friendsSocket(io, socket)

    socket.on("disconnect", () => {
      onlineUsers.delete(userId)
      sendOnlineCount(io)
      friendStatusUpdate(io, userId, undefined)
    })
  })
}

export default initiateSocketIO
