import type { Server } from "socket.io"

import { jwtHelper } from "@/lib/utils"

import { onlineUsers } from "./storage"

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

    console.info(`${userId} connected`)
    onlineUsers.add(userId)

    io.emit("users:online-count", onlineUsers.size)

    socket.on("disconnect", (reason) => {
      onlineUsers.delete(userId)
      console.info(`${userId} disconnected: ${reason}`)
    })
  })
}

export default initiateSocketIO
