import type { Socket } from "socket.io"

import { Game } from "js-chess-engine"

import { botGames } from "../utils"

type MovePayload = { from: string; to: string }

const registerBotEvents = (socket: Socket) => {
  socket.on("bot:start", (skill: 1 | 2 | 3 | 4 | 5) => {
    botGames.delete(socket.id)
    botGames.set(socket.id, { game: new Game(), level: skill })

    socket.emit("bot:start", undefined)
  })

  socket.on("bot:move", ({ from, to }: MovePayload) => {
    const instance = botGames.get(socket.id)
    if (!instance) return

    try {
      instance.game.move(from.toUpperCase(), to.toUpperCase())
    } catch {
      return
    }

    const playerBoard = instance.game.exportJson()
    if (playerBoard.checkMate || playerBoard.staleMate || playerBoard.halfMove >= 100) {
      socket.emit("bot:finished", playerBoard)
      botGames.delete(socket.id)
      return
    }

    const { board, move } = instance.game.ai({ level: instance.level })

    const [entry] = Object.entries(move)
    if (!entry) return

    const [botFrom, botTo] = entry

    socket.emit("bot:move", {
      from: botFrom.toLowerCase(),
      to: botTo.toLowerCase(),
    })

    if (board.checkMate || board.staleMate || board.halfMove >= 100) {
      socket.emit("bot:finished", board)
      botGames.delete(socket.id)
    }
  })

  socket.on("bot:resign", () => {
    botGames.delete(socket.id)
    socket.emit("bot:finished", undefined)
  })
}

export default registerBotEvents
