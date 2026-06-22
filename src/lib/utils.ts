import "dotenv/config"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env["JWT_SECRET"]!

export const jwtHelper = {
  sign: (userId: string) => jwt.sign({ userId }, JWT_SECRET, { expiresIn: "24h" }),
  verify: (token: string) => jwt.verify(token, JWT_SECRET) as { exp: number; iat: number; userId: number },
}

const resultInNum = { draw: 0.5, loss: 0, win: 1 } as const

export const calculateNewElo = (userElo: number, opponentElo: number, result: "draw" | "loss" | "win", k = 32) => {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - userElo) / 400))
  const newElo = userElo + k * (resultInNum[result] - expectedScore)

  return Math.round(newElo)
}
