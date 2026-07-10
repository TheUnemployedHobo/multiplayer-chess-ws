import type { Server } from "socket.io"

import { jwtHelper } from "@/lib/utils"

import friendsSocket from "./friends-socket"
import { onlineUsers } from "./storage"
import usersSocket from "./users-socket"

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

    onlineUsers.set(userId, socket.id)

    usersSocket(io, socket)
    friendsSocket(io, socket)

    socket.on("disconnect", () => {
      onlineUsers.delete(userId)
    })
  })
}

export default initiateSocketIO
