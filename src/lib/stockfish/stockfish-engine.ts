import Stockfish, { type StockfishEngine } from "stockfish"

export const createEngine = async () => {
  const engine = await Stockfish()

  engine.sendCommand("uci")
  engine.sendCommand("isready")

  return engine
}

export const subscribe = (engine: StockfishEngine, listener: (message: string) => void) => {
  const previous = engine.print

  engine.print = (message) => {
    previous?.(message)
    listener(message)
  }

  return () => {
    engine.print = previous ?? (() => {})
  }
}
