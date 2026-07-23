import "dotenv/config"
import type { Server } from "socket.io"

import { Chess } from "chess.js"
import jwt from "jsonwebtoken"
import db from "prisma/db"

import { activeGames, onlineUsers, playerRooms } from "./storage"

const JWT_SECRET = process.env["JWT_SECRET"]!

export const jwtHelper = {
  sign: (userId: string) => jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" }),
  verify: (token: string) => jwt.verify(token, JWT_SECRET) as { exp: number; iat: number; userId: number },
}

export function calculateNewElo(userElo: number, opponentElo: number, result: "draw" | "loss" | "win", k = 32) {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - userElo) / 400))
  const newElo = userElo + k * ({ draw: 0.5, loss: 0, win: 1 }[result] - expectedScore)

  return Math.round(newElo)
}

export async function createGame({ blackId, io, whiteId }: { blackId: string; io: Server; whiteId: string }) {
  try {
    const [whiteUser, blackUser] = await db.$transaction([
      db.user.findUnique({
        select: { avatar: true, id: true, stats: { select: { elo: true } }, username: true },
        where: { id: whiteId },
      }),
      db.user.findUnique({
        select: { avatar: true, id: true, stats: { select: { elo: true } }, username: true },
        where: { id: blackId },
      }),
    ])
    if (!whiteUser || !blackUser) return

    const whiteSocket = onlineUsers.get(whiteUser.id)
    const blackSocket = onlineUsers.get(blackUser.id)
    if (!whiteSocket || !blackSocket) return

    const roomId = crypto.randomUUID()

    io.sockets.sockets.get(whiteSocket.socketId)?.join(roomId)
    io.sockets.sockets.get(blackSocket.socketId)?.join(roomId)

    playerRooms.set(whiteUser.id, roomId)
    playerRooms.set(blackUser.id, roomId)

    activeGames.set(roomId, {
      black: { socketId: blackSocket.socketId, userId: blackUser.id },
      chess: new Chess(),
      white: { socketId: whiteSocket.socketId, userId: whiteUser.id },
    })

    updateFriendStatus(io, whiteUser.id, "playing")
    updateFriendStatus(io, blackUser.id, "playing")

    io.to(whiteSocket.socketId).emit("matchmaking:join", {
      avatar: blackUser.avatar,
      color: "white",
      elo: blackUser.stats.elo,
      username: blackUser.username,
    })

    io.to(blackSocket.socketId).emit("matchmaking:join", {
      avatar: whiteUser.avatar,
      color: "black",
      elo: whiteUser.stats.elo,
      username: whiteUser.username,
    })
  } catch (err) {
    console.error(err)
  }
}

export function determineGameResult(chess: Chess) {
  if (chess.isCheckmate()) return { result: "Checkmate", winner: chess.turn() === "w" ? "black" : "white" }
  if (chess.isStalemate()) return { result: "Stalemate", winner: null }
  if (chess.isInsufficientMaterial()) return { result: "Insufficient material", winner: null }
  if (chess.isThreefoldRepetition()) return { result: "Three fold repetition", winner: null }
  if (chess.isDrawByFiftyMoves()) return { result: "50 move rule", winner: null }

  return null
}

export async function updateFriendStatus(io: Server, userId: string, status: "online" | "playing" | undefined) {
  try {
    const friends = await db.friend.findMany({ select: { friendId: true }, where: { userId } })

    friends.forEach(({ friendId }) => {
      const onlineFriend = onlineUsers.get(friendId)
      if (onlineFriend) io.to(onlineFriend.socketId).emit("friend:status", { status, userId })
    })
  } catch (err) {
    console.error(err)
  }
}
