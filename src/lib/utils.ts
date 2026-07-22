import "dotenv/config"
import type { Chess } from "chess.js"
import type { Server } from "socket.io"

import jwt from "jsonwebtoken"
import db from "prisma/db"

import { onlineUsers } from "./storage"

const JWT_SECRET = process.env["JWT_SECRET"]!

export const jwtHelper = {
  sign: (userId: string) => jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" }),
  verify: (token: string) => jwt.verify(token, JWT_SECRET) as { exp: number; iat: number; userId: number },
}

export const calculateNewElo = (userElo: number, opponentElo: number, result: "draw" | "loss" | "win", k = 32) => {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - userElo) / 400))
  const newElo = userElo + k * ({ draw: 0.5, loss: 0, win: 1 }[result] - expectedScore)

  return Math.round(newElo)
}

export const updateFriendStatus = async (io: Server, userId: string, status: "online" | "playing" | undefined) => {
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

export const sendOnlineCount = (io: Server) => io.emit("users:online-count", onlineUsers.size)

export const determineGameResult = (chess: Chess) => {
  if (chess.isCheckmate()) return { result: "Checkmate", winner: chess.turn() === "w" ? "Black" : "White" }
  if (chess.isStalemate()) return { result: "Stalemate", winner: null }
  if (chess.isInsufficientMaterial()) return { result: "Insufficient material", winner: null }
  if (chess.isThreefoldRepetition()) return { result: "Three fold repetition", winner: null }
  if (chess.isDrawByFiftyMoves()) return { result: "50 move rule", winner: null }

  return null
}
