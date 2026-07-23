import type { RequestHandler } from "express"
import type { Socket } from "socket.io"

import { UnauthenticatedError } from "express-error-toolkit"
import { type ValidationChain, validationResult } from "express-validator"

import { jwtHelper } from "@/lib/utils"

export const validateReq = (validators: ValidationChain[]): RequestHandler[] => [
  ...validators,
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json(errors.mapped())

    next()
  },
]

export const validateJwt: RequestHandler = (req, _, next) => {
  const { authorization } = req.headers
  if (!authorization) throw new UnauthenticatedError("JWT required")

  const { userId } = jwtHelper.verify(authorization)

  req.body = { ...req.body, userId }

  next()
}

export const validateSocketJwt = (socket: Socket, next: (err?: Error) => void) => {
  try {
    const { jwt } = socket.handshake.auth
    if (!jwt) return next(new Error("Unauthorized"))

    const { userId } = jwtHelper.verify(jwt)
    socket.data.userId = userId

    next()
  } catch {
    next(new Error("Unauthorized"))
  }
}
