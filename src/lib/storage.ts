import type { Chess } from "chess.js"
import type { Game } from "js-chess-engine"

export type AiLevelsType = 1 | 2 | 3 | 4 | 5

type UserIds = { socketId: string; userId: string }

export const onlineUsers = new Map<string, { socketId: string; status: "online" | "playing" }>()
export const botGames = new Map<string, { chess: Chess; engine: Game; level: AiLevelsType }>()
export const activeGames = new Map<string, { black: UserIds; chess: Chess; white: UserIds }>()
export const playerRooms = new Map<string, string>()
export const matchmakingQueue = new Set<string>()

export const getActiveGamesByUserId = (userId: string) => {
  const roomId = playerRooms.get(userId)
  if (!roomId) return null

  const game = activeGames.get(roomId)
  if (!game) return null

  return { roomId, ...game }
}

export const removeActiveGame = (game: { blackId: string; roomId: string; whiteId: string }) => {
  activeGames.delete(game.roomId)
  playerRooms.delete(game.whiteId)
  playerRooms.delete(game.blackId)
}
