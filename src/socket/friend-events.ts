import type { Server, Socket } from "socket.io"

import db from "prisma/db"

import { onlineUsers } from "@/lib/storage"
import { createGame, updateFriendStatus } from "@/lib/utils"

type InvitePayloadType = { invitee: { id: string; username: string }; inviter: { avatar: string; username: string } }

export default function registerFriendEvents(io: Server, socket: Socket) {
  const { userId } = socket.data

  socket.on("friend:incoming-request", ({ friendId, ...senderInfo }) => {
    const friend = onlineUsers.get(friendId)
    const payload = { ...senderInfo, userId }

    if (friend) io.to(friend.socketId).emit("friend:incoming-request", payload)
  })

  socket.on("friend:accept-request", async (friendId) => {
    try {
      const [{ user: me }, { user: them }] = await db.$transaction([
        db.friend.create({ data: { friendId: friendId, userId: userId }, select: { user: { select: { username: true } } } }),
        db.friend.create({ data: { friendId: userId, userId: friendId }, select: { user: { select: { username: true } } } }),
      ])

      socket.emit("friend:accept-request", `You and ${them.username} are now friends`)

      const friend = onlineUsers.get(friendId)
      if (friend) io.to(friend.socketId).emit("friend:accept-request", `You and ${me.username} are now friends`)
    } catch (err) {
      console.error(err)
    }
  })

  socket.on("friend:unfriend", async (friendId) => {
    try {
      await db.friend.deleteMany({
        where: {
          OR: [
            { friendId: friendId, userId: userId },
            { friendId: userId, userId: friendId },
          ],
        },
      })

      socket.emit("friend:unfriend", undefined)

      const friend = onlineUsers.get(friendId)
      if (friend) io.to(friend.socketId).emit("friend:unfriend", undefined)
    } catch (err) {
      console.error(err)
    }
  })

  socket.on("friend:invite-to-game", ({ invitee, inviter }: InvitePayloadType) => {
    const friend = onlineUsers.get(invitee.id)
    if (!friend || friend.status !== "online") return

    const description = "Wants to play"

    socket.emit("friend:invite-to-game", { payload: `Invite sent to ${invitee.username}`, role: "inviter" })
    io.to(friend.socketId).emit("friend:invite-to-game", { payload: { ...inviter, description, id: userId }, role: "invitee" })
  })

  socket.on("friend:invite-to-game:accept", (friendId: string) => createGame({ blackId: userId, io, whiteId: friendId }))

  updateFriendStatus(io, userId, "online")
}
