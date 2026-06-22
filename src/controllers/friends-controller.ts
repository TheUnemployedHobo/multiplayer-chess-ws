import type { RequestHandler } from "express"

import db from "prisma/db"

export const friendGet: RequestHandler = async (req, res) => {
  const { userId } = req.body

  const friends = await db.friend.findMany({
    select: {
      friend: {
        select: {
          avatar: true,
          id: true,
          stats: true,
          username: true,
        },
      },
    },
    where: { userId },
  })

  res.json(friends)
}
