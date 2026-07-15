import type { Socket } from "socket.io"

import { Chess, type PieceSymbol, type Square } from "chess.js"

import { createEngine, getBestMove } from "@/lib/stockfish"

import { botGames } from "../utils"

type MovePayload = { from: Square; promotion?: PieceSymbol; to: Square }

const registerBotEvents = (socket: Socket) => {
  socket.on("bot:start", async (skill: number) => {
    const existingGame = botGames.get(socket.id)

    if (existingGame) {
      existingGame.engine.terminate()
      botGames.delete(socket.id)
    }

    const chess = new Chess()
    const engine = await createEngine()

    engine.sendCommand(`setoption name Skill Level value ${skill}`)
    engine.sendCommand("ucinewgame")

    botGames.set(socket.id, { chess, engine })

    socket.emit("bot:start", undefined)
  })

  socket.on("bot:move", async ({ from, promotion, to }: MovePayload) => {
    const game = botGames.get(socket.id)
    if (!game) return

    const playerMove = game.chess.move(promotion ? { from, promotion, to } : { from, to })
    if (!playerMove) return

    if (game.chess.isGameOver()) {
      socket.emit("bot:finished", undefined)
      return
    }

    const bestMove = await getBestMove(game.engine, game.chess.fen())

    const botFrom = bestMove.slice(0, 2) as Square
    const botTo = bestMove.slice(2, 4) as Square
    const botPromotion = bestMove.length === 5 ? (bestMove[4] as PieceSymbol) : undefined

    const botMove = game.chess.move(
      botPromotion ? { from: botFrom, promotion: botPromotion, to: botTo } : { from: botFrom, to: botTo },
    )
    if (!botMove) return

    socket.emit("bot:move", { from: botFrom, promotion: botPromotion, to: botTo })

    if (game.chess.isGameOver()) socket.emit("bot:finished", undefined)
  })

  socket.on("bot:resign", () => {})
}

export default registerBotEvents
