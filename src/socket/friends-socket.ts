import type { Server, Socket } from "socket.io"

import db from "prisma/db"

import { friendStatusUpdate, onlineUsers } from "./utilities"

const friendsSocket = (io: Server, socket: Socket) => {
  const { userId } = socket.data

  socket.on("friends:incoming-request", ({ friendId, ...senderInfo }) => {
    const friend = onlineUsers.get(friendId)
    const payload = { ...senderInfo, userId }

    if (friend) io.to(friend.socketId).emit("friends:incoming-request", payload)
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

      const friend = onlineUsers.get(friendId)
      if (friend) io.to(friend.socketId).emit("friends:accept-request", `You and ${me.username} are now friends`)
    } catch (err) {
      console.error(err)
    }
  })

  friendStatusUpdate(io, userId, "online")
}

export default friendsSocket
