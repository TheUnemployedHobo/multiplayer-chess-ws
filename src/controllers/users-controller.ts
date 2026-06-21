import type { RequestHandler } from "express"

import { compare, genSalt, hash } from "bcrypt"
import { NotFoundError, UnauthenticatedError } from "express-error-toolkit"
import db from "prisma/db"

import { jwtHelper } from "@/lib/utils"

export const userLogIn: RequestHandler = async (req, res) => {
  const { password, username } = req.body

  const foundUser = await db.user.findUnique({ where: { username } })
  if (!foundUser) throw new UnauthenticatedError("Incorrect credentials")

  const isPassCorrect = await compare(password, foundUser.password)
  if (!isPassCorrect) throw new UnauthenticatedError("Incorrect credentials")

  res.send(jwtHelper.sign(foundUser.id))
}

export const userRegister: RequestHandler = async (req, res) => {
  const { avatar, password, username } = req.body

  const salt = await genSalt(8)
  const hashedPassword = await hash(password, salt)

  const stats = { elo: 300, games: 0, losses: 0, wins: 0 }
  await db.user.create({
    data: { avatar, password: hashedPassword, stats, username },
  })

  res.sendStatus(201)
}

export const userUpdate: RequestHandler = async (req, res) => {
  const { avatar, password, userId, username } = req.body

  const foundUser = await db.user.findUnique({ where: { id: userId } })
  if (!foundUser) throw new NotFoundError("User not found")

  const newData = {
    avatar: avatar || foundUser.avatar,
    password,
    username: username || foundUser.username,
  }

  if (password) {
    const salt = await genSalt(8)
    const hashedPassword = await hash(password, salt)
    newData.password = hashedPassword
  } else newData.password = foundUser.password

  await db.user.update({ data: newData, where: { id: userId } })

  res.sendStatus(200)
}

export const userDelete: RequestHandler = async (req, res) => {
  const { userId } = req.body

  const foundUser = await db.user.findUnique({ where: { id: userId } })
  if (!foundUser) throw new NotFoundError("User not found")

  await db.user.delete({ where: { id: userId } })

  res.sendStatus(200)
}

export const userGet: RequestHandler = async (req, res) => {
  const { userId } = req.body

  const foundUser = await db.user.findUnique({
    select: {
      avatar: true,
      signup_date: true,
      stats: true,
      username: true,
    },
    where: { id: userId },
  })
  if (!foundUser) throw new NotFoundError("User not found")

  res.json(foundUser)
}
