import type { Server, Socket } from "socket.io"

import { Chess } from "chess.js"
import db from "prisma/db"

import { activeGames, matchmakingQueue, onlineUsers, playerRooms, updateFriendStatus } from "../utils"

const registerMatchEvents = (io: Server, socket: Socket) => {
  const { userId } = socket.data

  socket.on("matchmaking:join", async () => {
    if (matchmakingQueue.has(userId)) return

    matchmakingQueue.add(userId)

    if (matchmakingQueue.size < 2) return

    const [whiteId, blackId] = matchmakingQueue
    if (!whiteId || !blackId) return

    matchmakingQueue.delete(whiteId)
    matchmakingQueue.delete(blackId)

    const whiteSocket = onlineUsers.get(whiteId)
    const blackSocket = onlineUsers.get(blackId)
    if (!whiteSocket || !blackSocket) return

    const roomId = crypto.randomUUID()

    io.sockets.sockets.get(whiteSocket.socketId)?.join(roomId)
    io.sockets.sockets.get(blackSocket.socketId)?.join(roomId)

    playerRooms.set(whiteId, roomId)
    playerRooms.set(blackId, roomId)

    activeGames.set(roomId, {
      black: { socketId: blackSocket.socketId, userId: blackId },
      chess: new Chess(),
      roomId,
      white: { socketId: whiteSocket.socketId, userId: whiteId },
    })

    updateFriendStatus(io, whiteId, "playing")
    updateFriendStatus(io, blackId, "playing")

    const [whiteUser, blackUser] = await db.$transaction([
      db.user.findUnique({
        select: { avatar: true, id: true, stats: { select: { elo: true } }, username: true },
        where: { id: whiteId },
      }),
      db.user.findUnique({
        select: { avatar: true, id: true, stats: { select: { elo: true } }, username: true },
        where: { id: blackId },
      }),
    ])

    if (!whiteUser || !blackUser) {
      io.in(roomId).socketsLeave(roomId)
      activeGames.delete(roomId)
      playerRooms.delete(whiteId)
      playerRooms.delete(blackId)
      return
    }

    io.to(whiteSocket.socketId).emit("matchmaking:join", {
      avatar: blackUser.avatar,
      color: "white",
      elo: blackUser.stats.elo,
      username: blackUser.username,
    })

    io.to(blackSocket.socketId).emit("matchmaking:join", {
      avatar: whiteUser.avatar,
      color: "black",
      elo: whiteUser.stats.elo,
      username: whiteUser.username,
    })
  })

  socket.on("matchmaking:leave", () => {
    matchmakingQueue.delete(userId)
    socket.emit("matchmaking:leave", undefined)
  })
}

export default registerMatchEvents
