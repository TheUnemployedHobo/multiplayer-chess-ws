import type { RequestHandler } from "express"

import db from "prisma/db"

import { onlineUsers } from "@/socket/utilities"

export const friendGet: RequestHandler = async (req, res) => {
  const { userId } = req.body

  const friends = await db.friend.findMany({
    select: {
      friend: {
        select: {
          avatar: true,
          id: true,
          signup_date: true,
          stats: true,
          username: true,
        },
      },
    },
    where: { userId },
  })

  const response = friends.map(({ friend }) => ({
    ...friend,
    status: onlineUsers.get(friend.id)?.status,
  }))

  res.json(response)
}
