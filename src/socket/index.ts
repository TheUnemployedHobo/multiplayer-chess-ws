import type { Server } from "socket.io"

import { botGames, matchmakingQueue, onlineUsers, playerRooms } from "@/lib/storage"
import { jwtHelper } from "@/lib/utils"
import { sendOnlineCount, updateFriendStatus } from "@/lib/utils"

import registerBotEvents from "./bot-events"
import registerChatEvents from "./chat-events"
import registerFriendEvents from "./friend-events"
import registerGameEvents from "./game-events"
import registerMatchEvents from "./match-events"
import registerUserEvents from "./user-events"

export default function initiateSocketIO(io: Server) {
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
    registerMatchEvents(io, socket)
    registerGameEvents(io, socket)
    registerChatEvents(io, socket)

    socket.on("disconnect", () => {
      onlineUsers.delete(userId)
      botGames.delete(userId)
      matchmakingQueue.delete(userId)
      playerRooms.delete(userId)
      sendOnlineCount(io)
      updateFriendStatus(io, userId, undefined)
    })
  })
}
