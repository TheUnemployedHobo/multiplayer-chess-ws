import type { Server, Socket } from "socket.io"

import db from "prisma/db"

import { onlineUsers } from "./storage"

const friendsSocket = (io: Server, socket: Socket) => {
  const { userId } = socket.data

  socket.on("friends:incoming-request", ({ friendId, ...senderInfo }) => {
    const friendSocketId = onlineUsers.get(friendId)
    const payload = { ...senderInfo, userId }

    if (friendSocketId) io.to(friendSocketId).emit("friends:incoming-request", payload)
  })

  socket.on("friends:accept-request", async (friendId) => {
    try {
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
    } catch (err) {
      console.error(err)
    }
  })
}

export default friendsSocket
