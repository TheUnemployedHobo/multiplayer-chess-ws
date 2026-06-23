declare module "stockfish" {
  export type StockfishEngine = {
    print?: (message: string) => void
    printErr?: (message: string) => void
    sendCommand: (command: string) => void
    terminate: () => void
  }

  export default function Stockfish(): Promise<StockfishEngine>
}
