import type { Server, Socket } from "socket.io"

import { activeGames, getActiveGamesByUserId, playerRooms } from "@/lib/storage"
import { determineGameResult, recordMatchAndUpdateStats, updateFriendStatus } from "@/lib/utils"

export default function registerGameEvents(io: Server, socket: Socket) {
  const { userId } = socket.data

  const finishGame = (game: { blackId: string; roomId: string; whiteId: string; winner: null | string }) => {
    activeGames.delete(game.roomId)
    playerRooms.delete(game.whiteId)
    playerRooms.delete(game.blackId)
    updateFriendStatus(io, game.whiteId, "online")
    updateFriendStatus(io, game.blackId, "online")
    recordMatchAndUpdateStats(game.whiteId, game.blackId, game.winner === "white" ? "win" : game.winner === "black" ? "loss" : "draw")
    recordMatchAndUpdateStats(game.blackId, game.whiteId, game.winner === "black" ? "win" : game.winner === "white" ? "loss" : "draw")
  }

  socket.on("game:move", ({ from, promotion, to }: { from: string; promotion: string; to: string }) => {
    const game = getActiveGamesByUserId(userId)
    if (!game) return

    if (game.chess.turn() === "w" && game.white.userId !== userId) return
    if (game.chess.turn() === "b" && game.black.userId !== userId) return

    const move = game.chess.move({ from, promotion, to })
    if (!move) return

    socket.to(game.roomId).emit("game:move", { from: move.from, promotion: move.promotion, to: move.to })

    const result = determineGameResult(game.chess)
    if (!result) return

    finishGame({ blackId: game.black.userId, roomId: game.roomId, whiteId: game.white.userId, winner: result.winner })

    io.to(game.roomId).emit("game:finish", result)
  })

  socket.on("game:resign", () => {
    const game = getActiveGamesByUserId(userId)
    if (!game) return

    const resignedColor = game.white.userId === userId ? "white" : "black"
    const winner = resignedColor === "white" ? "black" : "white"

    finishGame({ blackId: game.black.userId, roomId: game.roomId, whiteId: game.white.userId, winner })

    io.to(game.roomId).emit("game:finish", { result: `${resignedColor} resigned`, winner })
  })

  socket.on("game:draw-offer", () => {
    const game = getActiveGamesByUserId(userId)
    if (!game) return

    const offerorColor = game.white.userId === userId ? "white" : "black"
    const offereeColor = offerorColor === "white" ? "black" : "white"

    socket.emit("game:draw-offer", { message: `Draw offer sent to ${offereeColor}`, role: "offeror" })
    socket.to(game[offereeColor].socketId).emit("game:draw-offer", { message: `${offerorColor} offered a draw`, role: "offeree" })
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

    finishGame({ blackId: game.black.userId, roomId: game.roomId, whiteId: game.white.userId, winner: null })

    socket.emit("game:draw-offer:accept", undefined)
    socket.to(game[offerorColor].socketId).emit("game:draw-offer:accept", undefined)
  })
}
