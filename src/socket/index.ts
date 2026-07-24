import type { Server } from "socket.io"

import { botGames, getActiveGamesByUserId, matchmakingQueue, onlineUsers, removeActiveGame } from "@/lib/storage"
import { recordMatchAndUpdateStats, updateFriendStatus } from "@/lib/utils"
import { validateSocketJwt } from "@/middlewares/custom"

import registerBotEvents from "./bot-events"
import registerChatEvents from "./chat-events"
import registerFriendEvents from "./friend-events"
import registerGameEvents from "./game-events"
import registerMatchEvents from "./match-events"
import registerUserEvents, { sendOnlineCount } from "./user-events"

export default function initiateSocketIO(io: Server) {
  io.use(validateSocketJwt)

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
      const game = getActiveGamesByUserId(userId)
      if (game) {
        const disconnectedColor = game.white.userId === userId ? "white" : "black"
        const winner = disconnectedColor === "white" ? "black" : "white"

        updateFriendStatus(io, game[winner].userId, "online")
        removeActiveGame({ blackId: game.black.userId, roomId: game.roomId, whiteId: game.white.userId })
        recordMatchAndUpdateStats(game.white.userId, game.black.userId, winner === "white" ? "win" : winner === "black" ? "loss" : "draw")
        recordMatchAndUpdateStats(game.black.userId, game.white.userId, winner === "black" ? "win" : winner === "white" ? "loss" : "draw")

        socket.to(game.roomId).emit("game:finish", { result: `${disconnectedColor} disconnected`, winner })
      }

      onlineUsers.delete(userId)
      botGames.delete(userId)
      matchmakingQueue.delete(userId)
      sendOnlineCount(io)
      updateFriendStatus(io, userId, undefined)
    })
  })
}
