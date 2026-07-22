import type { Server, Socket } from "socket.io"

import { Chess } from "chess.js"
import db from "prisma/db"

import { activeGames, onlineUsers, playerRooms } from "@/lib/storage"
import { updateFriendStatus } from "@/lib/utils"

type InvitePayloadType = { invitee: { id: string; username: string }; inviter: { avatar: string; username: string } }

const registerFriendEvents = (io: Server, socket: Socket) => {
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

  socket.on("friend:invite-to-game:accept", async (friendId: string) => {
    try {
      console.log(friendId)

      const [whiteUser, blackUser] = await db.$transaction([
        db.user.findUnique({
          select: { avatar: true, id: true, stats: { select: { elo: true } }, username: true },
          where: { id: userId },
        }),
        db.user.findUnique({
          select: { avatar: true, id: true, stats: { select: { elo: true } }, username: true },
          where: { id: friendId },
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
        black: { socketId: blackSocket.socketId, userId: whiteUser.id },
        chess: new Chess(),
        white: { socketId: whiteSocket.socketId, userId: blackUser.id },
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
  })

  updateFriendStatus(io, userId, "online")
}

export default registerFriendEvents
