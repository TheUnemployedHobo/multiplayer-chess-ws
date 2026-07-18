import type { Server } from "socket.io"

import { jwtHelper } from "@/lib/utils"

import registerBotEvents from "./events/bot-events"
import registerFriendEvents from "./events/friend-events"
import registerUserEvents from "./events/user-events"
import { botGames, onlineUsers, sendOnlineCount, updateFriendStatus } from "./utils"

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

    registerUserEvents(io, socket)
    registerFriendEvents(io, socket)
    registerBotEvents(io, socket)

    socket.on("disconnect", () => {
      onlineUsers.delete(userId)
      botGames.delete(userId)
      sendOnlineCount(io)
      updateFriendStatus(io, userId, undefined)
    })
  })
}

export default initiateSocketIO
