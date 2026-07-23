import type { Server, Socket } from "socket.io"

import db from "prisma/db"

import { onlineUsers } from "@/lib/storage"
import { createGame, updateFriendStatus } from "@/lib/utils"

type FriendEventPayload = { partyA: { avatar: string; username: string }; partyB: { id: string; username: string } }

export default function registerFriendEvents(io: Server, socket: Socket) {
  const { userId } = socket.data

  socket.on("friend:request", ({ partyA, partyB }: FriendEventPayload) => {
    const friend = onlineUsers.get(partyB.id)
    if (!friend) return

    io.to(friend.socketId).emit("friend:request", { ...partyA, description: "Wants to be your friend", id: userId })
  })

  socket.on("friend:request:accept", async (friendId: string) => {
    try {
      const [{ user: me }, { user: them }] = await db.$transaction([
        db.friend.create({ data: { friendId: friendId, userId: userId }, select: { user: true } }),
        db.friend.create({ data: { friendId: userId, userId: friendId }, select: { user: true } }),
      ])

      socket.emit("friend:request:accept", `You and ${them.username} are now friends`)

      const friend = onlineUsers.get(friendId)
      if (friend) io.to(friend.socketId).emit("friend:request:accept", `You and ${me.username} are now friends`)
    } catch (err) {
      console.error(err)
    }
  })

  socket.on("friend:unfriend", async (friendId: string) => {
    try {
      const [{ friend: friendInfo }] = await db.$transaction([
        db.friend.delete({ select: { friend: true }, where: { userId_friendId: { friendId, userId } } }),
        db.friend.delete({ where: { userId_friendId: { friendId: userId, userId: friendId } } }),
      ])

      socket.emit("friend:unfriend", `You're no longer friends with ${friendInfo.username}`)

      const friend = onlineUsers.get(friendId)
      if (friend) io.to(friend.socketId).emit("friend:unfriend", undefined)
    } catch (err) {
      console.error(err)
    }
  })

  socket.on("friend:invite", ({ partyA, partyB }: FriendEventPayload) => {
    const friend = onlineUsers.get(partyB.id)
    if (!friend || friend.status !== "online") return

    socket.emit("friend:invite", { payload: `Invite sent to ${partyB.username}`, role: "inviter" })
    io.to(friend.socketId).emit("friend:invite", { payload: { ...partyA, description: "Wants to play", id: userId }, role: "invitee" })
  })

  socket.on("friend:invite:accept", (friendId: string) => createGame({ blackId: userId, io, whiteId: friendId }))

  updateFriendStatus(io, userId, "online")
}
