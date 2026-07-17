import type { Server } from "socket.io"

import { Game } from "js-chess-engine"
import db from "prisma/db"

export type AiLevelsType = 1 | 2 | 3 | 4 | 5
export type MovePayloadType = { from: string; to: string }

export const onlineUsers = new Map<string, { socketId: string; status: "online" | "playing" }>()
export const botGames = new Map<string, { game: Game; history: MovePayloadType[]; level: AiLevelsType }>()

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
