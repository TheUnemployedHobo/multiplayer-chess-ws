import type { RequestHandler } from "express"

import db from "prisma/db"

export const matchGet: RequestHandler = async (req, res) => {
  const { userId } = req.body
  const { skip, take } = req.query

  const foundMatches = await db.match.findMany({
    select: {
      opponent: { select: { avatar: true, username: true } },
      playedAt: true,
      result: true,
    },
    where: { userId },
    ...(!Number(take) ? {} : { take: Math.trunc(Number(take)) }),
    ...(!Number(skip) ? {} : { skip: Math.trunc(Number(skip)) }),
  })

  res.json(foundMatches)
}

export const matchInsert: RequestHandler = async (req, res) => {
  const { opponentId, result, userId } = req.body

  await db.match.createMany({ data: { opponentId, result, userId } })

  res.sendStatus(201)
}
