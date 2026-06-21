import type { RequestHandler } from "express"

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

export const validateJwt: RequestHandler = (req, res, next) => {
  try {
    const authToken = req.headers.authorization
    if (!authToken) return res.sendStatus(401)

    const verifiedToken = jwtHelper.verify(authToken)

    req.body = { ...req.body, userId: verifiedToken.userId }

    next()
  } catch (error) {
    console.error(error)
    res.sendStatus(500)
  }
}
