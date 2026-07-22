import type { Server, Socket } from "socket.io"

import { Chess, type PieceSymbol } from "chess.js"
import { Game } from "js-chess-engine"

import { type AiLevelsType, botGames } from "@/lib/storage"
import { determineGameResult, updateFriendStatus } from "@/lib/utils"

const registerBotEvents = (io: Server, socket: Socket) => {
  const { userId } = socket.data

  socket.on("bot:start", (skill: AiLevelsType) => {
    botGames.set(userId, { chess: new Chess(), engine: new Game(), level: skill })
    updateFriendStatus(io, userId, "playing")
    socket.emit("bot:start", undefined)
  })

  socket.on("bot:move", ({ from, promotion, to }: { from: string; promotion: string; to: string }) => {
    const instance = botGames.get(userId)
    if (!instance) return

    if (!instance.chess.move({ from, promotion, to })) return

    instance.engine.move(from.toUpperCase(), to.toUpperCase())

    if (promotion && promotion !== "q") instance.engine.setPiece(to.toUpperCase(), promotion.toUpperCase() as PieceSymbol)

    if (instance.chess.isGameOver()) {
      botGames.delete(userId)
      updateFriendStatus(io, userId, "online")
      socket.emit("bot:finished", determineGameResult(instance.chess))
      return
    }

    const { move } = instance.engine.ai({ level: instance.level, randomness: 0 })

    const [entry] = Object.entries(move)

    const [botFrom, botTo] = entry!

    instance.chess.move({ from: botFrom.toLowerCase(), promotion: "q", to: botTo.toLowerCase() })

    socket.emit("bot:move", { from: botFrom.toLowerCase(), to: botTo.toLowerCase() })

    if (instance.chess.isGameOver()) {
      botGames.delete(userId)
      updateFriendStatus(io, userId, "online")
      socket.emit("bot:finished", determineGameResult(instance.chess))
    }
  })

  socket.on("bot:resign", () => {
    socket.emit("bot:resign", { result: "You resigned", winner: "Black" })
    updateFriendStatus(io, userId, "online")
    botGames.delete(userId)
  })

  socket.on("bot:undo", () => {
    const instance = botGames.get(userId)
    if (!instance) return

    instance.chess.undo()
    instance.chess.undo()

    const engine = new Game()

    instance.chess.history({ verbose: true }).forEach(({ from, to }) => engine.move(from.toUpperCase(), to.toUpperCase()))

    instance.engine = engine

    socket.emit("bot:undo", undefined)
  })
}

export default registerBotEvents
