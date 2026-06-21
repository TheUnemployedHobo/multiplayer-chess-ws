import "dotenv/config"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env["JWT_SECRET"]!

export const jwtHelper = {
  sign: (userId: string) => jwt.sign({ userId }, JWT_SECRET, { expiresIn: "24h" }),
  verify: (token: string) => jwt.verify(token, JWT_SECRET) as { exp: number; iat: number; userId: number },
}
