import type { Socket } from "socket.io"

import { Chess } from "chess.js"

import { createEngine } from "@/lib/stockfish"

import { botGames } from "./utils"

const registerBotEvents = (socket: Socket) => {
  socket.on("bot:start", async (difficulty) => {
    const chess = new Chess()
    const engine = await createEngine()

    engine.sendCommand(`setoption name Skill Level value ${difficulty}`)
    engine.sendCommand("ucinewgame")

    botGames.set(socket.id, { chess, engine })
  })
  socket.on("bot:move", () => {})
  socket.on("bot:resign", () => {})
}

export default registerBotEvents
