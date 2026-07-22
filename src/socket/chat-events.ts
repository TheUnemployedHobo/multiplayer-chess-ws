import type { Server, Socket } from "socket.io"

import { activeGames, playerRooms } from "@/lib/storage"

const registerChatEvents = (io: Server, socket: Socket) => {
  const { userId } = socket.data

  socket.on("game:chat", (message: string) => {
    message = message.trim()
    if (!message || message.length > 100) return

    const roomId = playerRooms.get(userId)
    if (!roomId) return

    const game = activeGames.get(roomId)
    if (!game) return

    const color = game.white.userId === userId ? "white" : "black"

    io.to(roomId).emit("game:chat", { color, message })
  })
}

export default registerChatEvents
