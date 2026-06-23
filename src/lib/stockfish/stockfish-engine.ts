import Stockfish from "stockfish"

let engine: Awaited<ReturnType<typeof Stockfish>>

const listeners = new Set<(message: string) => void>()

export const getEngine = async () => {
  if (engine) return engine

  engine = await Stockfish()

  engine.print = (message: string) => listeners.forEach((listener) => listener(message))

  return engine
}

export const subscribe = (listener: (message: string) => void) => {
  listeners.add(listener)

  return () => listeners.delete(listener)
}
