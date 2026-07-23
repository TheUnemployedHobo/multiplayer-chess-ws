import type { Server, Socket } from "socket.io"

import { getActiveGamesByUserId } from "@/lib/storage"

export default function registerChatEvents(io: Server, socket: Socket) {
  const { userId } = socket.data

  socket.on("game:chat", (message: string) => {
    message = message.trim()
    if (!message || message.length > 100) return

    const game = getActiveGamesByUserId(userId)
    if (!game) return

    const color = game.white.userId === userId ? "white" : "black"

    io.to(game.roomId).emit("game:chat", { color, message })
  })
}
