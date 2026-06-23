import { getEngine, subscribe } from "./stockfish-engine"

export const getBestMove = async (fen: string, depth = 10) => {
  const engine = await getEngine()

  return new Promise<string>((resolve) => {
    const unsubscribe = subscribe((message) => {
      if (!message.startsWith("bestmove")) return

      unsubscribe()

      const [, move] = message.split(" ")

      if (move) resolve(move)
    })

    engine.sendCommand(`position fen ${fen}`)
    engine.sendCommand(`go depth ${depth}`)
  })
}
