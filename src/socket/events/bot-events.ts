import type { Server, Socket } from "socket.io"

import { Game } from "js-chess-engine"

import { type AiLevelsType, botGames, type MovePayloadType, updateFriendStatus } from "../utils"

const registerBotEvents = (io: Server, socket: Socket) => {
  const { userId } = socket.data

  socket.on("bot:start", (skill: AiLevelsType) => {
    botGames.delete(socket.id)
    botGames.set(socket.id, { game: new Game(), history: [], level: skill })

    updateFriendStatus(io, userId, "playing")

    socket.emit("bot:start", undefined)
  })

  socket.on("bot:move", ({ from, to }: MovePayloadType) => {
    const instance = botGames.get(socket.id)
    if (!instance) return

    try {
      instance.game.move(from.toUpperCase(), to.toUpperCase())
      instance.history.push({ from: from.toUpperCase(), to: to.toUpperCase() })
    } catch {
      return
    }

    const playerBoard = instance.game.exportJson()
    if (playerBoard.isFinished) {
      socket.emit("bot:finished", undefined)
      botGames.delete(socket.id)
      updateFriendStatus(io, userId, "online")
      return
    }

    const { board, move } = instance.game.ai({ level: instance.level, randomness: 0 })

    const [entry] = Object.entries(move)
    if (!entry) return

    const [botFrom, botTo] = entry

    instance.history.push({ from: botFrom, to: botTo })
    socket.emit("bot:move", { from: botFrom.toLowerCase(), to: botTo.toLowerCase() })

    if (board.isFinished) {
      socket.emit("bot:finished", undefined)
      botGames.delete(socket.id)
      updateFriendStatus(io, userId, "online")
    }
  })

  socket.on("bot:resign", () => {
    botGames.delete(socket.id)
    updateFriendStatus(io, userId, "online")
    socket.emit("bot:resign", undefined)
  })

  socket.on("bot:undo", () => {
    const instance = botGames.get(socket.id)
    if (!instance) return

    instance.history.pop()
    instance.history.pop()

    const game = new Game()

    instance.history.forEach(({ from, to }) => game.move(from.toUpperCase(), to.toUpperCase()))

    instance.game = game

    socket.emit("bot:undo", undefined)
  })
}

export default registerBotEvents
