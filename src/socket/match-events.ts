import type { Server, Socket } from "socket.io"

import { matchmakingQueue } from "@/lib/storage"
import { createGame } from "@/lib/utils"

export default function registerMatchEvents(io: Server, socket: Socket) {
  const { userId } = socket.data

  socket.on("matchmaking:join", () => {
    if (matchmakingQueue.has(userId)) return

    matchmakingQueue.add(userId)

    if (matchmakingQueue.size < 2) return

    const [whiteId, blackId] = matchmakingQueue
    if (!whiteId || !blackId) return

    matchmakingQueue.delete(whiteId)
    matchmakingQueue.delete(blackId)

    createGame({ blackId, io, whiteId })
  })

  socket.on("matchmaking:leave", () => {
    matchmakingQueue.delete(userId)
    socket.emit("matchmaking:leave", undefined)
  })
}
