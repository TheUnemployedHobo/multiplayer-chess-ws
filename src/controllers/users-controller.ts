import type { RequestHandler } from "express"

import { compare, genSalt, hash } from "bcrypt"
import { ConflictError, NotFoundError, UnauthenticatedError } from "express-error-toolkit"
import db from "prisma/db"

import { jwtHelper } from "@/lib/utils"

export const userLogIn: RequestHandler = async (req, res) => {
  const { password, username } = req.body

  const foundUser = await db.user.findUnique({ where: { username } })
  if (!foundUser) throw new UnauthenticatedError("Incorrect credentials")

  const isPassCorrect = await compare(password, foundUser.password)
  if (!isPassCorrect) throw new UnauthenticatedError("Incorrect credentials")

  res.json({
    avatar: foundUser.avatar,
    jwt: jwtHelper.sign(foundUser.id),
    signup_date: foundUser.signup_date,
    stats: foundUser.stats,
    username: foundUser.username,
  })
}

export const userRegister: RequestHandler = async (req, res) => {
  const { avatar, elo, password, username } = req.body

  const salt = await genSalt(8)
  const hashedPassword = await hash(password, salt)

  const foundUser = await db.user.findUnique({ where: { username } })
  if (foundUser) throw new ConflictError("User with this username already exists")

  await db.user.create({
    data: {
      avatar,
      password: hashedPassword,
      stats: { elo, games: 0, losses: 0, wins: 0 },
      username,
    },
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
    select: { avatar: true, signup_date: true, stats: true, username: true },
    where: { id: userId },
  })
  if (!foundUser) throw new NotFoundError("User not found")

  res.json(foundUser)
}
