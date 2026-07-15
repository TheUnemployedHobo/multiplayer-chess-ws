import type { StockfishEngine } from "stockfish"

import { createEngine, subscribe } from "./stockfish-engine"

export { createEngine }

export const getBestMove = async (engine: StockfishEngine, fen: string, depth = 10) => {
  return new Promise<string>((resolve) => {
    const unsubscribe = subscribe(engine, (message) => {
      if (!message.startsWith("bestmove")) return

      unsubscribe()

      const [, move] = message.split(" ")

      if (move) resolve(move)
    })

    engine.sendCommand(`position fen ${fen}`)
    engine.sendCommand(`go depth ${depth}`)
  })
}
