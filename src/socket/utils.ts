import type { Chess } from "chess.js"
import type { Server } from "socket.io"

import { Game } from "js-chess-engine"
import db from "prisma/db"

export type AiLevelsType = 1 | 2 | 3 | 4 | 5

type UserIds = { socketId: string; userId: string }

export const onlineUsers = new Map<string, { socketId: string; status: "online" | "playing" }>()
export const botGames = new Map<string, { chess: Chess; engine: Game; level: AiLevelsType }>()
export const activeGames = new Map<string, { black: UserIds; chess: Chess; roomId: string; white: UserIds }>()
export const playerRooms = new Map<string, string>()
export const matchmakingQueue = new Set<string>()

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

export const determineGameResult = (options: Partial<{ chess: Chess; result: string; winner: "Black" | "White" }>) => {
  const { chess, result, winner } = options

  if (!chess) return { result, winner: winner ?? null }

  if (chess.isCheckmate()) return { result: "Checkmate", winner: chess.turn() === "w" ? "Black" : "White" }
  if (chess.isStalemate()) return { result: "Stalemate", winner: null }
  if (chess.isInsufficientMaterial()) return { result: "Insufficient material", winner: null }
  if (chess.isThreefoldRepetition()) return { result: "Three fold repetition", winner: null }
  if (chess.isDrawByFiftyMoves()) return { result: "50 move rule", winner: null }

  return null
}

export const createRoomId = () => crypto.randomUUID()
