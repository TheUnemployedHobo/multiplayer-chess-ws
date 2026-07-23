import type { Server, Socket } from "socket.io"

import { activeGames, getActiveGamesByUserId, playerRooms } from "@/lib/storage"
import { determineGameResult, updateFriendStatus } from "@/lib/utils"

export default function registerGameEvents(io: Server, socket: Socket) {
  const { userId } = socket.data

  socket.on("game:move", ({ from, promotion, to }: { from: string; promotion: string; to: string }) => {
    const game = getActiveGamesByUserId(userId)
    if (!game) return

    const color = game.chess.turn()

    if (color === "w" && game.white.userId !== userId) return
    if (color === "b" && game.black.userId !== userId) return

    const move = game.chess.move({ from, promotion, to })
    if (!move) return

    socket.to(game.roomId).emit("game:move", { from: move.from, promotion: move.promotion, to: move.to })

    const result = determineGameResult(game.chess)
    if (!result) return

    activeGames.delete(game.roomId)
    playerRooms.delete(game.white.userId)
    playerRooms.delete(game.black.userId)

    updateFriendStatus(io, game.white.userId, "online")
    updateFriendStatus(io, game.black.userId, "online")

    io.to(game.roomId).emit("game:finished", result)
  })

  socket.on("game:resign", () => {
    const game = getActiveGamesByUserId(userId)
    if (!game) return

    const resignedColor = game.white.userId === userId ? "White" : "Black"
    const winner = resignedColor === "White" ? "Black" : "White"

    activeGames.delete(game.roomId)
    playerRooms.delete(game.white.userId)
    playerRooms.delete(game.black.userId)

    updateFriendStatus(io, game.white.userId, "online")
    updateFriendStatus(io, game.black.userId, "online")

    io.to(game.roomId).emit("game:resign", { result: `${resignedColor} resigned`, winner })
  })

  socket.on("game:draw-offer", () => {
    const game = getActiveGamesByUserId(userId)
    if (!game) return

    const offerorColor = game.white.userId === userId ? "white" : "black"
    const offereeColor = offerorColor === "white" ? "black" : "white"

    socket.emit("game:draw-offer", { message: `Draw offer sent to ${offereeColor}`, offerRole: "offeror" })
    socket.to(game[offereeColor].socketId).emit("game:draw-offer", { message: `${offerorColor} offered a draw`, offerRole: "offeree" })
  })

  socket.on("game:draw-offer:decline", () => {
    const game = getActiveGamesByUserId(userId)
    if (!game) return

    const declinerColor = game.white.userId === userId ? "white" : "black"
    const offerorColor = declinerColor === "white" ? "black" : "white"

    socket.emit("game:draw-offer:decline", "You declined the draw offer")
    socket.to(game[offerorColor].socketId).emit("game:draw-offer:decline", `${declinerColor} declined your draw offer`)
  })

  socket.on("game:draw-offer:accept", () => {
    const game = getActiveGamesByUserId(userId)
    if (!game) return

    const acceptorColor = game.white.userId === userId ? "white" : "black"
    const offerorColor = acceptorColor === "white" ? "black" : "white"

    activeGames.delete(game.roomId)
    playerRooms.delete(game.white.userId)
    playerRooms.delete(game.black.userId)

    updateFriendStatus(io, game.white.userId, "online")
    updateFriendStatus(io, game.black.userId, "online")

    socket.emit("game:draw-offer:accept", undefined)
    socket.to(game[offerorColor].socketId).emit("game:draw-offer:accept", undefined)
  })
}
