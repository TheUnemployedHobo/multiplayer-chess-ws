import type { Server } from "socket.io"

import db from "prisma/db"

import { jwtHelper } from "@/lib/utils"

import { onlineUsers } from "./storage"

const initiateSocketIO = (io: Server) => {
  io.use((socket, next) => {
    try {
      const { jwt } = socket.handshake.auth
      if (!jwt) return next(new Error("Unauthorized"))

      const { userId } = jwtHelper.verify(jwt)
      socket.data.userId = userId

      next()
    } catch {
      next(new Error("Unauthorized"))
    }
  })

  io.on("connection", (socket) => {
    const { userId } = socket.data

    onlineUsers.set(userId, socket.id)

    io.emit("users:online-count", onlineUsers.size)

    socket.on("friends:incoming-request", ({ friendId, ...senderInfo }) => {
      const friendSocketId = onlineUsers.get(friendId)
      const payload = { ...senderInfo, userId }

      if (friendSocketId) io.to(friendSocketId).emit("friends:incoming-request", payload)
    })

    socket.on("friends:accept-request", async (friendId) => {
      const [{ user: me }, { user: them }] = await db.$transaction([
        db.friend.create({
          data: { friendId: friendId, userId: userId },
          select: { user: { select: { username: true } } },
        }),
        db.friend.create({
          data: { friendId: userId, userId: friendId },
          select: { user: { select: { username: true } } },
        }),
      ])

      socket.emit("friends:accept-request", `You and ${them.username} are now friends`)

      const friendSocketId = onlineUsers.get(friendId)
      if (friendSocketId) io.to(friendSocketId).emit("friends:accept-request", `You and ${me.username} are now friends`)
    })

    socket.on("disconnect", () => {
      onlineUsers.delete(userId)
    })
  })
}

export default initiateSocketIO
