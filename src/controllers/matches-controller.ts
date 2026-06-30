import type { RequestHandler } from "express"

import db from "prisma/db"

// import { calculateNewElo } from "@/lib/utils"

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

//? This is not practical. It should be moved to an independent function.

// export const matchInsert: RequestHandler = async (req, res) => {
//   const { opponentId, result, userId } = req.body

//   const match = await db.match.create({
//     data: { opponentId, result, userId },
//     select: {
//       opponent: { select: { stats: true } },
//       user: { select: { stats: true } },
//     },
//   })

//   const newStats = {
//     elo: calculateNewElo(match.user.stats.elo, match.opponent.stats.elo, result),
//     games: match.user.stats.games + 1,
//     losses: match.user.stats.losses + Number(result === "loss"),
//     wins: match.user.stats.wins + Number(result === "win"),
//   }

//   await db.user.update({ data: { stats: newStats }, where: { id: userId } })

//   res.sendStatus(201)
// }
