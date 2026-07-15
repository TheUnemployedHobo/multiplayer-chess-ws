import type { Chess } from "chess.js"
import type { Server, Socket } from "socket.io"
import type { StockfishEngine } from "stockfish"

import db from "prisma/db"

export const onlineUsers = new Map<string, { socketId: string; status: "online" | "playing" }>()
export const botGames = new Map<string, { chess: Chess; engine: StockfishEngine }>()

export const updateFriendStatus = async (io: Server, userId: string, status: "online" | "playing" | undefined) => {
  try {
    const friends = await db.friend.findMany({
      select: { friendId: true },
      where: { userId },
    })

    friends.forEach(({ friendId }) => {
      const onlineFriend = onlineUsers.get(friendId)
      if (onlineFriend) io.to(onlineFriend.socketId).emit("friends:status", { status, userId })
    })
  } catch (err) {
    console.error(err)
  }
}

export const sendOnlineCount = (io: Server) => io.emit("users:online-count", onlineUsers.size)

export const deleteBotGameInstance = (socket: Socket) => {
  const game = botGames.get(socket.id)
  if (!game) return

  game.engine.terminate()
  botGames.delete(socket.id)
}
